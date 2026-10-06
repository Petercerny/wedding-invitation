import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { wedding } from '../config/wedding';
export const BookPage = forwardRef<HTMLDivElement, { children: ReactNode; number: number; visible: boolean; cover?: boolean; photo?: boolean }>(function BookPage({ children, number, visible, cover = false, photo = false }, ref) {
  return <div ref={ref} className={`book-page ${cover ? 'cover-page' : ''} ${photo ? 'photo-page' : ''}`} data-density={cover ? 'hard' : 'soft'} aria-hidden={!visible} inert={!visible}>
    {cover || photo ? children : <div className="page-layout"><div className="page-body">{children}</div><div className="page-footer"><span>{wedding.names.join(" & ").toUpperCase()}</span><span>{String(number).padStart(2, '0')}</span></div></div>}
  </div>;
});
