# As I Am hosting

Updated on 3 September 2026. The static build has been uploaded and root password
protection is active. Following the user's explicit acceptance of the Let's
Encrypt terms, HTTPS and HTTP-to-HTTPS redirection are active. Authenticated live
route tests and the complete synthetic evening flow passed.

| Item | Configuration |
| --- | --- |
| Provider | Existing Netcup shared webhosting |
| URL | `https://asiam.wernerverse.de/` |
| Plesk domain | `asiam.wernerverse.de`, domain ID `4007` |
| Document root | Dedicated `asiam.wernerverse.de/httpdocs`, relative to the subscription webspace; configured in Plesk |
| Runtime | Static HTML, JavaScript, CSS and locally hosted assets; PHP disabled for this subdomain only; no server-side Node.js/PHP/database needed |
| Build | Node.js 22+, `npm ci`, `npm run build` |
| Upload package | `node tools/package-netcup.mjs`, output in ignored `output/netcup/` |
| Entry points | `/`, `/personal`, `/guided`, `/cinema`, `/restaurant`; Apache SPA fallback serves `index.html` |
| Authentication | Plesk protected document root, protected-directory ID `4354`; user `jury` exists; credentials are outside all repositories and build files |
| TLS | Trusted Let's Encrypt certificate for `asiam.wernerverse.de`, valid until 2 December 2026 19:07:23 UTC; HTTP redirects to the same HTTPS path with status 301 |
| WebMCP | All app routes on this single HTTPS origin; leave `VITE_AGENT_ORIGIN`, `VITE_CINEMA_URL` and `VITE_RESTAURANT_URL` unset |

## Deployment

The deployed archive is `as-i-am-netcup-88715bf.zip`, built from commit
`88715bfe300262b111960aa479f54a0dc245d2a5` (application source based on
`4c69b73e8e77981665af7701babea265024442c1`). SHA-256:
`ac46b47a7e2ff9448e930830e641f1f2b8783405ddd88dbab5eb3e1a88fdb461`.
Its 38 runtime files were extracted into the document root; the uploaded ZIP was
moved to Plesk trash afterwards. The following is the repeatable deployment procedure.

Build and package from the intended release commit. Upload the **contents** of
the archive into the dedicated document root, with `index.html`, `.htaccess`,
`assets/` and `art/` directly inside it. Source maps are excluded from the runtime
archive. The package manifest and checksum remain local, outside the document root.

The included `.htaccess` provides SPA fallback, `Origin-Agent-Cluster: ?1`,
`X-Content-Type-Options: nosniff`, same-origin framing and a restrictive referrer
policy. HTML revalidates; fingerprinted assets use long-lived **private** caching
because the demo is authenticated. It does not change authentication settings,
certificate handling, mail records or other sites. Plesk's nginx direct static
serving may bypass these Apache directives: check live headers and password
protection for both HTML and an actual asset, and configure equivalent behavior
or disable direct static serving for this subdomain if required.

For this deployed subdomain, Plesk's smart static-file processing was disabled
after live checks found missing headers on `/` and real assets. Apache now
applies the expected headers to the root page, SPA routes and static assets.
Custom MIME mappings were entered in Plesk for WebP, WOFF and WOFF2; WebP's live
`Content-Type: image/webp` was verified after the settings finished applying.

Store a copy of any existing contents outside the served directory before a
replacement. On a first installation preserve Plesk-managed authentication files
and settings. Rollback means restoring the previous complete static build;
credentials, TLS and domain configuration remain separate. Avoid deleting old
hashed assets during an in-place update so already-open tabs keep working.

## Live acceptance checks

1. In a fresh browser, HTTPS presents a valid certificate and a login prompt.
   An unauthenticated request to `/`, `/cinema`, `/restaurant`, `/assets/...`
   and `/art/...` must not expose the protected resources.
2. With the jury login, direct navigation to `/`, `/personal`, `/guided`,
   `/cinema` and `/restaurant` loads the app, rather than a webserver 404.
3. Confirm the entry HTML and assets have correct MIME types and expected headers.
   No `Permissions-Policy` may disable WebMCP tools; no `X-Frame-Options: DENY`
   or frame policy may block the same-origin embedded cinema and restaurant.
4. Test the personal walkthrough and both venues. In a WebMCP-capable browser,
   open cinema and restaurant as top-level pages, discover their registered tools
   and call a read-only tool on each. Native tool discovery requires the actual
   browser feature; an ordinary browser can still use the visible manual controls.
5. Complete the synthetic booking flow, including visible confirmation. Venue
   state and demo preferences are local to the browser; there is no real booking
   service or embedded model backend.

## Verified deployment state

On 3 September 2026, public DNS resolved to `188.68.47.172` and
`2a03:4000:30:c9c7::15:2448`. Before HTTPS activation, read-only **unauthenticated
HTTP** requests to all nine of these paths returned `401 Unauthorized`, with
`WWW-Authenticate: Basic realm="As I Am - Private Test"`:

- `/`, `/personal`, `/guided`, `/cinema`, `/restaurant`
- `/assets/index-CADcMmLM.js`, `/art/luna-poster.webp`
- `/.htaccess`, `/as-i-am-netcup-88715bf.zip`

Each response contained only the 172-byte nginx error page, with no application
content. No credentials were sent over HTTP and no TLS validation was bypassed.
The unauthenticated ZIP probe proves access protection, not file removal;
removal to trash was confirmed separately in Plesk.

Local validation of this package passed: build, 28 targeted tests, dependency
audit and secret scan. Apache 2.4 accepted the real `.htaccess`; all five entry
routes returned the app, expected headers and correct asset MIME/cache settings.
Chromium rendered every route without JavaScript errors and kept all venue frames
on the same origin.

After TLS activation, normal certificate-chain validation passed without
bypassing trust checks. Authenticated HTTPS returned `200` for all five entry
routes plus the actual JavaScript, CSS and WebP files. Unauthenticated HTTPS
requests returned `401` for `/`, `/cinema`, JavaScript and artwork; equivalent
HTTP requests returned `301` to HTTPS without sending credentials over HTTP.

Live headers now include `Origin-Agent-Cluster: ?1`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and
`Referrer-Policy: strict-origin-when-cross-origin` on entry HTML and static assets.
HTML/artwork use private revalidation; fingerprinted scripts/styles use private
immutable caching. HTML, JavaScript, CSS, SVG, WOFF and WOFF2 MIME types are correct.
The final WebP check at 20:12:49 UTC returned `200`, `image/webp`, and the expected
38,416-byte poster payload.

A fresh isolated Chromium context authenticated using the dedicated credentials,
loaded all five entry routes and their same-origin frames without JavaScript
errors, and completed the actual deployed personal walkthrough: saved allergies,
F1/F2 aisle pair, change to G1/G2, visible ticket confirmation, three dishes
including mushroom risotto, the open kitchen cross-contact confirmation, dinner
at 18:00, and the final visible demo ticket/table confirmation. These are synthetic
bookings stored in the test browser, not real reservations.

The in-app browser authenticated successfully and verified browser-native WebMCP
through CUA's `webmcp.fetchTools` and call interface, without injecting a shim:

- Home: `get_personal_evening_context` returned the saved demo context.
- Cinema: discovery returned 21 tools. `get_adaptation_capabilities` worked;
  `apply_adaptation_profile` applied calm/dark/low-glare appearance with disabled
  animations and reduced motion, returning all four requested checks satisfied
  and zero animations. `get_available_seat_pairs` included G1/G2 and correctly
  assigned the person to the aisle seat.
- Restaurant: `get_restaurant_menu` worked; `get_dinner_plan` coordinated the
  20:15 film with dinner at 18:00, quiet table T4 and a 30-minute buffer.
  `find_menu_options` avoided peanuts/avocado and returned risotto, chickpea and
  orzo dishes while retaining the required kitchen confirmation.

The browser was returned to the home page. Hosting acceptance checks are complete;
hackathon publication/submission and legal content are separate decisions.
Verification artifacts are local in ignored `output/netcup/`; credentials and
Authorization headers are not in those reports.

Apache references: [headers](https://httpd.apache.org/docs/2.4/mod/mod_headers.html),
[SPA routing / rewriting](https://httpd.apache.org/docs/2.4/rewrite/remapping.html).
