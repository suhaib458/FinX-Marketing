# Phase 4 Final Cleanup and Verification

Phase 4 is approved. This report describes the final source state and the completed automated and manual browser acceptance checks. Phase 5 and the color redesign were not started.

## Controlled failure

- Final source: `mockGeneration._shouldFail()` returns `import.meta.env.DEV && window.__FINX_FAIL_MOCK === true`.
- Failure is disabled by default because the flag must be explicitly set to the boolean value `true` in a development build.
- The production build compiles `_shouldFail()` to `return false`; `__FINX_FAIL_MOCK` is absent from the production bundle, so the debug flag cannot activate controlled failure in production.
- Manual browser verification confirmed that setting `window.__FINX_FAIL_MOCK = true` in development activates the controlled failure path.
- The controlled failure deducted zero credits and created neither a result nor a Recent Activity entry.

## Advertising design download

- The FinX Download button creates an SVG using the result's current headline, offer, CTA, primary and secondary colors, selected aspect ratio, and current logo visibility state.
- SVG text and attributes are XML-escaped. A logo `<image>` is emitted only when the current result contains a logo.
- The saved-logo and saved-color switches now determine whether those brand values are included in the generated advertising design.
- Manual verification used the actual FinX Download button and the resulting browser-downloaded SVG.
- The downloaded file existed, was non-empty, opened successfully, and contained the current headline, offer, CTA, colors, selected aspect ratio, and logo visibility state.

## Variation behavior in the final code

The Social Post and Advertising Design flows share the following final behavior:

- A variation receives a newly generated result ID and records the original ID in `originalId`.
- The original is deep-cloned before changes, so the original result remains unchanged.
- Social Post variations visibly prefix the headline and change caption formatting.
- Advertising Design variations visibly prefix the headline and swap the primary and secondary colors.
- The result is persisted to local storage and added to Recent Activity.
- The variation starts with `saved: false`, so Saved Items does not increase automatically and it does not appear in Library until Save is pressed.
- Credits are deducted once, after successful variation generation: 5 for Social Post and 20 for Advertising Design.
- Because results and activity use local storage, variations are designed to survive refresh.

Manual browser verification confirmed the following acceptance results:

- Social Post produced a new variation ID different from the original result ID.
- The Social Post variation visibly changed while the original result remained unchanged.
- Social Post deducted exactly 5 credits, survived browser refresh, and was present in Recent Activity.
- Creating the Social Post variation did not increase Saved Items or add it to Library automatically; it appeared in Library only after Save was pressed.
- Advertising Design produced a new variation ID different from the original result ID and deducted exactly 20 credits.

## Dependency and temporary-file cleanup

- Removed temporary Playwright installation because the project has no documented Playwright test script.
- Removed temporary root artifacts: `capture_screens.cjs`, `test-download.cjs`, `verify_svg.cjs`, and `finx-design-mock.svg`.
- `package.json` and `package-lock.json` contain no Playwright dependency.
- No temporary verification files remain in the application root.

## Final build

`npm run build` completed successfully with 1,845 modules transformed, zero errors, and zero meaningful warnings. The build output contains no `__FINX_FAIL_MOCK` reference.

Manual browser verification completed with zero browser console errors.

## Changed files

- `src/components/ui/GeneratingScreen.jsx`
- `src/pages/app/CreateContent.jsx`
- `src/pages/app/ContentResult.jsx`
- `src/services/mockGeneration.js`
- `src/i18n/en.js`
- `src/i18n/ar.js`
- `package.json`
- `package-lock.json`
- `walkthrough.md`

Removed temporary files:

- `capture_screens.cjs`
- `test-download.cjs`
- `verify_svg.cjs`
- `finx-design-mock.svg`

---

# FinX Visual Identity Corrective Pass

Phase 4 remains approved. This corrective typography, contrast, hierarchy, and color-distribution pass supersedes the earlier visual-refresh description. Phase 5 was not started.

## Local Amiri installation

The supplied licensed archive was the only source used. These files are installed in `src/assets/fonts/amiri/`:

- `Amiri-Regular.ttf` — 421,196 bytes
- `Amiri-Bold.ttf` — 403,996 bytes
- `Amiri-Italic.ttf` — 418,528 bytes
- `Amiri-BoldItalic.ttf` — 400,176 bytes
- `OFL.txt` — 4,480 bytes

`src/styles/global.css` contains four local `@font-face` declarations covering normal 400, normal 700, italic 400, and italic 700, all with `font-display: swap`. The relative URLs resolve from that stylesheet to `../assets/fonts/amiri/`.

The production build emitted all four fonts as hashed TTF assets with byte sizes identical to the supplied files. A production-preview HTTP check returned status 200 and the exact expected byte size for each emitted font. There are no Google Fonts imports or other remote font hosts in the source.

## Centralized design system

- Mulled Berry `#73465F` and Petal Beige `#EBCBC1` are the core identity tokens in `src/styles/variables.css`.
- Dark Mode now separates page `#120C10`, sidebar `#1A1116`, surface `#24171E`, secondary surface `#302028`, and elevated surface `#3A2731`.
- Light Mode now separates page `#FAF1EE`, sidebar `#FFF9F7`, surface `#FFFDFC`, secondary surface `#F3DEDA`, and elevated surface `#FFFFFF`.
- Both modes define semantic text, subtle/default/strong borders, action, hover, active, focus, shadow, overlay, disabled, input, and navigation tokens.
- Existing components consume compatibility aliases backed by the new semantic system, so the identity updates consistently across public, authentication, onboarding, application shell, Dashboard, creation, generation, results, Library, Analytics, Settings, modal, toast, empty, and loading states.
- Tool accents use a centralized warm palette. Semantic success, warning, error, and information colors remain distinct and have accessible light/dark foreground variants.
- Primary, secondary, ghost, outline, and disabled buttons; cards; inputs; textareas; selects; autofill; chips; toggles; checkboxes; upload zones; progress indicators; navigation; badges; focus rings; skeletons; overlays; and scrollbars inherit the new tokens.

## Typography

- Arabic UI uses `"Amiri", "Noto Naskh Arabic", serif` from `--font-arabic`.
- English UI and the FinX wordmark use the non-condensed `"Inter", "Segoe UI", Arial, sans-serif` stack from `--font-english`.
- The previous Arial Narrow, Roboto Condensed, and Oswald stack has been removed completely from source, public assets, and production output.
- Arabic type tokens increase small metadata to at least 14px, body/form controls to 16–17px, section headings to 24px or larger, and primary page headings to 32–36px. Arabic body line height is 1.8, controls use 1.6, headings use 1.42, and letter spacing is normal.
- Buttons, inputs, textareas, and selects inherit the active language font. English wordmarks, email fields, platform names, and other explicit Latin UI received appropriate `lang="en"`/LTR markup where available.
- Malison was not downloaded, embedded, hotlinked, imitated, or declared as a font family.

## Customer brand-color preservation

- New customer-brand fallback colors are centralized in `src/constants/brandDefaults.js`.
- Saved/user-selected advertising colors still override those defaults.
- Advertising previews, variations, and SVG downloads continue to read colors from result/customer data rather than FinX interface tokens.
- Uploaded logos and product images remain data-driven and unchanged.
- The black/white emergency fallbacks in advertising variation swapping are intentionally preserved because they belong to generated customer content, not the FinX interface identity.

## Legacy identity cleanup

The complete source and public-asset search contains zero matches for:

- `#28469E`
- `#CAE8E8`
- `#4050F5`
- Their previous RGB triplets

There are no intentionally preserved matches for the old FinX identity colors.

## Accessibility checks

- Tested Light Mode contrast: primary/page 14.07:1, secondary/page 7.03:1, muted/page 5.07:1, muted/input 5.64:1, primary button 7.22:1, disabled 5.19:1.
- Tested Dark Mode contrast: primary/page 18.42:1, secondary/surface 12.30:1, muted/surface 7.71:1, muted/input 6.88:1, accent/surface 9.57:1, primary button 7.22:1, disabled 6.23:1.
- Dark status text ratios against the primary surface are success 9.38:1, warning 9.49:1, error 7.66:1, and information 8.46:1.
- Dark semantic status colors were separated from the danger-button background to keep both status text and danger buttons readable.
- Selected chips now use a filled Berry surface, warm-white label, two-pixel border, bold weight, and checkmark. Campaign-day selection and active navigation also use stronger borders/inset indicators, so selection does not rely on color alone.

## Visual hierarchy corrections

- Dashboard and Create cards now use distinct surfaces, stronger borders, controlled shadows, larger descriptions, clearer tool icons, and readable credit/action text.
- The sidebar has its own background token, strong separating border, larger navigation labels, high-contrast active indicator, separated credits card, and larger user metadata.
- The top-bar title is larger and bold while its existing actions remain unchanged.
- Generation forms use larger labels/controls, increased field spacing, separated form surfaces, and Amiri-safe control heights.
- The generating card has a stronger boundary and shadow; its title and progress steps are larger, and pending/completed/active states have distinct text, background, and icon treatment.
- Result pages use a wider readable canvas, larger metadata and captions, card-like section separation, taller editable areas, and a distinct action bar.
- Library uses a balanced responsive grid with larger cards and three-line readable previews.
- Settings uses larger section headings, clearer grouping, taller rows, visible focus, and the existing semantic destructive Logout color.

## Build and source verification

- `npm run build` completes with 1,846 modules transformed, zero errors, and zero meaningful warnings.
- All four Amiri fonts are included in the production build.
- The production bundle contains no old identity color references.
- Theme and language persistence logic, routes, authentication, validation, credits, generation, variations, downloads, result persistence, Recent Activity, Saved Items, and Library logic were not changed by the visual refactor.

## Browser evidence status

The production font files were verified over the local preview server, but the in-app browser surface was unavailable during this pass. The following are not claimed without direct browser evidence:

- Light/Dark and Arabic RTL/English LTR visual inspection
- Theme/language synchronization interaction checks
- Autofill and keyboard-focus visual inspection
- Responsive inspection at 1440px, 1366×768, 768px, and 360×800
- Advertising Design generation/download independence check
- Browser console result
- Requested screenshots

These browser-only checks and screenshots remain required before visual approval.

## Files changed for the identity refresh

Design-system and style files:

- `src/styles/variables.css`
- `src/styles/global.css`
- `src/styles/components.css`
- `src/styles/layout.css`
- `src/styles/landing.css`
- `src/styles/auth.css`
- `src/styles/onboarding.css`
- `src/styles/create.css`
- `public/favicon.svg`
- `src/assets/fonts/amiri/Amiri-Regular.ttf`
- `src/assets/fonts/amiri/Amiri-Bold.ttf`
- `src/assets/fonts/amiri/Amiri-Italic.ttf`
- `src/assets/fonts/amiri/Amiri-BoldItalic.ttf`
- `src/assets/fonts/amiri/OFL.txt`

Components and supporting source:

- `src/constants/brandDefaults.js`
- `src/components/ui/AuthVisual.jsx`
- `src/components/ui/GeneratingScreen.jsx`
- `src/pages/Landing.jsx`
- `src/pages/Onboarding.jsx`
- `src/pages/app/Dashboard.jsx`
- `src/pages/app/CreateContent.jsx`
- `src/pages/app/ContentResult.jsx`
- `src/pages/app/Library.jsx`
- `src/pages/app/Settings.jsx`
- `src/services/mockGeneration.js`
- `src/pages/Login.jsx`
- `src/pages/Register.jsx`
- `src/components/layout/AppLayout.jsx`
- `src/components/layout/PublicLayout.jsx`
- `walkthrough.md`

## Remaining visual limitations

- Inter is used when installed on the client system; otherwise the English UI falls back to Segoe UI, Arial, then sans-serif because no local English font package was supplied.
- Direct browser visual QA, responsive screenshots, and browser-console inspection remain pending because the required in-app browser surface was unavailable.

---

# Final Premium UI Polish — FinX Aurora Edge

This section supersedes earlier visual-state descriptions where they differ. It describes the final premium-polish code only. Phase 5 was not started, and Phase 1–4 data and application behavior were not changed.

## Reusable card system

The reusable **FinX Aurora Edge** treatment is implemented in `src/styles/components.css` and backed by Light/Dark theme tokens in `src/styles/variables.css`:

- `.fx-card` provides the controlled elevated surface, subtle masked gradient edge, soft Berry outer shadow, and inner top highlight.
- `.fx-card--interactive` adds keyboard focus and a maximum three-pixel hover lift.
- `.fx-card--selected` increases the edge and shadow strength for selection without relying on color alone.
- `.fx-card--elevated` is used for important action and preview surfaces.
- `.fx-card--empty` provides a restrained dashed empty-state treatment.
- `.fx-card--result` separates generated content sections.
- `.fx-card--quiet` keeps static information panels deliberately softer and disables the decorative gradient edge.

Light Mode uses warm-white cards, a very subtle Berry/Beige edge, and soft gray/Berry shadows. Dark Mode uses the deeper Berry-tinted layered surface and a stronger—but still controlled—edge. The effect does not flash or glow continuously.

## Screen hierarchy

- Dashboard tool cards receive the strongest interactive Aurora treatment, consistent icon containers, visible Create actions, credit badges, and content-specific decorative previews for Social Post, Advertising Design, Content Ideas, and Campaign.
- Dashboard statistics use quiet static cards with larger values. Recent Activity and Smart Suggestions use distinct, restrained treatments. The first-content empty state now has a larger illustrated focal point and a bounded, helpful layout.
- Create selectors are interactive Aurora cards; generation forms remain quiet; generated previews, the generating state, result sections, and result actions use elevated/result variants.
- Library saved items are full-card, keyboard-operable interactive targets. The empty state uses a CSS/icon folder composition, one primary Create Content action, three content-type hints, and an explanation that saved results appear there.
- Analytics remains explicitly non-functional. Its Coming Soon page uses a responsive two-column explanation and a clearly labeled decorative preview with chart bars, engagement summary, and best-performing-post sample. The upload control remains disabled.
- Landing tool cards are static Aurora surfaces. Pricing uses quiet cards, with the recommended tier receiving the selected treatment.
- Sidebar credits, static form panels, settings-style information surfaces, and other non-clickable panels intentionally remain quieter and do not lift on hover.

## Shell, layout, and controls

- The duplicated top-bar page title was removed, leaving each page’s semantic heading as the single primary title.
- Sidebar separation, active-item fill/side marker, brand truncation, credit grouping, bottom account alignment, and short-height desktop spacing were refined.
- Shared `1440px` maximum content width, `24px` page gap, `32px` section gap, `18px` card radius, and `12px` control radius tokens now govern application layout.
- Buttons use minimum heights of 38px small, 46px medium, and 50px large; icon buttons use consistent 40–44px containers. Lucide icons in the shared button component use a consistent 1.9 stroke width.
- Selected chips retain fill, border, and checkmark; unselected, hover, selected, and focus states remain distinct with a minimum 40px target.
- Horizontal page overflow is suppressed while intentional horizontal scrollers remain available.

## Accessibility and motion

- Navigable Library cards support mouse click, Enter, and Space, and expose visible `:focus-visible` styling.
- Interactive cards and chips have visible keyboard focus. Selection is communicated by edge/border weight and indicators as well as color.
- Icon-only shell controls retain accessible labels and native title tooltips.
- Arabic continues to use the four local Amiri faces and natural Arabic spacing/line height; explicit Latin technical content retains the English stack and direction where marked.
- `prefers-reduced-motion: reduce` disables card lifts, dashboard transitions, landing card motion, the decorative hero float, chip transitions, and related interactive movement.

## Final premium-polish files modified

- `src/styles/variables.css`
- `src/styles/global.css`
- `src/styles/components.css`
- `src/styles/layout.css`
- `src/styles/landing.css`
- `src/styles/dashboard.css`
- `src/styles/create.css`
- `src/components/ui/Card.jsx`
- `src/components/ui/Button.jsx`
- `src/components/ui/GeneratingScreen.jsx`
- `src/components/layout/AppLayout.jsx`
- `src/pages/Landing.jsx`
- `src/pages/app/Dashboard.jsx`
- `src/pages/app/CreateContent.jsx`
- `src/pages/app/ContentResult.jsx`
- `src/pages/app/Library.jsx`
- `src/pages/app/Analytics.jsx`
- `walkthrough.md`

The local Amiri font files and OFL license remain present and unchanged. No package dependency or heavy animation library was added.

## Verification status

- Source inspection confirms that this pass changes presentation, semantic interaction affordances, and the non-functional Analytics placeholder only; it does not alter credits, generation, variations, persistence, downloads, authentication, or user-data services.
- Source inspection confirms the canonical Mulled Berry `#73465F` and Petal Beige `#EBCBC1` tokens remain in place, and all four local Amiri font faces remain declared.
- Responsive CSS covers desktop, 1366×768-class short-height desktop, tablet, and 360px-class mobile widths without introducing a page-level horizontal scroller.
- Final `npm run build`: **1,846 modules transformed, zero errors, and zero meaningful warnings**. The production output contains all four local Amiri font files.
- `package.json` retains only React, React DOM, React Router, Lucide, Vite, and the React Vite plugin; no animation or temporary browser-testing dependency was added.

Browser-only visual inspection, console inspection, screenshots, hover/focus appearance, and viewport-by-viewport acceptance are not claimed in this report because the required in-app browser surface was unavailable in this session. Those items remain the only visual-approval limitations; they do not prevent source or production-build verification.

---

# Phase 5A — Frontend Foundation Cleanup

Phase 5A prepares the existing frontend prototype for a later backend boundary. It does not start Phase 5B and does not add a backend, real authentication, real generation provider, payments, analytics processing, administration, or deployment infrastructure. The approved Amiri typography, Mulled Berry/Petal Beige identity, and Aurora Edge system remain unchanged.

## Preflight baseline

- Repository root: `F:\Hawaz_FinX_NEWWWWWW`.
- No applicable `AGENTS.md` file was present in the repository or its parent path.
- `git status --short` was attempted before edits, but Git is not installed or available in this environment's PATH. No commit, push, reset, or destructive repository operation was performed.
- The pre-change `npm run build` completed with 1,846 modules transformed, zero errors, and zero warnings.
- The original storage layout used `finx-auth`, global language/theme preferences, user-prefixed data keys, and one unsafe global `finx-onboarding-draft`. Registration also called the destructive FinX-wide `clearAll()` method, and email login used the fixed `user-1` identity.

## Mock authentication and storage isolation

- Added a clearly labeled mock-only authentication repository. The login and registration UI explicitly states that this is prototype access and not production security.
- Email addresses are trimmed and lowercased. A deterministic local mock ID is derived from the normalized email, so the same email resolves to the same identity and different emails receive different user scopes.
- The fixed `user-1` login identity and timestamp-based Google identity were removed. The same Google demo account now returns the same mock identity on every login.
- Registration no longer clears any FinX data. Password parameters are never persisted, added to the mock user registry, or placed in localStorage.
- Mock user records preserve name, normalized email, onboarding status, plan, avatar, and original creation date.
- The current session remains in `finx-auth`; the mock identity registry uses `finx-mock-users`. Per-user data remains under `finx-{mockUserId}-{dataKey}`.
- A narrow compatibility migration converts the current legacy session to its stable email-derived identity and copies legacy user-scoped keys only when the new destination key is absent. Source keys are retained, so migration is non-destructive.
- The ambiguous old global onboarding draft is intentionally not migrated because it cannot be assigned safely to a specific user. New drafts use the current user's `finx-{mockUserId}-onboarding-draft` key.
- Malformed JSON and malformed stored arrays now fall back safely instead of crashing array operations.

## Routing and onboarding

- Guests are redirected from `/app`, `/app/*`, and `/onboarding` to `/login` with the originally requested location retained.
- Authenticated users who are not onboarded are redirected from every `/app` route, including unknown `/app/*` routes, to `/onboarding`.
- Onboarded users visiting normal `/onboarding` are redirected to `/app`; `/onboarding?restart=true` remains available for brand editing.
- Login and completed onboarding return the user to the original protected `/app` destination when appropriate, without redirect loops.
- Added translated public and protected 404 handling.
- Onboarding now uses `ThemeContext` rather than a separate document-theme state. Language continues through `LanguageContext`.
- Restart editing prefills the existing user-scoped profile and updates that profile while preserving its creation date.
- Final completion revalidates all required fields, URL/username syntax, and six-digit hex colors before saving.

## Temporary file previews

- Onboarding drafts persist text and other safe serializable fields only. Uploaded files and `blob:` preview URLs are never persisted.
- Logo, product-image, and advertising preview object URLs are revoked when replaced, removed, or unmounted.
- Uploads validate JPEG/PNG/WebP/GIF MIME type and a 2 MB maximum. Product images remain limited to five.
- Native color inputs receive only valid six-digit hex values; invalid text remains visible with a translated field error rather than breaking the color input.
- Persisted brand assets accept only durable HTTP(S) URLs. Legacy `blob:` or data URLs are sanitized away, preventing broken images after refresh.
- Permanent asset/object storage is intentionally deferred to Phase 5D. Base64, IndexedDB, and a fake upload backend were not added.

## Validation, interactions, generation, and credits

- The shared `Input` now forwards `required` to the real input, textarea, or select while preserving Required/Optional labels and ARIA error wiring.
- Added explicit translated, field-level validation for every required Social Post, Advertising Design, Content Ideas, and Campaign field. Text is trimmed before generation, invalid campaign dates are rejected, and the first invalid control is focused where practical.
- A synchronous request lock prevents rapid double submission before React state updates.
- The shared `Button` renders an anchor when `href` is supplied and defaults ordinary buttons to `type="button"`, preventing accidental form submission.
- Landing “How It Works” now uses a real anchor. All dead `href="#"` interactions were removed. Forgot Password, Terms, and Privacy show translated unavailable/prototype messaging rather than pretending to be complete.
- Settings Upgrade opens the existing pricing section. Advertising Design now supports Copy All.
- Library removal is translated and confirmed as “Remove from Library”; it unsets `saved` without destroying the original result.
- Mock generation now stores sanitized submitted parameters and reflects tool inputs in generated content/metadata, including social description/platform/goal/tone/CTA/language, manual idea audience, campaign objective/product/platform/tone/date, and advertising offer/headline/CTA/size/logo/color choices.
- Fabricated estimated reach was removed. Arabic variations now use Arabic alternative labels rather than English `[Variation]` or `[Alt]` prefixes.
- Social variation tone and length controls affect the generated mock variation rather than remaining decorative.
- A dedicated frontend-only generation/credit coordinator checks affordability, generates, deducts once only after success, and removes a just-created result if an unexpected deduction race fails. Controlled failures store no result/activity and deduct nothing.
- Credit changes dispatch a scoped UI event so the current layout updates immediately. Each user's balance remains isolated.

## Result and persistence consistency

- Edits persist using the current complete content object rather than a stale state closure.
- Save to Library records the latest edited content before setting the saved state.
- Variations deep-clone the original, receive a new ID and `originalId`, and start unsaved.
- Recent Activity is filtered against currently existing valid results.
- Missing, corrupted, or malformed results fail gracefully.
- Advertising SVG download continues XML-escaping text and attributes and uses current text, colors, size/aspect ratio, and logo visibility. Temporary product previews are deliberately not claimed or embedded as durable downloaded assets.

## Quality baseline and tests

Added ESLint 9, React ESLint rules, React Hooks rules, Vitest, jsdom, and React Testing Library with these scripts:

- `npm run lint`
- `npm test`
- `npm run test:run`

Regression tests cover:

- Registration preserving unrelated FinX data.
- Stable email and Google mock identities.
- Isolation between mock users.
- User-scoped onboarding draft keys.
- Protected and onboarding route decisions.
- Required Create Content validation and date validation.
- Controlled generation failure with zero deduction and no persisted result/activity.
- Successful generation with exactly one deduction.
- Variation immutability, new ID, unsaved state, and one deduction.
- Arabic/English translation structure parity.
- Link-enabled Button behavior and safe default button type.

## Exact verification results

- `npm install`: completed; 382 packages audited, zero vulnerabilities. npm emitted one environment policy notice that the `esbuild` install script is not covered by npm `allowScripts`; no application dependency or build failure resulted.
- `npm run lint`: completed with zero errors and zero warnings.
- `npm run test:run`: 6 test files passed, 15 tests passed, zero failures.
- `npm run build`: 1,852 modules transformed, zero errors, and zero warnings. All four local Amiri TTF assets were emitted.
- Required source audit: zero `clearAll()` calls, zero fixed `user-1` identities, zero dead `href="#"`, zero persisted-blob patterns, zero remote font imports, zero Playwright source/dependency entries, zero backend/Gemini/payment code or dependencies, and zero project `server`, `backend`, or `api` directories.
- Root temporary-file audit found none of the previous Playwright/download verification scripts.

## Browser verification status

The required in-app browser surface exposed no available browser in this session. Therefore the User A/User B end-to-end sequence, live route redirects, refresh behavior, theme/language interaction, Landing/Upgrade/Copy/Library interaction checks, and browser-console inspection are not claimed as manually verified here. Automated regression coverage and the production build passed, but browser acceptance remains a documented limitation.

## Phase 5A files changed

- `package.json`
- `package-lock.json`
- `vite.config.js`
- `eslint.config.js`
- `src/router.jsx`
- `src/context/AuthContext.jsx`
- `src/services/mockAuth.js`
- `src/services/mockStorage.js`
- `src/services/mockBrand.js`
- `src/services/mockCredits.js`
- `src/services/mockGeneration.js`
- `src/services/mockGenerationFlow.js`
- `src/utils/routeGuards.js`
- `src/utils/createValidation.js`
- `src/components/layout/ProtectedRoute.jsx`
- `src/components/layout/OnboardingRoute.jsx`
- `src/components/layout/AppLayout.jsx`
- `src/components/layout/PublicLayout.jsx`
- `src/components/ui/Button.jsx`
- `src/components/ui/Input.jsx`
- `src/pages/NotFound.jsx`
- `src/pages/Landing.jsx`
- `src/pages/Login.jsx`
- `src/pages/Register.jsx`
- `src/pages/Onboarding.jsx`
- `src/pages/app/CreateContent.jsx`
- `src/pages/app/ContentResult.jsx`
- `src/pages/app/Library.jsx`
- `src/pages/app/Settings.jsx`
- `src/i18n/ar.js`
- `src/i18n/en.js`
- `src/styles/auth.css`
- `src/styles/landing.css`
- `src/test/setup.js`
- `src/test/mockAuth.test.js`
- `src/test/routeGuards.test.js`
- `src/test/createValidation.test.js`
- `src/test/generationFlow.test.js`
- `src/test/translations.test.js`
- `src/test/Button.test.jsx`
- `walkthrough.md`

## Explicitly deferred

- Real Node.js backend.
- MySQL and Prisma.
- Firebase Authentication.
- Permanent file/object storage.
- Gemini text generation.
- Gemini image generation.
- Transactional server-side credits.
- Payments and subscriptions.
- Analytics screenshot analysis.
- Admin Dashboard.
- Deployment and production infrastructure.

Phase 5B has not started.

---

# Phase 5B — Backend and MySQL Foundation

## Status

**Phase 5B is officially approved.** The architecture, real MySQL migration, twice-run idempotent seed, database integration suite, real HTTP API smoke sequence, security middleware, OpenAPI contract, cleanup proof, and complete frontend/backend verification all passed against local MySQL 8.0.46.

Phase 5C and every later integration remain unstarted. The React frontend is still fully isolated from this backend and continues using the approved Phase 5A mock services.

## Mandatory preflight

- Repository root: `F:\Hawaz_FinX_NEWWWWWW`.
- No applicable `AGENTS.md` was found.
- `git status --short` could not run because Git is not installed/available in `PATH`; no commit, reset, checkout, or push was performed.
- Runtime: Node.js `v24.18.0`; npm `11.16.0`.
- Docker/Docker Compose: unavailable and not required for the final verification.
- Local `MySQL80` service: running on `127.0.0.1:3306`, server version 8.0.46.
- Confirmed dedicated targets: `finx_dev` and `finx_shadow`, accessed by the separate `finx_app` account rather than root.
- A local ignored `backend/.env` was created for verification. Its credentials are not included in this report.
- Pre-change frontend `npm run lint`: passed with zero errors/warnings.
- Pre-change frontend `npm run test:run`: 6 files, 15 tests passed.
- Pre-change frontend `npm run build`: 1,852 modules transformed, zero errors/warnings, with all four local Amiri font files emitted.
- Root `package.json`, `.gitignore`, router, authentication context, every `src/services` file, and the Phase 5A walkthrough were inspected before Phase 5B edits.

## Architecture created

- A dedicated `backend/` package uses Node.js 24, Express 5.2.1, JavaScript ESM, Prisma 7.9.1, the current `@prisma/adapter-mariadb` driver adapter, MySQL, Zod 4, Pino, Vitest, and Supertest.
- `src/app.js` builds the Express application without listening; `src/server.js` owns the network listener, signals, disconnect, and graceful shutdown.
- Environment, database, logging, middleware, schemas, controllers, services, repositories, and routes are separated.
- Prisma uses one application client and a bounded connection pool. The generated client is ignored and recreated by backend post-install or `db:generate`.
- Controllers do not access Prisma. Ownership constraints are included in repository queries, not applied after retrieval.
- Root orchestration scripts preserve frontend commands and add source verification, MySQL integration, live API smoke, seed-cleanliness, migration-status, and complete `verify` workflows.

## Database schema

The MySQL-only Prisma schema defines:

- `User`: normalized unique email storage, nullable unique future external-auth subject, name, USER/ADMIN role, ACTIVE/SUSPENDED status, free plan default, onboarding state, locale/timezone, and soft deletion; no password or token fields.
- `Brand`: owner, business/profile/audience/product fields, `Decimal(12,3)` price, JOD default currency, website/username, normalized six-digit colors, timestamps, soft deletion, and ownership/pagination indexes.
- `Asset`: metadata only for LOGO, PRODUCT_IMAGE, GENERATED_IMAGE, and ANALYTICS_SCREENSHOT, including storage key, optional URL/brand/dimensions, MIME type, byte size, state, and soft deletion. No upload endpoint exists.
- `CreditWallet`: unique user, integer balance, optimistic version, and timestamps.
- `CreditLedger`: integer amount/balance, CREDIT/DEBIT direction, reservation/settlement/refund-capable transaction enum, scoped unique idempotency key, optional references/metadata, and history indexes.
- `GenerationJob`: owner/brand, supported tool and job-status enums, sanitized input JSON, model/request identifiers, integer credit cost, idempotency, safe error fields, and lifecycle timestamps. No provider or worker is implemented.
- `GeneratedContent`: explicit generation job, language/platform, structured output and submitted-parameter JSON, optional original-content self-relation for immutable variations, saved state, ownership indexes, and soft deletion.

UUID-style string identifiers, foreign keys, UTC-capable timestamps, uniqueness rules, ownership/pagination indexes, integer credits, Decimal money, and MySQL `utf8mb4` requirements are documented. SQLite is not used.

## Migration and seed status

- Safe pre-migration inspection confirmed database `finx_dev`, MySQL 8.0.46, `utf8mb4`, `utf8mb4_0900_ai_ci`, and zero existing tables.
- Prisma 7.9.1 generated and applied `20260814185523_init_phase_5b` using `prisma migrate dev`; `db push` and reset were not used.
- Generated SQL was inspected: seven application tables, `_prisma_migrations`, UUID string keys, Decimal(12,3), integer credits, enums, uniqueness, indexes, and all required foreign keys are present.
- `prisma migrate status`: one migration found; database schema up to date; no pending migrations.
- Seed run 1: exit 0. Seed run 2: exit 0.
- Direct post-seed proof: 2 expected users, 2 wallets, 2 initial ledger entries, balances `[100,100]`, and one `development-initial-grant-v1` entry per wallet.
- Final cleanup proof after integration and API testing: zero transient records.

## API implemented

Base path: `/api/v1`.

- Public system: `GET /health/live`, `GET /health/ready`, `GET /version`.
- Protected current user: `GET /me`.
- Brands: `GET /brands`, `POST /brands`, `GET /brands/:brandId`, `PATCH /brands/:brandId`, `DELETE /brands/:brandId`.
- Read-only credits: `GET /credits`, `GET /credits/ledger`.
- Read-only generated content: `GET /contents`, `GET /contents/:contentId`.

Collections use page/limit pagination and stable repository ordering. Brand mutations use strict Zod payloads, Decimal-compatible price validation, currency/URL/username/color validation and normalization, and mass-assignment rejection. Brand deletion is soft deletion. Contents support tool/platform/saved filters. There are no public credit mutations, content creation, generation, upload, payment, or admin endpoints.

## Development authentication and security

- `x-finx-dev-user-id` is isolated behind both non-production mode and `ALLOW_DEV_AUTH=true`; its default and `.env.example` value are `false`.
- Production configuration rejects `ALLOW_DEV_AUTH=true`. The middleware loads the UUID from the user repository and never accepts arbitrary email or role headers.
- Missing, unknown, suspended, and deleted users are rejected; returned user data excludes the external-auth subject and deleted/internal fields.
- Helmet, explicit CORS allowlist, JSON and URL-encoded limits, configurable rate limit, request IDs, disabled `x-powered-by`, controlled trust proxy, Pino structured logging/redaction, JSON 404s, safe centralized errors, malformed JSON handling, conflict mapping, startup validation, and graceful shutdown are present.
- Logs include request ID, method, path, status, duration, and authenticated user ID without bodies, authorization, cookies, passwords, tokens, secrets, or full database URLs.
- The OpenAPI 3.1 contract documents only implemented endpoints and strongly marks the development header as non-production.

## Tests added

Five backend suites contain 32 API/security tests covering:

- Liveness independent of DB; ready/unready readiness; JSON 404; request ID; malformed JSON; deterministic rate limiting.
- Production dev-auth rejection; disabled/missing auth; suspended/deleted users; safe secret-free internal errors.
- Brand create/normalization; invalid colors/prices/unknown fields; pagination; soft-delete exclusion; cross-user read/update/delete prevention.
- Per-user wallet/ledger isolation; ledger pagination; absence of public balance mutation.
- Per-user content isolation; saved filtering; soft-delete exclusion; variation linkage without original mutation.

These 32 tests remain isolated unit/API tests using injected repositories. A separate six-test real MySQL suite now verifies seed state, UUIDs, foreign keys, unique constraints, Decimal/JOD, integer columns, ownership, pagination, soft deletion, idempotency, Arabic, emoji, variation relations, and rollback with safe fixed-ID cleanup. A real HTTP smoke runner starts Express, uses MySQL and seeded development authentication, verifies 28 status outcomes, and removes its fixtures in `finally`.

## Exact final verification

- Root `npm install`: up to date; 382 packages audited; zero vulnerabilities. npm emitted only its environment `allowScripts` notice for esbuild.
- Backend final `npm install`: 366 packages audited; post-install generated Prisma Client; zero vulnerabilities. npm emitted only `allowScripts` notices for Prisma engines/CLI.
- Root `npm audit`: zero vulnerabilities.
- Backend `npm audit`: zero vulnerabilities.
- Final `npm run verify`: exited 0 in 24.0 seconds and included source plus real database verification.
- Frontend lint: zero errors and zero warnings.
- Frontend tests: 6 files, 15/15 tests passed.
- Frontend build: Vite 8.2.1, 1,852 modules transformed, completed in 569 ms with zero errors and zero meaningful warnings; all four Amiri fonts emitted.
- Prisma schema validation: passed.
- Prisma Client generation: passed with Prisma 7.9.1.
- Backend lint: zero errors and zero warnings.
- Backend tests: 5 files, 32/32 tests passed.
- MySQL integration tests: 1 file, 6/6 tests passed in 704 ms.
- OpenAPI validation: passed using `@apidevtools/swagger-parser` 12.1.0.
- Real MySQL migration: `20260814185523_init_phase_5b` created and applied successfully; exit 0.
- Seed twice: both runs exited 0 with no duplication.
- Database-backed HTTP API smoke: passed 28 status checks; MySQL readiness returned 200/connected; fixtures were removed.
- Final seed/cleanup verification: 2 users, 2 wallets, 2 ledger entries, balances `[100,100]`, zero transient records.

## Source audit

- A real local `backend/.env` exists for development verification and is covered by `.env`/`.env.*` ignore rules; `.env.example` contains placeholders only. Git was unavailable, so `git status --short` could not be run.
- No real database credentials, Firebase, Gemini, payment SDK, SQLite, destructive reset command, unrestricted production CORS, enabled-by-default dev auth, or TypeScript application source was added.
- The sole hand-authored TypeScript file is the Prisma-required tooling file `backend/prisma.config.ts`; Prisma's ignored generated client is also TypeScript. All application and test source remains JavaScript ESM.
- No frontend component, route, service, style, color, typography, Amiri asset, or visual behavior changed. Existing frontend remote-font markup was not modified.

## Files created or changed

Root:

- `.gitignore`
- `package.json`
- `package-lock.json`
- `walkthrough.md`

Backend package and documentation:

- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env.example`
- `backend/README.md`
- `backend/openapi.yaml`
- `backend/eslint.config.js`
- `backend/vitest.config.js`
- `backend/prisma.config.ts`
- `backend/scripts/api-smoke.js`
- `backend/scripts/check-database.js`
- `backend/scripts/run-mysql-tests.js`
- `backend/scripts/verify-seed.js`
- `backend/scripts/validate-openapi.js`

Prisma:

- `backend/prisma/schema.prisma`
- `backend/prisma/seed.js`
- `backend/prisma/migrations/.gitkeep`
- `backend/prisma/migrations/20260814185523_init_phase_5b/migration.sql`

Application source:

- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/config/env.js`
- `backend/src/common/errors.js`
- `backend/src/common/pagination.js`
- `backend/src/infrastructure/database.js`
- `backend/src/infrastructure/logger.js`
- `backend/src/middleware/dev-auth.js`
- `backend/src/middleware/error-handler.js`
- `backend/src/middleware/request-id.js`
- `backend/src/middleware/request-logging.js`
- `backend/src/middleware/validate.js`
- `backend/src/schemas/brand-schema.js`
- `backend/src/schemas/common.js`
- `backend/src/schemas/content-schema.js`
- `backend/src/schemas/credit-schema.js`
- `backend/src/repositories/brand-repository.js`
- `backend/src/repositories/content-repository.js`
- `backend/src/repositories/credit-repository.js`
- `backend/src/repositories/user-repository.js`
- `backend/src/repositories/index.js`
- `backend/src/services/brand-service.js`
- `backend/src/services/content-service.js`
- `backend/src/services/credit-service.js`
- `backend/src/services/user-service.js`
- `backend/src/services/index.js`
- `backend/src/controllers/brand-controller.js`
- `backend/src/controllers/content-controller.js`
- `backend/src/controllers/credit-controller.js`
- `backend/src/controllers/health-controller.js`
- `backend/src/controllers/user-controller.js`
- `backend/src/routes/health-routes.js`
- `backend/src/routes/protected-routes.js`

Tests:

- `backend/tests/helpers/test-app.js`
- `backend/tests/system.test.js`
- `backend/tests/security.test.js`
- `backend/tests/brands.test.js`
- `backend/tests/credits.test.js`
- `backend/tests/contents.test.js`
- `backend/tests/mysql.integration.test.js`

## Deferred work

There is no remaining Phase 5B acceptance blocker. The local environment and ignored credentials remain development-only and are not production deployment configuration.

Firebase Authentication and frontend session integration (5C), permanent object storage/uploads (5D), Gemini and job processing (5E), transactional credit reservation/settlement/refund (5F), payments/subscriptions (5H), analytics processing (5I), Admin Dashboard (5J), and production deployment remain explicitly deferred and were not started.

---

# Phase 5C — Firebase Authentication Source Completion

Phase 5C is source-complete and awaiting real Firebase manual acceptance. It is not marked approved by this report. Phase 5D, Storage, Gemini, payments, and all later phases were not started.

## Implemented authentication flow

- Replaced the frontend mock-auth session with the modular Firebase Web SDK (`firebase` 12.17.1).
- Added Email/Password registration and login, Google popup login, logout, password reset, profile display-name update, email verification, resend cooldown, and Firebase local persistence.
- Added `/forgot-password` and `/verify-email`, safe translated Firebase errors, masked verification email, backend retry, loading guards, and preservation of the originally requested `/app` destination.
- `AuthContext` now treats `onAuthStateChanged` as the Firebase source of truth and separately exposes `firebaseUser`, `appUser`, and the compatibility `user` used by existing Phase 1–4 screens.
- Verified users exchange their ID token only in memory with `POST /api/v1/auth/session`. The API client uses `VITE_API_BASE_URL`, a timeout, normalized errors, and exactly one forced-token-refresh retry after a 401.
- Passwords and tokens are never placed in local/session storage or logs. Logout signs out of Firebase and clears only in-memory session state; it does not delete user content.
- Temporary content/brand/generation data remains in the approved mock services, scoped by the MySQL `appUser.id`. Authentication no longer uses an email, `user-1`, or a mock-derived identity as the active storage scope. Existing prototype data is copied once from its deterministic legacy scope without deleting the original.

## Backend trust boundary and provisioning

- Added `firebase-admin` 14.2.0 using Application Default Credentials and a central injectable token verifier.
- Bearer parsing and token verification are isolated middleware. Missing, malformed, expired/invalid tokens return safe 401 responses. No request body can set UID, email, role, credits, or application user ID.
- `POST /api/v1/auth/session` always requires a real Firebase bearer token, even when development auth is enabled.
- Unverified Email/Password users are rejected before MySQL provisioning. Google identities are accepted only when the verified Firebase token says the email is verified.
- Provisioning normalizes email and creates User, CreditWallet, and one 100-credit `INITIAL_GRANT` ledger entry in one transaction. Unique `firebaseUid`, unique email, and ledger idempotency protect retries and concurrent requests.
- Existing email conflicts return a safe 409 and are not auto-linked. Safe token profile fields may refresh name, verification state, picture, and last login; role and credits remain server-controlled.
- `GET /me` supports Firebase after session synchronization and the explicitly enabled non-production dev adapter. Production rejects dev auth and requires `FIREBASE_PROJECT_ID`.
- Revocation checks are intentionally not performed remotely on every Phase 5C request. Signature, issuer, audience, and expiry are verified; the client performs one forced refresh after a 401.

## Database migration

- Applied `backend/prisma/migrations/20260815003000_add_firebase_auth/migration.sql`.
- Preserved the existing external identity column by renaming it to unique nullable `firebaseUid`.
- Added `emailVerified`, `photoUrl`, and `lastLoginAt` without adding any password hash.
- `prisma migrate status` reports both migrations applied and the schema current.

## Automated verification

- Root and backend installs completed with the latest compatible official Firebase packages.
- A security override pins transitive `uuid` to 11.1.1, the patched compatible release; both full npm audits report zero vulnerabilities.
- Frontend lint passed with zero errors/warnings.
- Frontend tests: 8 files, 19/19 passed. Coverage includes AuthContext initialization/session sync, Email login failure, registration, Google success/cancellation, verification gating, route/loading decisions, requested destination, one 401 retry, token/password non-persistence, and MySQL-ID mock-storage isolation.
- Frontend production build: Vite 8.2.1, 1,869 modules transformed, zero errors, and zero meaningful warnings.
- Backend lint passed with zero errors/warnings.
- Backend isolated tests: 6 files, 41/41 passed. Coverage includes bearer parsing/verification, unverified rejection, verified Email/Google acceptance, body identity rejection, idempotent/concurrent provisioning, safe email conflict, `/me`, and development/production auth rules.
- MySQL integration tests: 1 file, 8/8 passed. They verify unique Firebase UID, normalized email, Arabic/emoji names, one transactional user/wallet/ledger grant, concurrency/idempotency, rollback, existing ownership controls, and the Phase 5B seed.
- Seed ran twice without duplication. Final seed verification remains exactly 2 development users, 2 wallets, 2 initial ledger entries, balances `[100,100]`, and zero transient records.
- Prisma validate/generate, migration status, OpenAPI validation, and the existing real database-backed HTTP smoke sequence all passed.
- Final `npm run verify` exited 0. Root and backend `npm audit` both report zero vulnerabilities.

## Configuration and secret safety

- Root `.env.local` contains all six required Firebase Web variable names and remains ignored.
- Root `.env.example` and `backend/.env.example` contain placeholders only; no Analytics `measurementId` was added.
- Local ignored `backend/.env` contains the Firebase project/ADC variable names; its contents were never printed.
- No `.env`, service-account JSON, token, password, private key, connection string, dependency directory, build output, or coverage output is tracked.
- The expected external ADC file `F:/FinX_Secrets/firebase-admin.json` was not present during final verification. Automated tests use injected offline token verifiers and never call live Firebase.

## Manual acceptance still required

The in-app browser surface was unavailable, so the following are explicitly not claimed:

1. Register a new Email/Password account.
2. Confirm redirect to the verification page and masked email.
3. Confirm delivery of the verification email.
4. Confirm resend and the 60-second UI cooldown.
5. Open the Firebase action link.
6. Press “I verified my email” and complete session synchronization.
7. Confirm MySQL creates exactly one user, one wallet, and one 100-credit grant.
8. Log out and back in with Email/Password.
9. Request password reset and confirm the generic response/email.
10. Complete Google login.
11. Cancel the Google popup and confirm the safe message.
12. Refresh and confirm the session persists without route flicker.
13. Confirm private-route return destination.
14. Complete onboarding and confirm its redirect/persistence.
15. Confirm a second user cannot see the first user's mock content.
16. Confirm zero browser-console errors.
17. Confirm tokens appear in neither logs nor responses.
18. Repeat session synchronization and confirm no duplicate user, wallet, ledger grant, or credits.

## Phase boundary

Phase 5C and Phase 5D are source-complete with automated verifications passing. Firebase Storage, object uploads, asset repository, safe BigInt handling, orphan cleanup, multi-layer upload validation, and frontend asset integration are fully implemented in Phase 5D. Gemini, background generation jobs (5E), transactional credit reservation/settlement/refund (5F), and payment integration (5H) were not started.

---

# Phase 5D — Cloud Storage Source Completion

Phase 5D is source-complete with all automated pipelines (frontend lint, backend lint, frontend tests, backend unit/contract tests, real MySQL integration, OpenAPI validation, database smoke, seed verification, and full `npm run verify`) passing.

## Architecture and Design

- **Real Persistent Storage**: Replaced transient browser blob URLs (`blob:...`) with persistent storage URLs generated via Firebase Storage and persisted to MySQL via Prisma.
- **Dynamic Configurable Limit**: Configured `MAX_UPLOAD_SIZE_MB` (default: 25 MB) via environment variables without hardcoding. Governs backend Multer memory storage limits, payload limits, and frontend validation (`VITE_MAX_UPLOAD_SIZE_MB=25`).
- **Storage Path Structure**:
  - Brand Logo: `users/{userId}/brands/{brandId}/logo/{uuid}.{ext}`
  - Brand Product Images: `users/{userId}/brands/{brandId}/products/{uuid}.{ext}`
  - General Assets: `users/{userId}/assets/{assetType}/{uuid}.{ext}`
- **Multi-layer Security & Validation**:
  - File presence check (`multipart/form-data` with field name `file`).
  - Size check enforced dynamically by Multer based on `MAX_UPLOAD_SIZE_MB`.
  - Extension and MIME type verification against approved list: JPEG (`image/jpeg`), PNG (`image/png`), WebP (`image/webp`), GIF (`image/gif`), SVG (`image/svg+xml`).
  - Magic byte verification: Magic number validation inspecting file header buffers for PNG, JPEG, GIF, WebP, and SVG to prevent spoofed file extensions.
  - Authentication and Authorization: Authenticated user context required; ownership of brand verified before associating asset with a brand.
- **Orphan & Cleanup Strategy**:
  - If storage upload succeeds but MySQL `Asset.create()` fails, the uploaded storage object is immediately deleted in a cleanup block.
  - When replacing a brand logo, the new logo is uploaded and persisted first; the old logo storage object is deleted only after successful persistence.
- **BigInt Serialization**:
  - Prisma maps `byteSize` to JavaScript `BigInt`. The asset service explicitly serializes `byteSize` to standard JSON `Number` (`Number(asset.byteSize)`) to prevent `TypeError: Do not know how to serialize a BigInt`.
- **Offline / Test Isolation**:
  - `MemoryStorageProvider` provides fast in-memory storage buffer mocking for unit and integration tests without network dependencies or cloud credentials.
  - `FirebaseStorageProvider` integrates with `firebase-admin/storage` using bucket name from `FIREBASE_STORAGE_BUCKET` or default bucket credentials.

## Summary of Changes

1. **Backend Infrastructure**:
   - `backend/package.json`: Added `multer` 2.3.0.
   - `backend/src/config/env.js`: Added `FIREBASE_STORAGE_BUCKET` and `MAX_UPLOAD_SIZE_MB` with fallback to 25.
   - `backend/src/infrastructure/firebase-admin.js`: Added `getOrCreateAdminApp` supporting `storageBucket`.
   - `backend/src/infrastructure/storage.js`: Implemented `FirebaseStorageProvider` and `MemoryStorageProvider`.
   - `backend/src/middleware/upload.js`: Created Multer middleware with magic byte inspection and custom error mappings.
2. **Backend Repositories, Services, and Controllers**:
   - `backend/src/schemas/asset-schema.js`: Zod schemas for file upload body, query pagination, and path params.
   - `backend/src/repositories/asset-repository.js`: CRUD methods for `Asset` model in Prisma.
   - `backend/src/repositories/index.js`: Registered `assetRepository`.
   - `backend/src/services/asset-service.js`: Upload orchestration, brand verification, logo replacement, and safe deletion.
   - `backend/src/services/index.js`: Registered `assetService`.
   - `backend/src/controllers/asset-controller.js`: Handlers for `upload`, `get`, `list`, `remove`.
   - `backend/src/routes/protected-routes.js`: Mounted `/assets` routes.
   - `backend/src/app.js`: Injected storage provider and upload middleware into app factory.
   - `backend/openapi.yaml`: Documented all Asset endpoints, parameters, request bodies, and responses.
3. **Frontend Integration**:
   - `src/constants/uploadConfig.js`: Centralized `MAX_UPLOAD_SIZE_MB`, `MAX_IMAGE_SIZE`, and `ALLOWED_IMAGE_TYPES`.
   - `src/services/assetApi.js`: API client for uploading, retrieving, listing, and deleting assets with token refresh support.
   - `src/pages/Onboarding.jsx`: Switched brand logo and reference image uploads to real backend asset API with loading indicators and remote cleanup.
   - `src/pages/app/CreateContent.jsx`: Switched Ad Design product image uploads to real asset API with upload spinner and remote cleanup.
4. **Environment Templates**:
   - `backend/.env.example`: Added `FIREBASE_STORAGE_BUCKET` and `MAX_UPLOAD_SIZE_MB`.
   - `.env.example`: Added `VITE_MAX_UPLOAD_SIZE_MB`.

## Automated Verification Results

- **Frontend Lint**: `npm run lint` → 0 errors, 0 warnings.
- **Frontend Unit Tests**: `npm run test:run` → 9 test files, 29/29 passed (including `src/test/assetApi.test.js`).
- **Frontend Production Build**: `npm run build` → 1,871 modules transformed, 0 errors.
- **Backend Lint**: `npm run lint:backend` → 0 errors, 0 warnings.
- **Backend Unit Tests**: `npm run test:backend:run` → 7 test files, 58/58 passed (including `backend/tests/assets.test.js`).
- **OpenAPI Validation**: `npm run backend:openapi` → Spec is valid.
- **Real MySQL Integration Tests**: `npm run test:mysql` → 1 file, 9/9 passed (including `Asset` model verification).
- **HTTP Smoke Tests**: `npm run smoke:backend` → 28 status checks passed.
- **Database Seed Verification**: `npm run db:verify-seed` → 2 users, 2 wallets, 2 ledger entries, 0 transient records.
- **Full Verification**: `npm run verify` exited with code 0.

