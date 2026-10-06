/** All sample wedding content lives here. Replace images in public/images. */
export const wedding = {
  names: ['Emma', 'Daniel'], initials: 'E & D',
  date: 'Saturday, 19 June 2027', shortDate: '19 . 06 . 2027',
  location: 'THE COTSWOLDS, ENGLAND',
  cover: { eyebrow: 'THE WEDDING OF', line: 'A new chapter, together.', action: 'Open our invitation' },
  story: { title: 'It was always you.', paragraphs: [
    'One chance meeting, two coffees, and a conversation neither of us wanted to end. What began on a rainy afternoon became our favourite adventure.',
    'Since then, we’ve filled our days with little discoveries, long walks, and a home full of laughter. Now, we’re beginning our next chapter — and we can’t imagine it without you.'
  ], signature: 'With love, Emma & Daniel' },
  invitation: { intro: 'Together with our families, we invite you to celebrate our marriage.', title: 'You, us & a little forever.', time: '3:00 in the afternoon', venue: 'The Manor House', address: ['Castle Combe, Chippenham', 'Wiltshire, SN14 7HR, England'], directions: 'https://www.google.com/maps/search/?api=1&query=The+Manor+House+Castle+Combe+SN14+7HR', note: 'Please arrive from 2:30pm to settle in before the ceremony.' },
  day: { title: 'From this moment on.', intro: 'A day to remember, with our favourite people.' },
  guestTitle: 'Come as our guest.',
  schedule: [
    { time: '3:00 PM', title: 'The “I do” moment', label: 'Ceremony', detail: 'Meet us in the garden for the beginning of forever.' },
    { time: '4:00 PM', title: 'A little celebration', label: 'Reception', detail: 'Drinks, canapés, and a toast or two on the lawn.' },
    { time: '6:00 PM', title: 'Around the table', label: 'Dinner', detail: 'A seasonal feast, good company, and heartfelt words.' },
    { time: '8:00 PM', title: 'Under the stars', label: 'Evening celebration', detail: 'Dancing, laughter, and one more song. Carriages at midnight.' }
  ],
  guests: [
    { title: 'Dress code', text: 'Garden formal. Think summer suits and elegant dresses. The ceremony is on the lawn, so block heels or flats are a lovely idea.' },
    { title: 'Getting here', text: 'Chippenham station is a 20-minute taxi ride away, with direct trains from London Paddington. Please book your return taxi ahead of time.' },
    { title: 'Parking', text: 'Complimentary parking is available at the venue. Cars may be left overnight and collected the next morning.' },
    { title: 'Make a weekend of it', text: 'Stay at The Manor House or explore the inns and guesthouses in Castle Combe. We recommend booking early.' }
  ],
  rsvp: { deadline: '19 May 2027', title: 'Save your seat.', intro: 'Our day would be sweeter with you there.', maxGuests: 6, demoNotice: 'Demo RSVP · Responses are saved only in this browser, not sent to the couple.', successTitle: 'With love & thanks.', acceptMessage: 'What a joy to celebrate together. Your demo response has been saved.', declineMessage: 'You’ll be with us in spirit. Thank you for your lovely wishes. Your demo response has been saved.' },
  photos: {
    story: { src: '/images/couple.webp', alt: 'Sample wedding portrait of a couple walking hand in hand in an English garden', caption: 'The best days are the ones with you.', position: 'center' },
    invitation: { src: '/images/bouquet.webp', alt: 'Ivory bridal bouquet with silk ribbon in a country garden', caption: 'A day for love, a place for you.', position: 'center' },
    day: { src: '/images/table.webp', alt: 'An intimate garden wedding table with flowers and candlelight', caption: 'Let’s make a day of it.', position: 'center' },
    guests: { src: '/images/bouquet.webp', alt: 'Soft ivory flowers and sage greenery', caption: 'All the little details.', position: 'center' },
    rsvp: { src: '/images/couple.webp', alt: 'The sample couple smiling at one another in a sunlit garden', caption: 'Here’s to our next chapter.', position: '52% center' }
  },
  chapters: ['Our story', 'The invitation', 'The day', 'Guest information', 'RSVP']
};
