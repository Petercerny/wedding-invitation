import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, TouchEvent, ReactNode } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ArrowUpRight, ChevronLeft, ChevronRight, Heart, BookOpen } from 'lucide-react';
import { wedding } from './config/wedding';
import { BookPage } from './components/BookPage';
import { PhotoPage } from './components/PhotoPage';
import { RsvpForm, useRsvp } from './components/RsvpForm';

interface FlipEngine { flipNext: (corner?: string) => void; flipPrev: (corner?: string) => void; flip: (page: number) => void; turnToPage: (page: number) => void; getState: () => string; }
interface BookHandle { pageFlip: () => FlipEngine; }
const interactive = 'input, textarea, select, button, a, label, [contenteditable="true"]';
function getViewport() {
  const width = window.innerWidth;
  const mobile = width < 780;
  const fontScale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
  return { mobile, width: Math.floor(mobile ? Math.min(width - 32, 440) : Math.min((width - 112) / 2, 460)), height: Math.round((mobile ? 720 : 700) * fontScale) };
}
function ChapterHeading({ index, title, children }: { index: number; title: string; children?: ReactNode }) {
  return <><p className="eyebrow chapter-eyebrow"><span>{String(index).padStart(2, '0')}</span>{wedding.chapters[index - 1]}</p><h2>{title}</h2>{children && <p className="chapter-intro">{children}</p>}<div className="gold-rule"/></>;
}
export default function App() {
  const book = useRef<BookHandle | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState(getViewport);
  const [height, setHeight] = useState(viewport.height);
  const [page, setPage] = useState(0);
  const pageRef = useRef(page); pageRef.current = page;
  const [ready, setReady] = useState(false);
  const [turning, setTurning] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const rsvp = useRsvp();
  const lastPage = viewport.mobile ? 10 : 9;
  const chapter = page ? Math.min(4, Math.floor((page - 1) / 2)) : -1;
  const visible = (index: number) => viewport.mobile ? index === page : page === 0 ? index === 0 : index === page || index === page + 1;
  const go = useCallback((target: number, immediate = false) => {
    const engine = book.current?.pageFlip();
    if (!engine || engine.getState() !== 'read') return;
    const bounded = Math.max(0, Math.min(viewport.mobile ? 10 : 9, target));
    const index = viewport.mobile || bounded === 0 ? bounded : bounded % 2 ? bounded : bounded - 1;
    if (index === pageRef.current) return;
    if (reduceMotion || immediate) { engine.turnToPage(index); setPage(index); }
    else engine.flip(index);
  }, [viewport.mobile, reduceMotion]);
  const next = useCallback(() => go(pageRef.current === 0 ? 1 : pageRef.current + (viewport.mobile ? 1 : 2)), [go, viewport.mobile]);
  const previous = useCallback(() => go(pageRef.current - (viewport.mobile ? 1 : 2)), [go, viewport.mobile]);
  const jumpRsvp = useCallback(() => { go(viewport.mobile ? 10 : 9); stage.current?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' }); }, [go, viewport.mobile, reduceMotion]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const resize = () => { clearTimeout(timer); timer = setTimeout(() => { const v = getViewport(); if (!v.mobile && pageRef.current > 0 && pageRef.current % 2 === 0) setPage(pageRef.current - 1); setViewport(v); setHeight(v.height); }, 120); };
    window.addEventListener('resize', resize);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduceMotion(motion.matches); motion.addEventListener('change', updateMotion);
    return () => { clearTimeout(timer); window.removeEventListener('resize', resize); motion.removeEventListener('change', updateMotion); };
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest(interactive) || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [next, previous]);
  // Increase the whole book's height to the tallest HTML content. The document scrolls;
  // text is never scaled down and pages do not trap vertical scrolling.
  useLayoutEffect(() => {
    if (!stage.current) return;
    const bodies = [...stage.current.querySelectorAll<HTMLElement>('.page-body')];
    let frame = 0;
    const measure = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { const required = Math.ceil(Math.max(viewport.height, ...bodies.map(body => body.scrollHeight + (viewport.mobile ? 120 : 150)))); setHeight(previousHeight => Math.max(previousHeight, required)); }); };
    const observer = new ResizeObserver(measure); bodies.forEach(body => observer.observe(body)); measure();
    void document.fonts.ready.then(measure);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [viewport.width, viewport.mobile, viewport.height, height, ready]);
  function touchStart(event: TouchEvent) {
    if (page >= 9 || (event.target as HTMLElement).closest(interactive)) { touch.current = null; return; }
    const t = event.touches[0]; touch.current = { x: t.clientX, y: t.clientY };
  }
  function touchEnd(event: TouchEvent) {
    if (!touch.current) return;
    const t = event.changedTouches[0]; const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx < 0 ? next() : previous(); }
    touch.current = null;
  }
  const names = wedding.names.join(' & ');
  const bookKey = `${viewport.width}-${height}-${viewport.mobile}`;
  const style = { '--page-width': `${viewport.width}px`, '--page-height': `${height}px` } as CSSProperties;
  return <div className="invitation-app">
    <header className="site-header flex items-center justify-between"><button className="monogram" onClick={() => go(0)} aria-label="Return to invitation cover">{wedding.initials}</button><span className="header-date">{wedding.shortDate}</span><button className="rsvp-shortcut" onClick={jumpRsvp} disabled={!ready}><Heart size={14} strokeWidth={1.5}/><span>RSVP</span></button></header>
    <main id="invitation"><div className="above-book"><span className="tiny-rule"/><p className="eyebrow">A LITTLE BOOK FOR A VERY BIG DAY</p><span className="tiny-rule"/></div>
      <div ref={stage} className={`book-stage ${page === 0 ? 'is-closed' : 'is-open'} ${viewport.mobile ? 'is-mobile' : ''}`} style={style} onTouchStart={touchStart} onTouchEnd={touchEnd}>
        <div className="book-position"><div className="book-underlay" aria-hidden="true"/><div className="spine" aria-hidden="true"/>
          <HTMLFlipBook key={bookKey} ref={book as never} width={viewport.width} height={height} size="fixed" minWidth={240} maxWidth={460} minHeight={500} maxHeight={3000} startPage={page} drawShadow={!reduceMotion} flippingTime={850} usePortrait={viewport.mobile} startZIndex={10} autoSize={false} maxShadowOpacity={0.22} showCover={true} mobileScrollSupport={true} clickEventForward={true} useMouseEvents={false} swipeDistance={55} showPageCorners={false} disableFlipByClick={true} className="flipbook" style={{}} onInit={() => { setReady(true); setTurning(false); }} onFlip={e => setPage(e.data)} onChangeState={e => setTurning(e.data !== 'read')}>
            <BookPage number={0} visible={visible(0)} cover><div className="cover-layout"><div className="cover-border"/><div className="cover-top"><p className="eyebrow">{wedding.cover.eyebrow}</p><span className="cover-ornament">{wedding.names[0][0]}<span>&</span>{wedding.names[1][0]}</span></div><div className="cover-title"><h1>{wedding.names[0]}<span className="cover-ampersand">&</span>{wedding.names[1]}</h1><p className="cover-date">{wedding.date}</p><p className="cover-location">{wedding.location}</p></div><div className="cover-bottom"><p className="handwritten">{wedding.cover.line}</p><button className="open-invitation" onClick={next} disabled={!ready || turning}><BookOpen size={17} strokeWidth={1.3}/>{wedding.cover.action}</button></div></div></BookPage>
            <BookPage number={1} visible={visible(1)} photo><PhotoPage photo={wedding.photos.story} number={1}/></BookPage>
            <BookPage number={2} visible={visible(2)}><ChapterHeading index={1} title={wedding.story.title}/><div className="story-text">{wedding.story.paragraphs.map(p => <p key={p}>{p}</p>)}</div><p className="handwritten signature">{wedding.story.signature}</p><Heart className="story-heart" size={18} strokeWidth={1}/></BookPage>
            <BookPage number={3} visible={visible(3)} photo><PhotoPage photo={wedding.photos.invitation} number={3}/></BookPage>
            <BookPage number={4} visible={visible(4)}><ChapterHeading index={2} title={wedding.invitation.title}>{wedding.invitation.intro}</ChapterHeading><div className="event-details"><p className="wedding-date">{wedding.date}</p><p>{wedding.invitation.time}</p><div className="venue-details"><h3>{wedding.invitation.venue}</h3>{wedding.invitation.address.map(line => <p key={line}>{line}</p>)}</div><a className="directions-link" href={wedding.invitation.directions} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={15}/><span className="sr-only"> (opens a new tab)</span></a><p className="arrival-note">{wedding.invitation.note}</p></div></BookPage>
            <BookPage number={5} visible={visible(5)} photo><PhotoPage photo={wedding.photos.day} number={5}/></BookPage>
            <BookPage number={6} visible={visible(6)}><ChapterHeading index={3} title={wedding.day.title}>{wedding.day.intro}</ChapterHeading><ol className="schedule">{wedding.schedule.map(item => <li key={item.time}><time>{item.time}</time><div><p className="schedule-label">{item.label}</p><h3>{item.title}</h3><p>{item.detail}</p></div></li>)}</ol></BookPage>
            <BookPage number={7} visible={visible(7)} photo><PhotoPage photo={wedding.photos.guests} number={7}/></BookPage>
            <BookPage number={8} visible={visible(8)}><ChapterHeading index={4} title={wedding.guestTitle}/><div className="guest-details">{wedding.guests.map(item => <section key={item.title}><h3>{item.title}</h3><p>{item.text}</p></section>)}</div><p className="deadline-note">Kindly RSVP by <strong>{wedding.rsvp.deadline}</strong>.</p></BookPage>
            <BookPage number={9} visible={visible(9)} photo><PhotoPage photo={wedding.photos.rsvp} number={9}/></BookPage>
            <BookPage number={10} visible={visible(10)}><ChapterHeading index={5} title={wedding.rsvp.title}>{wedding.rsvp.intro}</ChapterHeading><p className="rsvp-deadline">Kindly reply by {wedding.rsvp.deadline}</p><RsvpForm model={rsvp}/></BookPage>
          </HTMLFlipBook>
        </div>
      </div>
      <div className="book-controls"><button className="page-nav" onClick={previous} disabled={page === 0 || !ready || turning} aria-label="Previous page"><ChevronLeft size={19} strokeWidth={1.5}/><span>Previous</span></button><div className="page-indicator" aria-live="polite" aria-atomic="true"><span>{page === 0 ? 'The beginning' : wedding.chapters[chapter]}</span><small>{page === 0 ? 'COVER' : viewport.mobile ? `${String(page).padStart(2, '0')} / 10` : `${String(chapter + 1).padStart(2, '0')} / 05`}</small></div><button className="page-nav" onClick={next} disabled={page >= lastPage || !ready || turning} aria-label="Next page"><span>{page === 0 ? 'Open' : 'Next'}</span><ChevronRight size={19} strokeWidth={1.5}/></button></div>
      <nav className="chapter-navigation" aria-label="Invitation chapters">{wedding.chapters.map((name, i) => <button key={name} onClick={() => i === 4 ? jumpRsvp() : go(1 + i * 2)} className={chapter === i ? 'active' : ''} aria-label={`Go to ${name}`} aria-current={chapter === i ? 'step' : undefined} disabled={!ready || turning}><span className="chapter-dot"/><span className="chapter-name">{name}</span></button>)}</nav>
      <p className="navigation-hint">{viewport.mobile ? page >= 9 ? 'Take your time. Your reply is the last page.' : 'Swipe to turn a page, or use the controls above.' : 'Use the controls or your keyboard’s left and right arrows.'}</p>
    </main>
    <footer className="site-footer"><span>{names}</span><span className="footer-flower" aria-hidden="true">✧</span><span>{wedding.shortDate}</span></footer>
  </div>;
}
