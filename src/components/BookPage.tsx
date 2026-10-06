import { createContext, forwardRef, useContext } from 'react';
import type { ReactNode } from 'react';
import { wedding } from '../config/wedding';
import { WeddingStickers } from './WeddingStickers';
export const PageVisibility = createContext({ page: 0, single: false });
export const BookPage = forwardRef<HTMLDivElement, { children: ReactNode; number: number; id: string; cover?: boolean; photo?: boolean; rsvp?: boolean }>(function BookPage({ children, number, id, cover = false, photo = false, rsvp = false }, ref) {
  const { page, single } = useContext(PageVisibility);
  const visible = number === page || (!single && page > 0 && number === page + 1);
  return <div ref={ref} className={`book-page ${cover ? 'cover-page' : ''} ${photo ? 'photo-page' : ''} ${rsvp ? 'rsvp-page' : ''}`} data-page-id={id} data-density={cover ? 'hard' : 'soft'} aria-hidden={!visible} inert={!visible}>
    {cover || photo ? children : <div className="page-layout"><div className="page-body">{children}</div><div className="page-footer"><span>{wedding.names.join(' & ')}</span><span>{String(number).padStart(2, '0')}</span></div></div>}
    <WeddingStickers number={number} cover={cover} photo={photo}/>
  </div>;
});
