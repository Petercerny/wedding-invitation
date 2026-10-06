import { useState } from 'react';
export function PhotoPage({ photo, number }: { photo: { src: string; alt: string; caption: string; position: string }; number: number }) {
  const [failed, setFailed] = useState(false);
  return <figure className="photo-layout">{!failed ? <img src={photo.src} alt={photo.alt} style={{ objectPosition: photo.position }} onError={() => setFailed(true)} draggable={false}/> : <div className="photo-fallback"><span>With love</span><p>Our next chapter</p></div>}<figcaption><span>{photo.caption}</span><small>{String(number).padStart(2, '0')}</small></figcaption></figure>;
}
