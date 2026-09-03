# Release and freeze runbook

This is the publication handoff for the WebMCP Challenge entry. Preparing files locally does
not deploy the app, make the repository public, upload a video or submit to Devpost.

The organizer's reminder gives a submission deadline of **September 3, 2026 at 13:00 PDT**:
**20:00 UTC / 22:00 Europe/Berlin**. Aim to submit by **19:00 Berlin** for a three-hour buffer.
The submitted repo, website, video and entry must then remain unchanged and available through
the end of judging: **September 21 at 17:00 PDT / September 22 at 00:00 UTC / 02:00 Berlin**.
Recheck the [official rules](https://webmcp.devpost.com/rules) before publication.

## 1. Prepare one release candidate

Use the reviewed projectctl branch/worktree. Review the diff and commit source changes using
the repository's required identity. Keep media output, API responses, credentials and generated
test state out of Git. The source needs to include the application and MIT license on the
branch judges see; the current remote `main` scaffold is not the release candidate.

Run with Node.js 22:

```bash
npm ci
npx playwright install chromium
npm run check
npm audit
gitleaks git --redact=100 --no-banner --log-opts=--all .
```

Linux CI uses `npx playwright install --with-deps chromium`. The quality workflow also runs
the recorder tests. Record the tested commit and actual totals in [verification](verification.md).
If a check fails, resolve the failure and repeat the relevant checks before freezing the build.

## 2. Choose and verify the deployment topology

The app is a static Vite SPA: build with `npm run build`, publish `dist/`, and route direct
requests such as `/cinema` and `/restaurant` to `index.html`. Hosting configuration is included
for Vercel and Netlify. Hosting must permit public access without an account or deployment
password. `npm run preview` provides a local production smoke check after building; it is
not a public hosting service.

**One public origin** runs the controller and both sites as separate documents at `/`,
`/cinema` and `/restaurant`. It needs no custom `VITE_*` URLs. The UI must identify this as
one origin; do not describe it as a cross-origin deployment in the submission.

**Three public origins** preserve the browser boundary shown by the local development setup.
Build all three deployments from the same reviewed source and the same environment settings:

```text
VITE_AGENT_ORIGIN=https://your-controller.example
VITE_CINEMA_URL=https://your-cinema.example/cinema
VITE_RESTAURANT_URL=https://your-restaurant.example/restaurant
```

These are examples, not live project URLs. `VITE_AGENT_ORIGIN` is an origin with no path or
trailing slash. The two site URLs include their page paths. Vite embeds these values at build
time, so changing hosting environment settings requires a new build **before the deadline**.
Use HTTPS and stable URLs. Permit the configured controller to frame the two sites; do not
apply a blanket frame-denial header to the booking pages. Verify actual native permissions
and response headers in the presentation browser after deployment.

Do not assume the development server proves the production deployment. Open the built site
and reload each direct route. Check artwork, fonts, `/third-party-licenses.txt` and both frames.
Verify that the controller's links point to the intended public site URLs.

## 3. Run the public judge check

Use a fresh browser session with no cached login. Follow [judge-testing.md](judge-testing.md):

- Complete both chosen help modes and verify that navigation alone does not transfer a receipt.
- Confirm cinema tickets, derive the 18:00/T4 suggestion from their 20:15 film time, and inspect the menu.
- Test an explicit allergen constraint, its removal, and preservation of a different existing table choice.
- Discover and successfully call native WebMCP tools on the direct top-level LUNA and OLIVA pages.
- Apply and measure supported preferences, transfer the actual receipt with consent, and prepare
  both booking reviews. Confirm only through the visible human interface.
- Check the actual native/fallback label, topology, keyboard focus and narrow-screen layout.
- Reload each direct route and ensure the deployment remains publicly accessible.

Record the browser, date, viewport, native results, URLs and deployment identifier. Local
shim tests or guided bridge results do not replace this public native execution check.

## 4. Publish the matching materials

Repository visibility and public publication require the owner's approval. Before that step,
have the reviewed commit, preview deployment, final video and exact submission copy ready.

1. Merge the reviewed application branch into canonical `main` through the normal review path.
   Verify successful CI and the expected source, setup instructions and root MIT license.
2. With approval, make the project repository public. Check its logged-out page: the actual
   application is visible and GitHub detects the MIT license in the About section.
3. Complete a matching recording after browser recording access is restored and a new attempt is approved.
   The new 315-word Chris / Eleven v3 narration is ready, but the capture failed with zero frames.
   Automatic approval review rejected renewed access as a bypass; do not retry indirectly.
   The earlier 117-second video is historical and must not stand in for this revised interface.
   Once a supported new capture succeeds, verify runtime below three minutes, actual native
   evidence, narration, captions and correspondence with the released UI. See [recording](recording.md).
4. Upload the selected file to public YouTube early. Wait for video/audio processing, verify
   playback logged out, and add the supplied English captions. Copy its public URL.
5. Fill Devpost with the [English submission copy](devpost-submission.md), verified live/repo/video
   links and the compact testing field from [judge-testing.md](judge-testing.md). Add teammates
   and confirm accepted invitations if entering as a team.
6. Save and submit. Open **My Projects** and verify the green **Submitted** label; a saved draft
   is not a completed submission. Preserve that evidence locally.

Update any remaining “not published” statements and actual topology in the packet before the
deadline. Keep speculative future capabilities separate from what the live project demonstrates.

## 5. Record and preserve the final submission

Complete this record before the deadline. Keep the final copy and screenshots outside the
frozen submitted repository if recording them after the freeze would require a new commit.

| Evidence | Value to record |
| --- | --- |
| Source | Public repository URL, canonical commit SHA and optional release tag |
| Deployment | Controller URL, direct LUNA/OLIVA URLs, topology and deployment ID |
| Build | Node version, build environment values and archived final `dist/` artifact |
| Native verification | Browser/version, date, direct tool calls and observed results |
| Video | YouTube URL, selected local filename, duration and SHA-256 |
| Entry | Devpost URL, submission time and green Submitted evidence |
| Team | Entrants listed and invitations accepted, or confirmed solo entry |
| Accessibility | Public logged-out checks and limitations disclosed in the copy |

Before the freeze, disconnect automatic deployments from branches that will continue to change
or lock the deployment target to the submitted release. Preserve the exact artifact and stable
public URLs. Check hosting account/quota availability for the whole judging period.

From **September 3 at 22:00 Berlin**, do not edit the submitted repository, live content, video,
captions, description or links. Keep later development in a separate unpublished worktree and
deployment target. Do not take the submitted project offline. If hosting fails, restore the
same frozen artifact without changing its content; contact the organizers if resolution would
require an alteration to the submission.

The [checklist](hackathon-checklist.md) records remaining gates. An unchanged working site and
a visible **Submitted** status are the final evidence that local preparation alone cannot provide.
