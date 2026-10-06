# Míša & Petr — a scrapbook wedding invitation

A React + TypeScript + Tailwind CSS invitation, built with Vite and react-pageflip. The pale green scrapbook fits the viewport, with two-photo collages, supplied botanical stickers, readable text pages, and a step-by-step demo RSVP. Includes keyboard navigation, touch swiping, hidden-page focus protection, and reduced-motion support.

## Run locally

Requires Node.js 20.19+ or 22+ and npm.

```sh
cd wedding-invitation
npm install
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173). To make a production build:

```sh
npm run build
npm run preview
```

`dist/` is a static website that can be hosted on any static hosting provider. No backend credentials are needed.

## Edit your invitation

- **Names, date, story, venue, address, directions, schedule, guest details, deadline, and photo captions:** `src/config/wedding.ts`.
- **Photographs:** replace the WebP files in `public/images/`, or change the `photos` paths in the configuration. Paths such as `/images/our-photo.jpg` correspond to `public/images/our-photo.jpg`. Update each photograph's `alt` description and `position` if needed. Included photographs are generated fictional placeholders.
- **Colours and typography:** shared theme tokens and book styling in `src/styles.css`. Fonts are bundled locally.
- **Stickers:** transparent source assets live in `public/stickers/`; placement is handled by `WeddingStickers` and the book styles.
- **Browser title and description:** `index.html`.

## RSVP demo and real storage

The demo validates full name, email, attendance and guest count, then saves a response to localStorage under `emma-daniel:rsvp-demo:v1`. It shows conditional guest/dietary fields, a loading state, a storage error with retry, and a warm confirmation. Declining responses save zero guests and no dietary requirements. It does **not** send email or deliver responses to the couple. Storage is local to a browser/device and can be cleared in browser developer tools.

Replace `submitRsvp` in `src/services/rsvp.ts` with a `fetch` call to your own HTTPS endpoint. Keep its promise contract, return a saved response ID, and throw an error on failure so the existing loading/success/error UI continues to work. Validate the same fields on the server and store them in your database. Keep service credentials on the server. After connecting and verifying real delivery, update the demo notices, submit label, and confirmation copy in the form/config to describe the actual behaviour.

## Structure

```
src/
  config/wedding.ts        # Wedding content and replaceable photographs
  components/BookPage.tsx  # Reusable page shell with hidden-page focus protection
  components/PhotoPage.tsx # Photograph and caption
  components/RsvpForm.tsx # RSVP UI and state
  services/rsvp.ts         # Validation and replaceable storage adapter
  App.tsx                 # Book and navigation
  styles.css              # Tailwind theme and physical-book details
```

The book uses two facing pages where space permits and one on phones or short screens. The available viewport determines its dimensions. Text is measured after fonts load and split into continuation pages without removing details or scaling the book. Page descriptors drive chapter navigation and restore the reading position after resizing. RSVP uses short steps, splitting contact and guest fields further on short screens or with enlarged text; values and the active step survive resizing. Native library click/drag turning is disabled so inputs and links are safe; deliberate horizontal touch swipes are handled separately, and RSVP swipes are disabled. Keyboard arrows are ignored while using a form field or other interactive control. Reduced motion calls the library's immediate `turnToPage` method.

## Browser checks

```sh
npm test            # RSVP validation and storage adapter checks
npm run test:e2e    # Desktop, laptop, tablet, phone and landscape checks
```

Tests use Playwright with installed Google Chrome on Windows or `/usr/bin/chromium` on Linux. Set `CHROMIUM_PATH` to use another Chromium executable. On a machine without a system browser, run `npx playwright install chromium` and remove the `executablePath` override from `playwright.config.ts`.

Browser checks verify viewport fit, preservation of prose through pagination, navigation, resize behavior, text enlargement, and RSVP validation, storage, and retry behavior. The storage key remains `emma-daniel:rsvp-demo:v1` for compatibility with existing demo responses.
