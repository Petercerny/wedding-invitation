import { ArrowUpRight } from 'lucide-react';
import { wedding } from './config/wedding';

export type ChapterId = 'story' | 'invitation' | 'day' | 'guests' | 'rsvp';
export type Photo = typeof wedding.photos.story;
export interface ContentBlock {
  id: string;
  text: string;
  kind?: 'paragraph' | 'detail' | 'event' | 'link' | 'signature';
  title?: string;
  label?: string;
  time?: string;
  href?: string;
  start?: number;
  end?: number;
}
export interface Chapter {
  id: ChapterId;
  name: string;
  title: string;
  photo: Photo;
  blocks: ContentBlock[];
}
export interface PageDescriptor {
  id: string;
  kind: 'cover' | 'photo' | 'text' | 'rsvp';
  chapterId?: ChapterId;
  blocks?: ContentBlock[];
  continuation?: boolean;
}

export const chapters: Chapter[] = [
  { id: 'story', name: wedding.chapters[0], title: wedding.story.title, photo: wedding.photos.story, blocks: [
    ...wedding.story.paragraphs.map((text, i) => ({ id: `story-${i}`, text })),
    { id: 'signature', text: wedding.story.signature, kind: 'signature' },
  ] },
  { id: 'invitation', name: wedding.chapters[1], title: wedding.invitation.title, photo: wedding.photos.invitation, blocks: [
    { id: 'invitation-intro', text: wedding.invitation.intro },
    { id: 'date', title: wedding.date, text: wedding.invitation.time, kind: 'detail' },
    { id: 'venue', title: wedding.invitation.venue, text: wedding.invitation.address.join('\n'), kind: 'detail' },
    { id: 'directions', text: 'Get directions', href: wedding.invitation.directions, kind: 'link' },
    { id: 'arrival', text: wedding.invitation.note },
  ] },
  { id: 'day', name: wedding.chapters[2], title: wedding.day.title, photo: wedding.photos.day, blocks: [
    { id: 'day-intro', text: wedding.day.intro },
    ...wedding.schedule.map((item, i) => ({ id: `event-${i}`, text: item.detail, title: item.title, label: item.label, time: item.time, kind: 'event' as const })),
  ] },
  { id: 'guests', name: wedding.chapters[3], title: wedding.guestTitle, photo: wedding.photos.guests, blocks: [
    ...wedding.guests.map((item, i) => ({ id: `guest-${i}`, title: item.title, text: item.text, kind: 'detail' as const })),
    { id: 'deadline', text: `Kindly RSVP by ${wedding.rsvp.deadline}.` },
  ] },
  { id: 'rsvp', name: wedding.chapters[4], title: wedding.rsvp.title, photo: wedding.photos.rsvp, blocks: [] },
];

export function ChapterHeading({ chapter, continuation = false }: { chapter: Chapter; continuation?: boolean }) {
  return <div className="chapter-heading"><p className="eyebrow">{String(chapters.indexOf(chapter) + 1).padStart(2, '0')} / {chapter.name}{continuation && <span> · continued</span>}</p><h2>{chapter.title}</h2><span className="ink-underline" aria-hidden="true"/></div>;
}

export function BlockView({ block }: { block: ContentBlock }) {
  return <div className={`text-block block-${block.kind || 'paragraph'}`} data-block-id={block.id} data-word-start={block.start || 0}>
    {block.time && <time>{block.time}</time>}
    {block.label && <p className="block-label">{block.label}</p>}
    {block.title && <h3>{block.title}</h3>}
    {block.href ? <a className="directions-link" href={block.href} target="_blank" rel="noreferrer">{block.text}<ArrowUpRight size={14}/><span className="sr-only"> (opens a new tab)</span></a> : <p className="block-text">{block.text}</p>}
  </div>;
}
