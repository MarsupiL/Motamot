import { useEffect, useState } from 'react';
import { formatWordWithArticle, wordKey } from './data/frenchWords';
import { LESSON_SIZE, sentenceParts } from './services/lessons';
import { createSession, nextInSession, previousInSession, revisitWord } from './services/session';
import { useLessonGestures } from './hooks/useLessonGestures';
import { Pronunciation } from './components/Pronunciation';
import { translateSentence, translateWord } from './services/translations';
import { browserStorage, clearSeen, readSeen, saveSeen } from './services/progress';
import { examples } from './data/sentences';
import type { Word } from './types';

function WordIllustration({ word }: { word: Word }) {
  const [failed, setFailed] = useState(false);
  if (!word.image || failed) return null;
  return (
    <figure className="word-illustration">
      <img src={`${import.meta.env.BASE_URL}images/${word.image}`} alt={`Illustration : ${word.word}`} width="220" height="220" draggable={false} onError={() => setFailed(true)} />
    </figure>
  );
}

function App() {
  const [storage, setStorage] = useState(browserStorage);
  const [session, setSession] = useState(() => createSession(Math.random, readSeen(storage)));
  const [canRemember, setCanRemember] = useState(Boolean(storage));
  const [showHelp, setShowHelp] = useState(false);
  const [showWords, setShowWords] = useState(false);

  useEffect(() => { setCanRemember(saveSeen(storage, session.seen)); }, [storage, session.seen]);

  const next = () => {
    const latestSeen = readSeen(storage);
    setSession(previous => nextInSession(previous, Math.random, latestSeen));
  };
  const back = () => setSession(previousInSession);
  const gestures = useLessonGestures(direction => {
    if (direction === 'next') next();
    else back();
  });
  const review = () => {
    const cleared = clearSeen(storage);
    setCanRemember(cleared);
    if (!cleared) setStorage(undefined);
    setShowWords(false);
    setSession(createSession(Math.random, [], session.visited[session.lessonIndex]?.lesson.example.id));
  };

  if (session.completed) return (
    <main className="classroom">
      <div className="blackboard">
        <header className="board-header"><a className="brand" href={import.meta.env.BASE_URL}>motamot<span aria-hidden="true">.</span></a></header>
        <section className="learning-surface" aria-live="polite">
          <h1 className="sentence">Vous avez découvert les {examples.length} phrases.</h1>
          <p className="english-translation" lang="en">You’ve explored all {examples.length} sentences.</p>
          <p className="collection-note">Vous pouvez maintenant les revoir à votre rythme.</p>
          <p className="english-translation" lang="en">You can now revisit them at your own pace.</p>
        </section>
        <footer className="lesson-footer navigation">
          {session.visited.length > 0 && <button className="back-button" onClick={back}>← Retour</button>}
          <button className="next-button" onClick={review}>Revoir les phrases <span aria-hidden="true">↻</span></button>
        </footer>
      </div>
    </main>
  );

  const { index, lessonIndex } = session;
  const { lesson, furthest } = session.visited[lessonIndex];
  const round = lessonIndex + 1;
  const isSentence = index === LESSON_SIZE;
  const currentWord = lesson.words[Math.min(index, LESSON_SIZE - 1)];
  const displayText = isSentence ? lesson.example.text : formatWordWithArticle(currentWord);
  const englishText = isSentence ? translateSentence(displayText) : translateWord(currentWord);
  const seenWords = lesson.words.slice(0, Math.min(furthest + 1, LESSON_SIZE));

  return (
    <main className="classroom">
      <div className="blackboard">
        <header className="board-header">
          <a className="brand" href={import.meta.env.BASE_URL} aria-label="Motamot, accueil">motamot<span aria-hidden="true">.</span></a>
          <div className="header-right"><span className="language-label">FRANÇAIS</span><button className="help-button" aria-expanded={showHelp} aria-controls="how-it-works" onClick={() => setShowHelp(value => !value)} aria-label="Comment apprendre avec Motamot">?</button></div>
        </header>

        {showHelp && <aside id="how-it-works" className="help-panel">
          <strong>Un mot après l’autre.</strong>
          <p>Découvrez {LESSON_SIZE} mots, puis retrouvez-en plusieurs dans une petite scène du quotidien. Écoutez, revenez en arrière et prenez votre temps.</p>
          <p>Sur un parcours complet de {examples.length} leçons avec ce programme, chaque entrée du dictionnaire revient dans au moins trois leçons différentes.</p>
          <p>Dans la zone du mot ou de la phrase, touchez la moitié droite pour avancer, ou la moitié gauche pour revenir. Vous pouvez aussi glisser vers la gauche pour avancer, et vers la droite pour revenir.</p>
          <p>Une voix féminine française vous accompagne. Les enregistrements sont créés par synthèse vocale et se chargent à la demande.</p>
          <p>{canRemember
            ? 'Les phrases déjà découvertes sont mémorisées dans ce navigateur. La collection ne recommence que si vous choisissez de la revoir.'
            : 'Ce navigateur ne permet pas de garder votre progression. Après un rechargement, certaines phrases peuvent revenir.'}</p>
        </aside>}

        <div className="lesson-heading">
          <span className="eyebrow">LA PETITE LEÇON</span>
          <span className="lesson-number">n° {String(round).padStart(2, '0')}</span>
        </div>

        <section className="learning-surface" aria-label={isSentence ? 'Les mots en contexte' : 'Vocabulaire'} {...gestures}>
          <div className="lesson-content" aria-live="polite" aria-atomic="true">
            {isSentence
              ? <h1 className="sentence">{sentenceParts(lesson.example).map((part, i) => part.highlighted ? <mark key={i}>{part.text}</mark> : part.text)}</h1>
              : <h1 className="vocabulary-word">{displayText}</h1>}
            <p className="english-translation" lang="en">{englishText}</p>
            {!isSentence && <WordIllustration key={wordKey(currentWord)} word={currentWord} />}
          </div>
          <Pronunciation key={`${lessonIndex}:${index}`} text={displayText} />
        </section>

        <footer className="lesson-footer">
          <div className="progress-label"><span>{isSentence ? 'Les mots prennent vie.' : 'Un mot après l’autre.'}</span><span>{isSentence ? LESSON_SIZE : index + 1} / {LESSON_SIZE}</span></div>
          <div className="progress-track" role="progressbar" aria-label="Progression de la leçon" aria-valuemin={0} aria-valuemax={LESSON_SIZE} aria-valuenow={isSentence ? LESSON_SIZE : index + 1}>
            {lesson.words.map((word, i) => <span key={wordKey(word)} className={i <= index ? 'filled' : ''} />)}
          </div>
          <div className="navigation">
            <button className="back-button" disabled={index === 0 && lessonIndex === 0} onClick={back}><span aria-hidden="true">←</span> Retour</button>
            <button className="next-button" onClick={next}>{isSentence ? 'Une autre leçon' : index === LESSON_SIZE - 1 ? 'Découvrir la phrase' : 'Le mot suivant'}<span aria-hidden="true">→</span></button>
          </div>
          <button className="word-review-toggle" aria-expanded={showWords} aria-controls="discovered-words" onClick={() => setShowWords(value => !value)}>
            {showWords ? 'Masquer les mots' : 'Revoir les mots'} <span>({seenWords.length})</span>
          </button>
          <div id="discovered-words" className={`word-notebook${showWords ? ' is-open' : ''}`} aria-label="Mots découverts">
            {seenWords.map((word, i) => <button key={wordKey(word)} className={!isSentence && index === i ? 'current' : ''} aria-label={`Revoir : ${formatWordWithArticle(word)}`} aria-current={!isSentence && index === i ? 'step' : undefined} onClick={() => setSession(previous => revisitWord(previous, i))}>{formatWordWithArticle(word)}</button>)}
          </div>
        </footer>
      </div>
    </main>
  );
}

export default App;
