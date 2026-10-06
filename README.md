# Emma & Daniel — a wedding invitation in a book

A runnable React + TypeScript + Tailwind CSS MVP, built with Vite and react-pageflip. Includes a cover and five photo-and-information spreads, keyboard navigation, touch swiping, a persistent RSVP shortcut, accessible HTML content, and reduced-motion support.

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

The book uses two facing pages on desktop and one on mobile. Content measurement increases the book height when needed; the document can scroll vertically. Text is never scaled down to fit. Native library click/drag turning is disabled so inputs and links are safe; deliberate horizontal touch swipes are handled separately, and RSVP swipes are disabled. Keyboard arrows are ignored while using a form field or other interactive control. Reduced motion calls the library's immediate `turnToPage` method.

## Browser checks

```sh
npm test            # RSVP validation and storage adapter checks
npm run test:e2e    # Desktop/mobile browser checks
```

Tests use Playwright and the system Chromium at `/usr/bin/chromium` in this workspace. On a machine without system Chromium, run `npx playwright install chromium` and remove the `executablePath` override from `playwright.config.ts`.

## Verification in this workspace

The RSVP service tests passed, and every bundled image was checked for validity. Dependency installation required network approval and was interrupted, so the production build and Playwright browser tests have not been run yet. The browser checks are provided above for reproducible verification once dependencies are installed.
