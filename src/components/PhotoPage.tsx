import { useState } from 'react';
import { wedding } from '../config/wedding';

type Photo = { src: string; alt: string; caption: string; position: string };
const companionPhotos = [wedding.photos.invitation, wedding.photos.day, wedding.photos.story];

function Snapshot({ photo, index }: { photo: Photo; index: number }) {
  const [failed, setFailed] = useState(false);
  return <figure className={`snapshot snapshot-${index}`}>
    <span className="photo-tape" aria-hidden="true"/>
    {!failed ? <img src={photo.src} alt={photo.alt} style={{ objectPosition: photo.position }} onError={() => setFailed(true)} draggable={false}/> : <div className="photo-fallback">With love</div>}
    <figcaption>{photo.caption}</figcaption>
  </figure>;
}

export function PhotoPair({ photo, number, compact = false }: { photo: Photo; number: number; compact?: boolean }) {
  const alternatives = companionPhotos.filter(item => item.src !== photo.src);
  const companion = alternatives[number % alternatives.length];
  return <div className={`photo-pair ${compact ? 'photo-pair-compact' : ''}`}>
    <Snapshot photo={photo} index={0}/><Snapshot photo={companion} index={1}/>
  </div>;
}

export function PhotoPage({ photo, number, note = 'a little piece of our forever' }: { photo: Photo; number: number; note?: string }) {
  return <div className="photo-layout"><p className="scrapbook-kicker">Collected moments · {String(number).padStart(2, '0')}</p><PhotoPair photo={photo} number={number}/><p className="scrapbook-note">{note}</p><span className="scrapbook-page-number">{String(number).padStart(2, '0')}</span></div>;
}
