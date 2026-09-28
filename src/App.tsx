import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { bookOptions, getWordBookLabel, getWordUnitLabel, words } from './catalog';
import { checkIn, completeGrammar, ensureDay, getDayProgress, getStreak, localDate, recordAttempt, sanitizeState, type AppState } from './domain';
import { animatedStories, grammarQuestions, wordEnrichment } from './content';
import { useSpeech } from './useSpeech';

const wordById = Object.fromEntries(words.map(word => [word.id, word]));
const STORAGE_KEY = 'chii-english.learning.v1';
const SESSION_KEY = 'chii-english.session.v1';
const PREFS_KEY = 'chii-english.preferences.v1';
const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;
type View = 'home' | 'learn' | 'library' | 'grammar' | 'stories' | 'settings' | 'celebration';
type Session = { mode: 'new' | 'review' | 'practice'; ids: string[]; index: number; date: string };
type Feedback = { kind: 'correct' | 'incorrect' | 'self'; transcript?: string };
function safeRead(key: string): unknown { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function loadState() { return ensureDay(sanitizeState(safeRead(STORAGE_KEY), words), words, localDate()); }
function loadSession(): Session | null {
  const value = safeRead(SESSION_KEY) as Session | null;
  if (!value || value.date !== localDate() || !['new', 'review', 'practice'].includes(value.mode) || !Array.isArray(value.ids) || !value.ids.length || !value.ids.every(id => typeof id === 'string' && Object.hasOwn(wordById, id)) || !Number.isInteger(value.index) || value.index < 0 || value.index >= value.ids.length) return null;
  return value;
}
function normalizePrefs(raw: unknown) {
  const value = raw as { rate?: number; autoplay?: boolean } | null;
  return { rate: value?.rate === 0.8 ? 0.8 : 1, autoplay: value?.autoplay === true };
}
function loadPrefs() { return normalizePrefs(safeRead(PREFS_KEY)); }
function initialView(): View {
  const key = location.hash.slice(1);
  if (key === 'celebration' && loadState().checkIns.includes(localDate())) return 'celebration';
  return ['home', 'library', 'grammar', 'stories', 'settings'].includes(key) ? key as View : key === 'learn' && loadSession() ? 'learn' : 'home';
}
function Icon({ name, size = 24 }: { name: string; size?: number }) { return <img className="icon" src={asset(`icon-${name}.svg`)} width={size} height={size} alt="" />; }
function Mascot({ happy = false, className = '' }: { happy?: boolean; className?: string }) { return <img className={`mascot ${className}`} src={asset(`chiikawa-${happy ? 'celebrate' : 'reading'}.svg`)} alt={happy ? '吉伊开心地庆祝' : '捧着书陪你学习的吉伊'} />; }
function Button({ children, onClick, secondary = false, disabled = false, className = '' }: { children: ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean; className?: string }) { return <button className={`button ${secondary ? 'secondary' : ''} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>; }
function Heading({ title, subtitle, back }: { title: string; subtitle?: string; back?: () => void }) { return <header className="page-header">{back && <button className="icon-button" aria-label="返回" onClick={back}><Icon name="back" /></button>}<div><h1>{title}</h1>{subtitle && <p className="caption">{subtitle}</p>}</div></header>; }
function Progress({ value, max, label }: { value: number; max: number; label: string }) { return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={Math.max(1, max)} aria-valuenow={value}><div style={{ width: `${max ? Math.min(100, value / max * 100) : 100}%` }} /></div>; }

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<View>(initialView);
  const [date, setDate] = useState(localDate);
  const [session, setSession] = useState<Session | null>(loadSession);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [flipped, setFlipped] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [bookId, setBookId] = useState('');
  const [unit, setUnit] = useState('');
  const [modal, setModal] = useState<{ title: string; body: string; happy?: boolean } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [grammarOffset, setGrammarOffset] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const restoreInput = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const dateRef = useRef(date);
  const sessionRef = useRef(session);
  const stateRef = useRef(state);
  sessionRef.current = session;
  stateRef.current = state;
  const speech = useSpeech();
  const plan = state.days[date] ?? { date, newWordIds: [], reviewWordIds: [], practicedWordIds: [], grammarDone: false };
  const progress = getDayProgress(state, date);
  const mastered = Object.values(state.words).filter(word => word.mastered).length;
  const learned = Object.keys(state.words).length;
  const current = session ? wordById[session.ids[session.index]] : null;
  const currentProgress = current ? state.words[current.id] : undefined;
  const currentExtra = current ? wordEnrichment[current.word] : undefined;
  const grammarStart = Math.floor(Date.parse(`${date}T12:00:00Z`) / 86400000) % grammarQuestions.length;
  const question = grammarQuestions[(grammarStart + grammarOffset) % grammarQuestions.length];
  const story = animatedStories[storyIndex];
  const scene = story.scenes[sceneIndex];

  const refreshDay = useCallback(() => {
    const today = localDate();
    if (dateRef.current === today) return false;
    dateRef.current = today;
    speech.stop(); setPlaying(false); setSession(null); setFeedback(null); setFlipped(false);
    setAnswer(null); setGrammarOffset(0); setModal(null); setDate(today);
    setState(previous => ensureDay(previous, words, today));
    setView('home'); history.replaceState(null, '', '#home');
    setToast('新的一天，新的小冒险！昨天的学习记录已经保留。');
    return true;
  }, [speech.stop]);
  const mutate = useCallback((action: (previous: AppState, today: string) => AppState) => {
    if (refreshDay()) return false;
    const today = dateRef.current;
    setState(previous => action(ensureDay(previous, words, today), today));
    return true;
  }, [refreshDay]);
  const navigate = (next: View) => {
    if (refreshDay()) return;
    speech.stop(); setPlaying(false); setModal(null); setView(next);
    if (location.hash !== `#${next}`) history.pushState(null, '', `#${next}`);
  };
  useEffect(() => {
    const handleHash = () => {
      if (refreshDay()) return;
      const key = location.hash.slice(1);
      const next = ['home', 'library', 'grammar', 'stories', 'settings'].includes(key) ? key as View
        : key === 'learn' && sessionRef.current ? 'learn'
          : key === 'celebration' && stateRef.current.checkIns.includes(dateRef.current) ? 'celebration' : 'home';
      speech.stop(); setPlaying(false); setModal(null); setView(next);
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => { window.removeEventListener('hashchange', handleHash); window.removeEventListener('popstate', handleHash); };
  }, [speech.stop, refreshDay]);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }); }, [view]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setSaveError(''); } catch { setSaveError('这次进度暂时没能保存，请到学习设置导出备份。'); }
  }, [state]);
  useEffect(() => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { setSaveError('当前浏览器无法保存位置，请先导出学习备份。'); } }, [session]);
  useEffect(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* Learning state carries the storage warning. */ } }, [prefs]);
  useEffect(() => {
    const timer = window.setInterval(refreshDay, 30000);
    window.addEventListener('focus', refreshDay);
    return () => { clearInterval(timer); window.removeEventListener('focus', refreshDay); };
  }, [refreshDay]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = modalRef.current;
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setModal(null); }
      if (event.key !== 'Tab' || !dialog) return;
      const targets = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input, select, textarea, [tabindex="0"]')];
      const first = targets[0]; const last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); if (previous?.isConnected) previous.focus(); else mainRef.current?.focus({ preventScroll: true }); };
  }, [modal]);
  useEffect(() => { speech.stop(); speech.clearError(); setFeedback(null); setFlipped(false); }, [current?.id, speech.stop, speech.clearError]);
  useEffect(() => {
    if (!playing || view !== 'stories') return;
    let alive = true;
    const advance = () => {
      if (!alive) return;
      if (sceneIndex < story.scenes.length - 1) setSceneIndex(value => value + 1);
      else if (prefs.autoplay && storyIndex < animatedStories.length - 1) { setStoryIndex(value => value + 1); setSceneIndex(0); }
      else setPlaying(false);
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (speech.supportedSpeech) speech.speak(scene.text, prefs.rate, () => { timer = setTimeout(advance, 1100); });
    else timer = setTimeout(advance, 6500 / prefs.rate);
    return () => { alive = false; clearTimeout(timer); speech.stop(); };
  }, [playing, view, sceneIndex, storyIndex, prefs.rate, prefs.autoplay, speech.speak, speech.stop, speech.supportedSpeech, scene.text, story.scenes.length]);
  useEffect(() => { if (playing && speech.error) setPlaying(false); }, [speech.error, playing]);

  function startLearning(mode: Session['mode'], customIds?: string[]) {
    if (refreshDay()) return;
    const ids = customIds ?? (mode === 'review' ? plan.reviewWordIds : plan.newWordIds);
    if (!ids.length) { setModal({ title: mode === 'review' ? '今天没有待复习的词' : '这一册已经练过一遍啦', body: mode === 'review' ? '明天会安排还在学习中的词。今天可以继续新词或句子小游戏。' : '你可以到词库再练一练，后续补充的教材词表会加入新词计划。', happy: true }); return; }
    let index = mode === 'practice' ? 0 : ids.findIndex(id => !plan.practicedWordIds.includes(id));
    if (index < 0) index = 0;
    setSession({ mode, ids, index, date }); setFlipped(false); setFeedback(null); navigate('learn');
  }
  function primaryHomeAction() {
    if (refreshDay()) return;
    if (progress.checkedIn) { navigate('stories'); return; }
    if (progress.canCheckIn) { doCheckIn(); return; }
    if (progress.newDone < progress.newTotal) startLearning('new');
    else if (progress.reviewDone < progress.reviewTotal) startLearning('review');
    else { setAnswer(null); navigate('grammar'); }
  }
  function doCheckIn() {
    if (refreshDay()) return;
    if (!progress.canCheckIn || progress.checkedIn) {
      setModal({ title: progress.checkedIn ? '今天已经打卡啦' : '再完成一点点，就能点亮今天', body: progress.checkedIn ? '奖励已经收好，明天再和吉伊见面吧。' : `新词 ${progress.newDone}/${progress.newTotal} · 复习 ${progress.reviewDone}/${progress.reviewTotal} · 句子${progress.grammarDone ? '已完成' : '还没完成'}` }); return;
    }
    mutate((previous, today) => checkIn(previous, today)); navigate('celebration');
  }
  function practice(outcome: Feedback['kind'], transcript?: string, attemptId: string = crypto.randomUUID()) {
    if (refreshDay()) return;
    if (!current || !session || session.date !== localDate()) return;
    const wordId = current.id;
    mutate((previous, today) => recordAttempt(previous, { wordId, outcome, attemptId, date: today }));
    setFeedback({ kind: outcome, transcript }); setFlipped(true);
  }
  function nextWord() {
    if (refreshDay()) return;
    if (!session || !current) return;
    speech.stop();
    if (session.index + 1 >= session.ids.length) {
      const mode = session.mode; setSession(null); navigate(mode === 'practice' ? 'library' : 'home');
      setModal({ title: mode === 'review' ? '今天的复习完成啦！' : mode === 'practice' ? '又和一个单词交上了朋友' : '今日新词，全都练过啦！', body: mode === 'practice' ? '你的小进步已经记下来了。' : '学习记录已经记下，回到首页完成其他任务就能打卡。', happy: true }); return;
    }
    const next = session.index + 1;
    setSession({ ...session, index: next }); setFeedback(null); setFlipped(false);
    if (session.mode === 'new' && next % 5 === 0) setModal({ title: `第 ${next / 5} 关完成！`, body: `已经练过 ${next} 个词。伸个懒腰，和吉伊继续下一关吧。`, happy: true });
  }
  function finishGrammar(another = false) {
    if (!mutate((previous, today) => completeGrammar(previous, today))) return;
    if (another) { speech.stop(); setGrammarOffset(value => value + 1); setAnswer(null); }
    else { navigate('home'); setToast('今日句子任务完成啦！'); }
  }
  async function restoreBackup(file: File) {
    try {
      if (file.size > 5_000_000) throw new Error('备份文件过大，请选择吉伊英语导出的 JSON 文件。');
      const data = JSON.parse(await file.text());
      if (data?.format !== 'chii-english-backup' || data.version !== 1 || data.state?.schemaVersion !== 1 || !data.state.days || !data.state.words || !Array.isArray(data.state.checkIns)) throw new Error('这不是有效的吉伊英语学习备份。');
      const restored = sanitizeState(data.state, words);
      const today = localDate();
      if (Object.keys(restored.days).some(day => day > today) || Object.values(restored.words).some(word => word.lastPracticedOn > today)) throw new Error('备份里有未来日期，请先检查设备日期后再恢复。');
      if (!window.confirm('恢复备份将替换当前设备的学习进度和播放设置，确定继续吗？')) return;
      speech.stop(); setPlaying(false); setDate(today); dateRef.current = today;
      setState(ensureDay(restored, words, today)); setSession(null); setFeedback(null); setAnswer(null);
      setPrefs(normalizePrefs(data.prefs)); setToast('学习进度和播放设置已恢复');
    } catch (error) { setToast(error instanceof SyntaxError ? '文件无法读取，请选择吉伊英语导出的 JSON 备份文件。' : error instanceof Error ? error.message : '无法恢复这份学习备份。'); }
  }
  const primaryLabel = progress.checkedIn ? '今天完成啦 · 看个小故事' : progress.canCheckIn ? '完成今日打卡' : progress.newDone < progress.newTotal ? `${progress.newDone ? '继续' : '开始'}第 ${Math.min(4, Math.floor(progress.newDone / 5) + 1)} 关 · ${Math.min(5 - progress.newDone % 5, progress.newTotal - progress.newDone)} 个词` : progress.reviewDone < progress.reviewTotal ? '复习老朋友' : '玩一个句子小游戏';
  const tabs: { key: View; name: string; icon: string }[] = [{ key: 'home', name: '今天', icon: 'home' }, { key: 'library', name: '词库', icon: 'book' }, { key: 'stories', name: '动画', icon: 'film' }];
  const selectedBooks = bookOptions.filter(book => !bookId || book.id === bookId);
  const bookWords = words.filter(word => !bookId || word.bookId === bookId);
  const unitOptions = [...new Map(bookWords.map(word => [`${word.bookId}:${word.unit}`, { key: `${word.bookId}:${word.unit}`, label: `${bookId ? '' : `${getWordBookLabel(word, true)} · `}${getWordUnitLabel(word)}` }])).values()];
  const visibleWords = bookWords.filter(word => (!unit || `${word.bookId}:${word.unit}` === unit) && (filter === 'all' || (filter === 'mastered' ? state.words[word.id]?.mastered : filter === 'learning' ? state.words[word.id] && !state.words[word.id].mastered : !state.words[word.id])) && `${word.word} ${word.meaningZh}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <div className="app-backdrop"><div className="desktop-intro"><span className="brand-pill">CHII ENGLISH</span><h2>每天一点点，<br />离小目标近一点。</h2><p>和吉伊一起，把英语变成<br />每天都期待的小冒险。</p><div className="desktop-dots"><span /><span /><span /></div><p className="caption">校内同步优先 · 每日 20 个新词</p></div><div className="phone-shell">
    <main ref={mainRef} tabIndex={-1} inert={!!modal} className={`page page-${view}`}>
      {saveError && <div className="save-warning" role="alert">{saveError}<button onClick={() => navigate('settings')}>去备份</button></div>}
      {view === 'home' && <>
        <header className="home-header"><div><h1>Hi，小小冒险家！</h1><p className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} <span>/ 今天也要闪闪发光</span></p></div><button className="avatar-button" aria-label="打开学习设置" onClick={() => navigate('settings')}><Mascot /></button></header>
        <section className="hero"><div><span className="brand-pill">CHII ENGLISH</span><h2>每天一小步，<br />英语大冒险。</h2><p>吉伊陪你，快乐学英语</p></div><Mascot className="hero-mascot" /><span className="hero-sparkle">✦</span></section>
        <section className="streak-card"><div className="row-between"><h3>连续打卡 <strong>{getStreak(state, date)}</strong> 天</h3><button className={`checkin-pill ${progress.canCheckIn ? 'ready' : ''}`} onClick={doCheckIn}>{progress.checkedIn ? '已打卡 ✓' : '今日打卡'}</button></div><div className="week-grid">{Array.from({ length: 7 }, (_, i) => { const day = new Date(`${date}T12:00:00`); day.setDate(day.getDate() - 6 + i); const key = localDate(day); const done = state.checkIns.includes(key); return <div key={key} className={`week-day ${done ? 'done' : ''} ${i === 6 ? 'today' : ''}`} aria-label={`${day.getMonth() + 1}月${day.getDate()}日${done ? '已打卡' : '未打卡'}`}>{done ? <Icon name="check" size={20} /> : i === 6 ? '今' : ['日', '一', '二', '三', '四', '五', '六'][day.getDay()]}</div>; })}</div></section>
        <section className="today-card"><div className="row-between"><h2>今日单词</h2><strong className="fraction">{progress.newDone} / {progress.newTotal} <small>词</small></strong></div><p>{progress.newTotal === 20 ? '4 个小关卡，每关认识 5 个新朋友' : progress.newTotal ? `词库还剩 ${progress.newTotal} 个新朋友，一起认识它们` : '新词都练过啦，今天复习再巩固'}</p><Progress value={progress.newDone} max={progress.newTotal} label="今日新词进度" /><div className="word-previews">{plan.newWordIds.slice(Math.min(progress.newDone, Math.max(0, plan.newWordIds.length - 3)), Math.min(progress.newDone, Math.max(0, plan.newWordIds.length - 3)) + 3).map(id => <button key={id} onClick={() => startLearning('practice', [id])}><span>{wordEnrichment[wordById[id].word]?.emoji ?? '📖'}</span><b>{wordById[id].word}</b></button>)}{!plan.newWordIds.length && <button onClick={() => navigate('library')}><Icon name="book" />去词库看看</button>}</div></section>
        <section className="task-section"><div className="row-between"><h2>今日任务</h2><span className="caption">完成后就能打卡</span></div><div className="task-grid"><button className="task-card" onClick={() => startLearning('review')}><span className="task-icon butter"><Icon name={progress.reviewDone === progress.reviewTotal ? 'check' : 'refresh'} /></span><span><b>复习老朋友</b><small>{progress.reviewTotal ? `${progress.reviewDone} / ${progress.reviewTotal} 词已练习` : '今天没有待复习词'}</small></span></button><button className="task-card" onClick={() => { setAnswer(null); navigate('grammar'); }}><span className="task-icon blue"><Icon name={progress.grammarDone ? 'check' : 'star'} /></span><span><b>句子小游戏</b><small>{progress.grammarDone ? '今天已完成 ✓' : '拼出一个小进步'}</small></span></button></div></section>
        <div className="home-action"><Button onClick={primaryHomeAction}>{primaryLabel}</Button><p className="caption">完成今日新词 + 复习 + 句子题，点亮今天</p></div>
      </>}

      {view === 'learn' && current && session && <>
        <Heading title={session.mode === 'review' ? '复习老朋友' : '单词小冒险'} subtitle={`${getWordBookLabel(current)} · ${getWordUnitLabel(current)}`} back={() => navigate(session.mode === 'practice' ? 'library' : 'home')} />
        <div className="row-between lesson-top"><span className="badge mint">{session.mode === 'new' ? `第 ${Math.floor(session.index / 5) + 1} / ${Math.ceil(session.ids.length / 5)} 关` : session.mode === 'review' ? '再见老朋友' : '自由练习'}</span><span className="caption">第 {session.index + 1} / {session.ids.length} 词</span></div>
        <div className={`flashcard ${flipped ? 'is-flipped' : ''}`}><div className="row-between"><span className="badge butter">Unit {current.unit} · {current.kind === 'phrase' ? '短语' : current.kind === 'inflected_form' ? '词形伙伴' : current.bookId === 'jijiao-g5-upper' ? '同步单词' : '拓展单词'}</span><button className={`icon-button ${speech.speaking ? 'is-speaking' : ''}`} aria-label={`听 ${current.word} 发音`} onClick={() => speech.speak(current.word, prefs.rate)}><Icon name="audio" /></button></div><button className="flip-surface" onClick={() => setFlipped(value => !value)} aria-label={flipped ? '翻回英文卡片' : '翻开中文释义'}><span className="word-emoji" aria-hidden="true">{currentExtra?.emoji ?? '📖'}</span><h2 lang="en">{current.word}</h2>{flipped ? <><p className="meaning">{current.meaningZh}</p><p className="example" lang="en">{currentExtra?.example}</p><p className="caption">{currentExtra?.exampleZh}</p></> : <><p className="meaning muted">猜猜它的意思？</p><p className="caption">点一下卡片，翻开答案</p></>}<span className="flip-hint">↻ {flipped ? '再翻一次' : '翻一翻，认识新朋友'}</span></button></div>
        {flipped && currentExtra && <button className="text-action" onClick={() => speech.speak(currentExtra.example, prefs.rate)}><Icon name="audio" size={18} />听例句</button>}
        <div className="mastery-row"><span>{currentProgress?.mastered ? '已经掌握，真棒！' : `连续读对 ${currentProgress?.consecutiveCorrect ?? 0} / 3 次`}</span><div>{[1, 2, 3].map(n => <span key={n} className={(currentProgress?.mastered || (currentProgress?.consecutiveCorrect ?? 0) >= n) ? 'lit' : ''}>★</span>)}</div></div>
        {feedback ? <div className={`feedback ${feedback.kind}`} role="status"><strong>{feedback.kind === 'correct' ? currentProgress?.mastered ? '三颗星！这个词掌握啦' : '听到啦，和目标词对上了！' : feedback.kind === 'self' ? '跟读练习已记下，继续加油！' : '这次没有对上，慢慢再来一次'}</strong><p>{feedback.transcript ? `听到的是：“${feedback.transcript}”` : '手动练习计入今日任务，连续读对次数由语音识别记录。'}</p></div> : <div className="mascot-hint"><Mascot /><p>先听一听，再跟吉伊读一读<small>每次大声读出完整单词或短语</small></p></div>}
        {speech.error && <p className="speech-error" role="status">{speech.error}</p>}
        <div className="lesson-actions"><Button onClick={() => speech.listening ? speech.stop() : speech.listen(current.word, result => practice(result.correct ? 'correct' : 'incorrect', result.transcript, result.attemptId))} disabled={!speech.supportedRecognition}><Icon name="mic" />{speech.listening ? '正在听 · 点此取消' : feedback ? '再读一次' : '跟着读一读'}</Button><Button secondary onClick={() => { speech.stop(); practice('self'); }}>我已跟读 · 记为练过</Button>{(feedback || plan.practicedWordIds.includes(current.id)) && <Button onClick={nextWord}>{session.index + 1 === session.ids.length ? '完成这次练习' : '下一个单词 →'}</Button>}<p className="caption">{!speech.supportedRecognition ? '当前浏览器不支持语音识别，可以听音后手动记录练习。' : '跟读使用浏览器识别，可能需要联网；识别结果不等于专业发音评分。'}</p></div>
      </>}
      {view === 'learn' && !current && <div className="empty-state"><Mascot /><h2>从一个小关卡开始吧</h2><Button onClick={() => startLearning('new')}>开始今天的学习</Button></div>}

      {view === 'library' && <>
        <Heading title="我的单词小书架" subtitle="先学课内，再拓展更多英语小世界" />
        <div className="library-summary"><div><strong>{words.length}</strong><span>词库词条</span></div><div><strong>{mastered}</strong><span>已掌握</span></div><div><strong>{learned - mastered}</strong><span>学习中</span></div><Mascot /></div>
        <label className="search-box"><Icon name="search" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="找一个单词，或输入中文" aria-label="搜索词库" /><span>{query && <button onClick={() => setQuery('')} aria-label="清空搜索">×</button>}</span></label>
        <div className="filter-tabs" role="group" aria-label="学习状态筛选">{[['all', '全部'], ['learning', '学习中'], ['mastered', '已掌握'], ['new', '未学习']].map(([key, name]) => <button key={key} aria-pressed={filter === key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{name}</button>)}</div>
        <div className="library-book-filter library-unit"><label>我的课程 <select value={bookId} onChange={event => { setBookId(event.target.value); setUnit(''); }} aria-label="按课程筛选"><option value="">全部已收录课程</option>{bookOptions.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label></div>
        <div className="row-between library-unit"><label>课程单元 <select value={unit} onChange={event => setUnit(event.target.value)} aria-label="按课程单元筛选"><option value="">全部单元</option>{unitOptions.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><span className="caption">{visibleWords.length} 词条</span></div>
        <div className="word-list">{visibleWords.map(word => <button className="word-row" key={word.id} onClick={() => startLearning('practice', [word.id])}><span className="word-tile">{wordEnrichment[word.word]?.emoji ?? '📖'}</span><span className="word-copy"><b lang="en">{word.word}</b><small>{word.meaningZh}</small>{bookOptions.length > 1 && <small className="word-source">{getWordBookLabel(word, true)} · Unit {word.unit}</small>}</span><span className={`word-status ${state.words[word.id]?.mastered ? 'mastered' : ''}`}>{state.words[word.id]?.mastered ? '已掌握 ✓' : state.words[word.id] ? `${state.words[word.id].consecutiveCorrect} / 3` : `U${word.unit}`}</span></button>)}</div>
        {!visibleWords.length && <div className="empty-state"><span>🌱</span><h3>{query ? '还没找到这个词' : '这里还没有单词'}</h3><p className="caption">换个筛选，或先开始今天的学习吧。</p></div>}
        <div className="source-note"><p className="caption">当前已核对 {words.length} 个词条，来自 {bookOptions.length} 门课程。例句与游戏为原创练习。</p>{selectedBooks.map(book => <p className="caption" key={book.id}>{book.title} · {book.entryCount} 词条<br />{book.coverageNote}</p>)}</div>
      </>}

      {view === 'grammar' && <>
        <Heading title="句子小游戏" subtitle={`冀教同步 · Unit ${question.unit} · 一起把句子补完整`} back={() => navigate('home')} />
        <div className="grammar-intro"><Mascot /><span>今天也来挑战一句英语！</span></div>
        <section className="grammar-card"><span className="badge butter">选一选 · 每天一个小挑战</span><h2 lang="en">{question.prompt}</h2><p>{question.translation}</p><button className="text-action" onClick={() => speech.speak(question.prompt.replace(/_{2,}|…/g, question.answer), prefs.rate)}><Icon name="audio" size={20} />听完整句子</button></section>
        <div className="grammar-options">{question.options.map(option => <button key={option} className={`grammar-option ${answer === option ? option === question.answer ? 'correct' : 'incorrect' : ''}`} onClick={() => setAnswer(option)} disabled={answer === question.answer}>{option}{answer === option && <span>{option === question.answer ? '✓' : '再试试'}</span>}</button>)}</div>
        {answer && <div className={`feedback ${answer === question.answer ? 'correct' : 'incorrect'}`} role="status"><strong>{answer === question.answer ? '答对啦！小星星送给你' : '差一点点，换个答案试试'}</strong><p>{question.explanation}</p></div>}
        {speech.error && <p className="speech-error">{speech.error}</p>}
        <div className="lesson-actions">{answer === question.answer ? <><Button onClick={() => finishGrammar()}>收下星星 · 完成任务</Button><Button secondary onClick={() => finishGrammar(true)}>再挑战一句</Button></> : <p className="caption">认真读句子，选错也没关系。</p>}</div>
      </>}

      {view === 'stories' && <>
        <Heading title="和吉伊看动画" subtitle="原创英语小故事 · 听一听，读一读" />
        <section className={`story-player ${scene.background} ${playing ? 'playing' : ''}`}><div className="row-between"><span className="badge white">STORY {String(storyIndex + 1).padStart(2, '0')}</span><span className="caption">{sceneIndex + 1} / {story.scenes.length}</span></div><div className="story-stage" key={`${story.id}-${sceneIndex}`}><span className="story-prop">{scene.emoji}</span><Mascot className="story-mascot" /><span className="story-spark">✦</span></div><div className="story-subtitles"><h2 lang="en">{scene.text}</h2><p>{scene.translation}</p></div><div className="player-controls"><button aria-label={playing ? '暂停故事' : '播放故事'} onClick={() => setPlaying(value => !value)}>{playing ? 'Ⅱ' : '▶'}</button><Progress value={sceneIndex + 1} max={story.scenes.length} label="故事进度" /><button aria-label="下一幕" onClick={() => { speech.stop(); if (sceneIndex < story.scenes.length - 1) setSceneIndex(value => value + 1); else setPlaying(false); }}>›</button></div></section>
        <div className="story-title"><h2>{String(storyIndex + 1).padStart(2, '0')} · {story.title}</h2><p className="caption">{story.titleEn}</p></div>
        <div className="speed-switch" role="group" aria-label="播放速度">{[0.8, 1].map(rate => <button key={rate} className={prefs.rate === rate ? 'active' : ''} aria-pressed={prefs.rate === rate} onClick={() => setPrefs(previous => ({ ...previous, rate }))}>{rate}× {rate === 0.8 ? '慢慢听' : '正常'}</button>)}</div>
        <div className="autoplay-card"><div><b>连续播放</b><p className="caption">播完后，自动播放下一个故事</p></div><button className={`toggle ${prefs.autoplay ? 'on' : ''}`} role="switch" aria-checked={prefs.autoplay} aria-label="连续播放" onClick={() => setPrefs(previous => ({ ...previous, autoplay: !previous.autoplay }))}><span /></button></div>
        {speech.error && <p className="speech-error">{speech.error}</p>}
        {!speech.supportedSpeech && <p className="caption">当前浏览器没有朗读功能，仍可播放画面、阅读字幕。</p>}
        <div className="row-between"><h2>故事小剧场</h2><span className="caption">共 {animatedStories.length} 个故事</span></div><div className="story-list">{animatedStories.map((item, i) => <button className={`story-row ${i === storyIndex ? 'active' : ''}`} key={item.id} onClick={() => { speech.stop(); setPlaying(false); setStoryIndex(i); setSceneIndex(0); }}><span className="task-icon butter"><Icon name="film" /></span><span><b>{String(i + 1).padStart(2, '0')} · {item.title}</b><small>Unit {item.unit} · {item.scenes.length} 幕小故事</small></span><span>{i === storyIndex ? '当前' : '›'}</span></button>)}</div><p className="caption source-note">动画是学习的小加餐，不影响今天的打卡。</p>
      </>}

      {view === 'celebration' && <div className="celebration"><div className="confetti" aria-hidden="true">✦　✧　★　✧　✦</div><span className="badge white">TODAY’S LITTLE WIN</span><Mascot happy /><h1>今天的你，闪闪发光！</h1><p>和吉伊一起，又坚持了一天。</p><div className="streak-number"><strong>{getStreak(state, date)}</strong><span>天连续打卡</span></div><div className="celebration-stats"><div><b>{progress.newDone}</b><span>新词已练</span></div><div><b>{progress.reviewDone}</b><span>复习已练</span></div><div><b>{progress.grammarDone ? 1 : 0}</b><span>句子挑战</span></div></div><Button onClick={() => navigate('home')}>收好小星星 · 回到首页</Button><p className="caption">明天继续一起冒险吧！</p></div>}

      {view === 'settings' && <>
        <Heading title="学习设置" subtitle="照顾好每一点小进步" back={() => navigate('home')} />
        <section className="settings-card"><h2>这次的学习计划</h2><p>校内同步优先，再学习拓展课程</p><p className="caption">每日 20 个新词，分成 4 关。优先按冀教版五年级上册顺序学习，再学习已收录的拓展词库。当天未掌握的新词明天起加入复习；剩余不足 20 个时按实际数量安排。</p>{bookOptions.map(book => <p className="caption" key={book.id}>{book.sourceTitle}<br />当前已核对 {book.entryCount} 个词条 · {book.isComplete ? '整册词表已核对' : '仍在补全核对'}</p>)}<div className="setting-line"><span>本机已练习</span><strong>{learned} / {words.length} 词条</strong></div><div className="setting-line"><span>本机已掌握</span><strong>{mastered} 词条</strong></div></section>
        <section className="settings-card"><h2>把进步好好收起来</h2><p className="caption">进度保存在当前设备、当前浏览器。更换设备或清理浏览器前，请先导出备份；这版暂不跨设备自动同步。</p><Button secondary onClick={() => { const blob = new Blob([JSON.stringify({ format: 'chii-english-backup', version: 1, exportedAt: new Date().toISOString(), state, prefs }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `chii-english-progress-${date}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>导出学习备份</Button><Button secondary onClick={() => restoreInput.current?.click()}>恢复学习备份</Button><input ref={restoreInput} type="file" accept="application/json,.json" hidden onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void restoreBackup(file); }} /></section>
        <section className="settings-card"><h2>放到手机主屏幕</h2><p>iPhone：用 Safari 打开网址，点击“分享”→“添加到主屏幕”。</p><p>安卓：在浏览器菜单里选择“安装应用”或“添加到主屏幕”。</p><p className="caption">首次打开后，词卡和游戏可离线使用。发音取决于设备语音包，语音识别通常需要联网。</p></section>
        <section className="settings-card"><h2>关于跟读</h2><p className="caption">浏览器识别到完整目标词，连续 3 次后标记掌握。识别可能有偏差，它不是专业发音评分；不会收音或无法识别时，可以手动记录练习。手动记录不会增加连续读对次数。</p><p className="caption">跟读时，浏览器可能使用其在线语音服务。应用自身不保存录音。</p></section>
      </>}
    </main>
    {['home', 'library', 'stories'].includes(view) && <nav className="bottom-nav" aria-label="主要导航" inert={!!modal}>{tabs.map(tab => <button key={tab.key} className={view === tab.key ? 'active' : ''} aria-current={view === tab.key ? 'page' : undefined} onClick={() => navigate(tab.key)}><Icon name={tab.icon} /><span>{tab.name}</span></button>)}</nav>}
    {toast && <div className="toast" role="status">{toast}</div>}
    {modal && <div className="modal-scrim" onClick={() => setModal(null)}><section ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description" onClick={event => event.stopPropagation()}>{modal.happy && <Mascot happy />}<h2 id="modal-title">{modal.title}</h2><p id="modal-description">{modal.body}</p><Button onClick={() => setModal(null)}>知道啦，继续冒险</Button></section></div>}
  </div><div className="desktop-note"><span>✦</span> 一点点认真，<br />会变成大大的进步。</div></div>;
}
