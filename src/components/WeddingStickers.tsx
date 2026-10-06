export function WeddingStickers({ number, cover = false, photo = false }: { number: number; cover?: boolean; photo?: boolean }) {
  return <div className="wedding-stickers" aria-hidden="true">
    <span className={`sticker-leaf ${number % 2 ? 'leaf-left' : 'leaf-right'}`}><img src={`/stickers/${number % 3 ? 'eucalyptus' : 'leaf-sprig'}.png`} alt="" draggable={false}/></span>
    {(cover || photo) && <span className="sticker-rings"><img src="/stickers/wedding-rings.png" alt="" draggable={false}/></span>}
    {photo && <span className="paper-stamp">WITH LOVE<br/><b>M & P</b><span>19 JUN 2027</span></span>}
  </div>;
}
