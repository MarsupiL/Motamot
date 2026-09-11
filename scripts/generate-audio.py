"""Optional, offline maintenance tool. Learners only download the finished MP3s."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import lameenc
import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro


def sha256(path):
    with path.open('rb') as file:
        return hashlib.file_digest(file, 'sha256').hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', type=Path, required=True)
    parser.add_argument('--voices', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    texts = json.loads(subprocess.check_output(
        ['node', '--experimental-strip-types', 'scripts/audio-corpus.mjs'], cwd=root,
    ))
    recipe = json.dumps({
        'model': sha256(args.model), 'voices': sha256(args.voices),
        'voice': 'ff_siwis', 'language': 'fr-fr', 'speed': 1.0,
        'encoder': 'lameenc-1.8.1-80kbps-mono', 'pipeline': 'kokoro-onnx-0.6.1-v1',
    }, sort_keys=True)
    ort.disable_telemetry_events()
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(args.model), sess_options=options, providers=['CPUExecutionProvider'])
    kokoro = Kokoro.from_session(session, str(args.voices))
    output = root / 'public/audio'
    output.mkdir(parents=True, exist_ok=True)
    manifest = {}
    generated = 0

    for index, text in enumerate(texts):
        identifier = hashlib.sha256((recipe + '\n' + text).encode()).hexdigest()[:24]
        filename = f'{identifier}.mp3'
        destination = output / filename
        if not destination.exists():
            # A final stop gives isolated dictionary words a complete intonation.
            spoken = text if text[-1] in '.!?' else text + '.'
            samples, rate = kokoro.create(spoken, voice='ff_siwis', speed=1.0, lang='fr-fr')
            peak = np.max(np.abs(samples))
            if not np.isfinite(samples).all() or peak < 0.01 or not 0.2 < len(samples) / rate < 30:
                raise ValueError(f'Invalid generated audio for {text!r}')
            samples = samples * min(1.0, 0.98 / peak)
            # Leave breathing room around words, including on mobile decoders.
            samples = np.pad(samples, (int(rate * 0.06), int(rate * 0.12)))
            encoder = lameenc.Encoder()
            encoder.set_bit_rate(80)
            encoder.set_in_sample_rate(rate)
            encoder.set_channels(1)
            encoder.set_quality(2)
            pcm = (samples * 32767).astype(np.int16).tobytes()
            temporary = destination.with_suffix('.tmp')
            temporary.write_bytes(encoder.encode(pcm) + encoder.flush())
            temporary.replace(destination)
            generated += 1
        info = sf.info(destination)
        if info.samplerate != 24000 or info.channels != 1 or not 0.2 < info.duration < 30:
            raise ValueError(f'Invalid MP3 for {text!r}: {destination}')
        manifest[text] = filename
        if (index + 1) % 100 == 0 or index == len(texts) - 1:
            print(f'{index + 1}/{len(texts)} recordings ready', flush=True)

    # Publish the index only after every recording is available.
    target = root / 'src/data/pronunciations.json'
    target.with_suffix('.tmp').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    target.with_suffix('.tmp').replace(target)
    print(f'Generated {generated} recordings. Manifest covers {len(manifest)} texts.', flush=True)


if __name__ == '__main__':
    main()
