import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, TouchEvent } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { BookOpen, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { wedding } from './config/wedding';
import { chapters, BlockView, ChapterHeading } from './bookContent';
import type { PageDescriptor } from './bookContent';
import { paginateBook, restoreReadingPosition } from './pagination';
import { BookPage, PageVisibility } from './components/BookPage';
import { PhotoPage, PhotoPair } from './components/PhotoPage';
import { RsvpForm, useRsvp } from './components/RsvpForm';

interface FlipEngine {
  flipNext: () => void; flipPrev: () => void; turnToPage: (page: number) => void;
  getState: () => string;
}
interface BookHandle { pageFlip: () => FlipEngine | undefined; }
interface Size { width: number; height: number; single: boolean; fontSize: number; }
interface Layout { size: Size; pages: PageDescriptor[]; version: number; }
const interactive = 'input, textarea, select, button, a, label, [contenteditable="true"]';
function dimensions(width: number, height: number): Size {
  const single = width < 780 || height < 390;
  const pageHeight = Math.max(140, Math.floor(Math.min(680, height - 12)));
  const pageWidth = Math.floor(single ? Math.min(420, width - 24) : Math.min(460, (width - 24) / 2, pageHeight * .78));
  return { width: Math.max(160, pageWidth), height: pageHeight, single, fontSize: parseFloat(getComputedStyle(document.documentElement).fontSize) };
}
function normalize(index: number, layout: Layout) {
  const last = layout.size.single ? layout.pages.length - 1 : layout.pages.length - 2;
  const bounded = Math.max(0, Math.min(last, index));
  return layout.size.single || bounded === 0 ? bounded : bounded % 2 ? bounded : bounded - 1;
}
function pageStyle(size: Size): CSSProperties {
  return { '--page-width': `${size.width}px`, '--page-height': `${size.height}px` } as CSSProperties;
}

export default function App() {
  const book = useRef<BookHandle | null>(null);
  const slot = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const [candidate, setCandidate] = useState(() => dimensions(window.innerWidth - 32, window.innerHeight - 150));
  const [fontsReady, setFontsReady] = useState(false);
  const [layout, setLayout] = useState<Layout>({ size: candidate, pages: [], version: 0 });
  const layoutRef = useRef(layout); layoutRef.current = layout;
  const [page, setPage] = useState(0);
  const pageRef = useRef(page); pageRef.current = page;
  const [focusPage, setFocusPage] = useState(0);
  const focusRef = useRef(focusPage); focusRef.current = focusPage;
  const [ready, setReady] = useState(false);
  const readyRef = useRef(ready); readyRef.current = ready;
  const [turning, setTurning] = useState(false);
  const turningRef = useRef(false);
  const pendingSize = useRef<Size | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rsvp = useRsvp();

  useEffect(() => {
    let live = true;
    void document.fonts.ready.then(() => { if (live) setFontsReady(true); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!slot.current) return;
    const requestSize = () => {
      const area = slot.current!;
      const next = dimensions(area.clientWidth, area.clientHeight);
      if (turningRef.current) { pendingSize.current = next; return; }
      setCandidate(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
    };
    const observer = new ResizeObserver(requestSize);
    observer.observe(slot.current);
    const rootObserver = new MutationObserver(requestSize);
    rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    window.addEventListener('resize', requestSize);
    window.visualViewport?.addEventListener('resize', requestSize);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduceMotion(motion.matches);
    motion.addEventListener('change', updateMotion);
    document.fonts.addEventListener('loadingdone', requestSize);
    requestSize();
    return () => { observer.disconnect(); rootObserver.disconnect(); window.removeEventListener('resize', requestSize); window.visualViewport?.removeEventListener('resize', requestSize); motion.removeEventListener('change', updateMotion); document.fonts.removeEventListener('loadingdone', requestSize); };
  }, []);

  useLayoutEffect(() => {
    if (!fontsReady || !probe.current) return;
    const pages = paginateBook(probe.current);
    const previous = layoutRef.current;
    if (JSON.stringify(previous.size) === JSON.stringify(candidate) && JSON.stringify(previous.pages) === JSON.stringify(pages)) return;
    const next: Layout = { size: candidate, pages, version: previous.version + 1 };
    const focus = restoreReadingPosition(previous.pages, pages, focusRef.current);
    const current = normalize(focus, next);
    readyRef.current = false;
    setReady(false);
    layoutRef.current = next;
    pageRef.current = current;
    focusRef.current = focus;
    setPage(current); setFocusPage(focus); setLayout(next);
  }, [candidate, fontsReady]);

  const go = useCallback((target: number, animate = false) => {
    const engine = book.current?.pageFlip();
    const currentLayout = layoutRef.current;
    if (!readyRef.current || !engine || engine.getState() !== 'read') return;
    const index = normalize(target, currentLayout);
    focusRef.current = Math.max(0, Math.min(currentLayout.pages.length - 1, target));
    setFocusPage(focusRef.current);
    if (index === pageRef.current) return;
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      index > pageRef.current ? engine.flipNext() : engine.flipPrev();
    } else {
      engine.turnToPage(index);
      pageRef.current = index;
      setPage(index);
    }
  }, []);
  const next = useCallback(() => go(pageRef.current === 0 ? 1 : pageRef.current + (layoutRef.current.size.single ? 1 : 2), true), [go]);
  const previous = useCallback(() => go(pageRef.current - (layoutRef.current.size.single ? 1 : 2), true), [go]);
  const jumpRsvp = useCallback(() => go(layoutRef.current.pages.findIndex(item => item.kind === 'rsvp')), [go]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest(interactive) || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, previous]);

  const handlers = useMemo(() => {
    const version = layout.version;
    return {
      onInit: () => {
        if (layoutRef.current.version !== version) return;
        book.current?.pageFlip()?.turnToPage(pageRef.current);
        setReady(true); readyRef.current = true;
        turningRef.current = false; setTurning(false);
      },
      onFlip: (event: { data: number }) => {
        if (layoutRef.current.version !== version || !readyRef.current) return;
        const index = event.data;
        pageRef.current = index; setPage(index);
        if (focusRef.current < index || focusRef.current > index + (layoutRef.current.size.single || index === 0 ? 0 : 1)) {
          focusRef.current = index; setFocusPage(index);
        }
      },
      onChangeState: (event: { data: string }) => {
        if (layoutRef.current.version !== version) return;
        turningRef.current = event.data !== 'read';
        setTurning(turningRef.current);
        if (!turningRef.current && pendingSize.current) { setCandidate(pendingSize.current); pendingSize.current = null; }
      },
    };
  }, [layout.version]);

  // Keep the flip library's child list stable during turns. PageVisibility updates
  // aria-hidden/inert through context without rebuilding the engine's page collection.
  const pages = useMemo(() => layout.pages.map((descriptor, index) => {
    const chapter = chapters.find(item => item.id === descriptor.chapterId);
    let content;
    if (descriptor.kind === 'cover') content = <div className="cover-layout">
      <p className="eyebrow cover-eyebrow">{wedding.cover.eyebrow}</p>
      <div className="cover-keepsakes"><PhotoPair photo={wedding.photos.story} number={0} compact/><div className="cover-title"><h1>{wedding.names[0]}<span>&</span>{wedding.names[1]}</h1><p className="cover-date">{wedding.date}</p><p className="cover-location">{wedding.location}</p></div></div>
      <div className="cover-bottom"><p className="handwritten">{wedding.cover.line}</p><button className="open-invitation" onClick={next}><BookOpen size={15}/>{wedding.cover.action}</button></div>
    </div>;
    else if (descriptor.kind === 'photo') content = <PhotoPage photo={chapter!.photo} number={chapters.indexOf(chapter!) + 1} note={chapter!.id === 'rsvp' ? wedding.rsvp.intro : undefined}/>;
    else if (descriptor.kind === 'rsvp') content = <RsvpForm model={rsvp} tight={layout.size.height < 490 || layout.size.fontSize > 20}/>;
    else content = <><ChapterHeading chapter={chapter!} continuation={descriptor.continuation}/><div className="text-block-list">{descriptor.blocks?.map(block => <BlockView key={`${block.id}-${block.start || 0}`} block={block}/>)}</div></>;
    return <BookPage key={descriptor.id} id={descriptor.id} number={index} cover={descriptor.kind === 'cover'} photo={descriptor.kind === 'photo'} rsvp={descriptor.kind === 'rsvp'}>{content}</BookPage>;
  }), [layout.pages, layout.size.height, layout.size.fontSize, rsvp, next]);

  function touchStart(event: TouchEvent) {
    if ((event.target as HTMLElement).closest(interactive) || layout.pages[focusPage]?.kind === 'rsvp') { touch.current = null; return; }
    const t = event.touches[0]; touch.current = { x: t.clientX, y: t.clientY };
  }
  function touchEnd(event: TouchEvent) {
    if (!touch.current) return;
    const t = event.changedTouches[0], dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : previous();
    touch.current = null;
  }
  const selected = layout.pages[focusPage];
  const chapter = chapters.find(item => item.id === selected?.chapterId);
  const last = layout.size.single ? layout.pages.length - 1 : layout.pages.length - 2;
  const visibility = useMemo(() => ({ page, single: layout.size.single }), [page, layout.size.single]);
  return <div className={`invitation-app ${layout.size.height < 390 ? 'short-book' : ''}`} style={pageStyle(layout.size)}>
    <header className="site-header"><button className="monogram" onClick={() => go(0)} aria-label="Return to invitation cover">{wedding.initials}</button><span className="header-date">{wedding.shortDate}</span><button className="rsvp-shortcut" onClick={jumpRsvp} disabled={!ready || turning}><Heart size={14}/><span>RSVP</span></button></header>
    <main id="invitation">
      <div className="book-slot" ref={slot}>
        {layout.pages.length > 0 && <div className={`book-stage ${page === 0 ? 'is-closed' : 'is-open'} ${layout.size.single ? 'is-mobile' : ''}`} onTouchStart={touchStart} onTouchEnd={touchEnd}>
          <div className="book-position"><div className="book-underlay" aria-hidden="true"/><div className="spine" aria-hidden="true"/>
            <PageVisibility.Provider value={visibility}><HTMLFlipBook key={layout.version} ref={book as never} width={layout.size.width} height={layout.size.height} size="fixed" minWidth={160} maxWidth={460} minHeight={140} maxHeight={1000} startPage={page} drawShadow={!reduceMotion} flippingTime={650} usePortrait={layout.size.single} startZIndex={10} autoSize={false} maxShadowOpacity={0.16} showCover={true} mobileScrollSupport={true} clickEventForward={true} useMouseEvents={false} swipeDistance={55} showPageCorners={false} disableFlipByClick={true} className="flipbook" style={{}} {...handlers}>{pages}</HTMLFlipBook></PageVisibility.Provider>
          </div>
        </div>}
      </div>
      <div className="book-controls"><button className="page-nav" onClick={previous} disabled={page === 0 || !ready || turning} aria-label="Previous page"><ChevronLeft size={18}/><span>Previous</span></button><div className="page-indicator" aria-live="polite" aria-atomic="true"><span>{page === 0 ? 'The beginning' : chapter?.name}</span><small>{page === 0 ? 'COVER' : `${String(page).padStart(2, '0')} / ${String(layout.pages.length - 1).padStart(2, '0')}`}</small></div><button className="page-nav" onClick={next} disabled={page >= last || !ready || turning} aria-label="Next page"><span>{page === 0 ? 'Open' : 'Next'}</span><ChevronRight size={18}/></button></div>
      <nav className="chapter-navigation" aria-label="Invitation chapters">{chapters.map(item => <button key={item.id} onClick={() => go(layout.pages.findIndex(p => p.chapterId === item.id && (p.kind === 'text' || p.kind === 'rsvp')))} className={chapter?.id === item.id ? 'active' : ''} aria-label={`Go to ${item.name}`} aria-current={chapter?.id === item.id ? 'step' : undefined} disabled={!ready || turning}><span className="chapter-dot"/><span className="chapter-name">{item.name}</span></button>)}</nav>
    </main>
    <div className={`pagination-probe ${candidate.height < 390 ? 'short-book' : ''}`} ref={probe} style={pageStyle(candidate)} aria-hidden="true" inert>
      {chapters.filter(item => item.id !== 'rsvp').map(item => <div className="book-page" data-chapter={item.id} key={item.id}><div className="page-layout"><div className="page-body"><ChapterHeading chapter={item}/><div className="text-block-list">{item.blocks.map(block => <BlockView key={block.id} block={block}/>)}</div></div><div className="page-footer"><span>{wedding.names.join(' & ')}</span><span>00</span></div></div></div>)}
    </div>
  </div>;
}
