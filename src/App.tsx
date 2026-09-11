import { useState } from 'react';
import { describeWord, formatWordWithArticle, wordKey } from './data/frenchWords';
import { createLesson, createLessonOrder, LESSON_SIZE, sentenceParts } from './services/lessons';
import { Pronunciation } from './components/Pronunciation';
import type { Word } from './types';
import './index.css';

function WordIllustration({ word }: { word: Word }) {
  const [failed, setFailed] = useState(false);
  if (!word.image || failed) return null;
  return (
    <figure className="word-illustration">
      <img src={`${import.meta.env.BASE_URL}images/${word.image}`} alt={`Illustration : ${word.word}`} width="220" height="220" onError={() => setFailed(true)} />
    </figure>
  );
}

function App() {
  const [session, setSession] = useState(() => {
    const order = createLessonOrder();
    return { order, lesson: createLesson(order[0]), index: 0, furthest: 0, round: 1 };
  });
  const { lesson, index, furthest, round } = session;
  const isSentence = index === LESSON_SIZE;
  const currentWord = lesson.words[Math.min(index, LESSON_SIZE - 1)];
  const displayText = isSentence ? lesson.example.text : formatWordWithArticle(currentWord);
  const [showHelp, setShowHelp] = useState(false);
  const [showWords, setShowWords] = useState(false);
  const seenWords = lesson.words.slice(0, Math.min(furthest + 1, LESSON_SIZE));

  const next = () => setSession(previous => {
    if (previous.index < LESSON_SIZE) return { ...previous, index: previous.index + 1, furthest: Math.max(previous.furthest, previous.index + 1) };
    const remaining = previous.order.slice(1);
    const order = remaining.length ? remaining : createLessonOrder(previous.lesson.example.id);
    return { order, lesson: createLesson(order[0]), index: 0, furthest: 0, round: previous.round + 1 };
  });

  return (
    <main className="classroom">
      <div className="blackboard">
        <header className="board-header">
          <a className="brand" href={import.meta.env.BASE_URL} aria-label="Motamot, accueil">motamot<span aria-hidden="true">.</span></a>
          <div className="header-right"><span className="language-label">FRANÇAIS</span><button className="help-button" aria-expanded={showHelp} aria-controls="how-it-works" onClick={() => setShowHelp(value => !value)} aria-label="Comment apprendre avec Motamot">?</button></div>
        </header>

        {showHelp && <aside id="how-it-works" className="help-panel">
          <strong>Un mot après l’autre.</strong>
          <p>Découvrez dix mots, puis retrouvez-en plusieurs dans une petite scène du quotidien. Écoutez, revenez en arrière et prenez votre temps.</p>
          <p>Les phrases sont préparées à l’avance pour préserver le sens et les accords. Les mots supplémentaires viennent de tout le lexique.</p>
          <p>Une voix féminine française vous accompagne. Les enregistrements sont créés par synthèse vocale et se chargent à la demande. Cochez « Lentement » pour écouter à votre rythme.</p>
        </aside>}

        <div className="lesson-heading">
          <span className="eyebrow">LA PETITE LEÇON</span>
          <span className="lesson-number">n° {String(round).padStart(2, '0')}</span>
        </div>

        <section className={`learning-surface ${isSentence ? 'sentence-surface' : ''}`} aria-label={isSentence ? 'Les mots en contexte' : 'Vocabulaire'}>
          <div className="word-meta"><span className="tiny-line" />{isSentence ? 'Les mots prennent vie' : describeWord(currentWord)}<span className="tiny-line" /></div>
          <div className="lesson-content" aria-live="polite" aria-atomic="true">
            {isSentence ? (
              <h1 className="sentence">{sentenceParts(lesson.example).map((part, i) => part.highlighted ? <mark key={i}>{part.text}</mark> : part.text)}</h1>
            ) : (
              <>
                <h1 className="vocabulary-word">{displayText}</h1>
                <WordIllustration key={wordKey(currentWord)} word={currentWord} />
              </>
            )}
          </div>
          <Pronunciation text={displayText} />
          {isSentence && <div className="grammar-note"><span>Le petit déclic</span><p>{lesson.example.note}</p></div>}
        </section>

        <footer className="lesson-footer">
          <div className="progress-label"><span>{isSentence ? 'Dix mots, une petite scène.' : 'Dix mots, puis une phrase.'}</span><span>{isSentence ? '10 / 10' : `${index + 1} / 10`}</span></div>
          <div className="progress-track" role="progressbar" aria-label="Progression de la leçon" aria-valuemin={0} aria-valuemax={LESSON_SIZE} aria-valuenow={isSentence ? LESSON_SIZE : index + 1}>
            {lesson.words.map((word, i) => <span key={wordKey(word)} className={i <= index ? 'filled' : ''} />)}
          </div>
          <div className="navigation">
            <button className="back-button" disabled={index === 0} onClick={() => setSession(previous => ({ ...previous, index: Math.max(0, previous.index - 1) }))}><span aria-hidden="true">←</span> Retour</button>
            <button className="next-button" onClick={next}>{isSentence ? 'Une autre leçon' : index === LESSON_SIZE - 1 ? 'Découvrir la phrase' : 'Le mot suivant'}<span aria-hidden="true">→</span></button>
          </div>
          <button className="word-review-toggle" aria-expanded={showWords} aria-controls="discovered-words" onClick={() => setShowWords(value => !value)}>
            {showWords ? 'Masquer les mots' : 'Revoir les mots'} <span>({seenWords.length})</span>
          </button>
          <div id="discovered-words" className={`word-notebook${showWords ? ' is-open' : ''}`} aria-label="Mots découverts">
            {seenWords.map((word, i) => <button key={wordKey(word)} className={!isSentence && index === i ? 'current' : ''} aria-label={`Revoir : ${formatWordWithArticle(word)}`} aria-current={!isSentence && index === i ? 'step' : undefined} onClick={() => setSession(previous => ({ ...previous, index: i }))}>{formatWordWithArticle(word)}</button>)}
          </div>
        </footer>
        <div className="board-signature" aria-hidden="true">À demain, ou à tout de suite.</div>
      </div>
    </main>
  );
}

export default App;
