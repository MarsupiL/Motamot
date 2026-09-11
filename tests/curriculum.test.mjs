import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('the committed curriculum is reproducible and up to date with the complete dictionary and sentence library', () => {
  execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/generate-curriculum.mjs', '--check'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdio: 'pipe',
  });
});
