import { chapters } from './bookContent';
import { wedding } from './config/wedding';
import type { ContentBlock, PageDescriptor } from './bookContent';

/** Measure the actual typography, including split pieces, in the inert layout probe. */
export function paginateBook(probe: HTMLElement): PageDescriptor[] {
  const result: PageDescriptor[] = [{ id: 'cover', kind: 'cover' }];
  for (const chapter of chapters) {
    result.push({ id: `${chapter.id}-photos`, kind: 'photo', chapterId: chapter.id });
    if (chapter.id === 'rsvp') {
      result.push({ id: 'rsvp-form', kind: 'rsvp', chapterId: 'rsvp' });
      continue;
    }
    const specimen = probe.querySelector<HTMLElement>(`[data-chapter="${chapter.id}"]`)!;
    const body = specimen.querySelector<HTMLElement>('.page-body')!;
    const heading = specimen.querySelector<HTMLElement>('.chapter-heading')!;
    const list = specimen.querySelector<HTMLElement>('.text-block-list')!;
    const gap = parseFloat(getComputedStyle(list).rowGap);
    // A small reserve absorbs fractional line heights and browser rounding.
    const capacity = Math.max(32, body.clientHeight - heading.getBoundingClientRect().height - 12);
    let blocks: ContentBlock[] = [];
    let used = 0;
    let continuation = false;
    const flush = () => {
      if (!blocks.length) return;
      const first = blocks[0];
      result.push({ id: `${chapter.id}-${first.id}-${first.start || 0}`, kind: 'text', chapterId: chapter.id, blocks, continuation });
      blocks = []; used = 0; continuation = true;
    };
    for (const block of chapter.blocks) {
      const original = list.querySelector<HTMLElement>(`[data-block-id="${block.id}"]`)!;
      const words = block.text.split(/\s+/);
      let start = 0;
      while (start < words.length) {
        const clone = original.cloneNode(true) as HTMLElement;
        if (start > 0) clone.querySelectorAll('h3, time, .block-label').forEach(node => node.remove());
        const text = clone.querySelector<HTMLElement>('.block-text');
        // Links are atomic; all prose uses the same rendering as the real pages.
        list.appendChild(clone);
        const measure = (end: number) => {
          if (text) text.textContent = start === 0 && end === words.length ? block.text : words.slice(start, end).join(' ');
          return clone.getBoundingClientRect().height;
        };
        const available = capacity - used - (blocks.length ? gap : 0);
        let end = words.length;
        if (measure(end) > available) {
          if (blocks.length) { clone.remove(); flush(); continue; }
          if (text) {
            let low = start + 1, high = words.length;
            while (low < high) {
              const mid = Math.ceil((low + high) / 2);
              if (measure(mid) <= available) low = mid; else high = mid - 1;
            }
            end = low;
          }
        }
        const measured = measure(end);
        clone.remove();
        blocks.push({ ...block, text: start === 0 && end === words.length ? block.text : words.slice(start, end).join(' '), title: start === 0 ? block.title : undefined, time: start === 0 ? block.time : undefined, label: start === 0 ? block.label : undefined, start, end });
        used += measured + (blocks.length > 1 ? gap : 0);
        start = end;
        if (start < words.length) flush();
      }
    }
    flush();
  }
  // An open spread always has a right-hand page, including after continuations.
  if (result.length % 2 === 0) result.push({ id: 'closing-note', kind: 'text', chapterId: 'rsvp', blocks: [{ id: 'closing', kind: 'signature', text: weddingClosing() }] });
  return result;
}

function weddingClosing() { return `${wedding.cover.line}\nWith love, ${wedding.names.join(' & ')}`; }

export function restoreReadingPosition(previous: PageDescriptor[], next: PageDescriptor[], index: number): number {
  const old = previous[index];
  if (!old) return 0;
  const exact = next.findIndex(item => item.id === old.id);
  if (exact >= 0) return exact;
  const anchor = old.blocks?.[0];
  if (anchor) {
    const match = next.findIndex(item => item.chapterId === old.chapterId && item.blocks?.some(block => block.id === anchor.id && (block.start || 0) <= (anchor.start || 0) && (block.end || Infinity) > (anchor.start || 0)));
    if (match >= 0) return match;
  }
  return Math.max(0, next.findIndex(item => item.chapterId === old.chapterId && item.kind === old.kind));
}
