# As I Am hosting

Prepared on 3 September 2026. This file records the project's deployment plan;
successful live deployment and browser checks must be confirmed separately.

| Item | Configuration |
| --- | --- |
| Provider | Existing Netcup shared webhosting |
| URL | `https://asiam.wernerverse.de/` |
| Document root | Dedicated `asiam.wernerverse.de/httpdocs`, relative to the subscription webspace; confirm this exact path in Plesk before upload |
| Runtime | Static HTML, JavaScript, CSS and locally hosted assets; no server-side Node.js/PHP/database needed |
| Build | Node.js 22+, `npm ci`, `npm run build` |
| Upload package | `node tools/package-netcup.mjs`, output in ignored `output/netcup/` |
| Entry points | `/`, `/personal`, `/guided`, `/cinema`, `/restaurant`; Apache SPA fallback serves `index.html` |
| Authentication | Plesk password-protected document root with a dedicated jury login, over HTTPS; credentials are never included in source or build files |
| TLS | Valid certificate and HTTP-to-HTTPS redirection configured in Plesk |
| WebMCP | All app routes on this single HTTPS origin; leave `VITE_AGENT_ORIGIN`, `VITE_CINEMA_URL` and `VITE_RESTAURANT_URL` unset |

## Deployment

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

Public verification and native WebMCP verification: pending deployment.

Apache references: [headers](https://httpd.apache.org/docs/2.4/mod/mod_headers.html),
[SPA routing / rewriting](https://httpd.apache.org/docs/2.4/rewrite/remapping.html).
