# Recording beat sheet

The current [93-second Chris / Eleven v3 edit](recording.md) follows the timestamps of one continuous voice-over.
Only the recorded screen holds are retimed. Click motion stays at its original speed, and
both original sites are used before adaptation.

| Time      | Screen                                               | The audience should understand                                      |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| 0:00–0:09 | Original LUNA page; elevator pitch                   | The web adapts to me. Preferences travel, not personal details.     |
| 0:09      | Select F6 and F7 on the original seat map            | A simple night out makes the idea concrete.                         |
| 0:15      | Full OLIVA page; select 18:30 in its normal grid     | These are working websites.                                         |
| 0:21      | Hold the busy restaurant, then return to cinema      | Different needs and preferences deserve different interfaces.       |
| 0:30      | Read the request; adapt LUNA                         | Bigger buttons, fewer distractions, same seats.                     |
| 0:38      | Original / My view; review and confirm               | I stay in control.                                                  |
| 0:44      | Continue to dinner; hold the unchanged restaurant    | Navigation does not share preferences.                              |
| 0:51      | Use my preferences here; compare, review and confirm | I choose to share preferences. My table choice stays.               |
| 1:02      | Discover → Adapt → Carry; readable receipt           | WebMCP gives the agent and website a shared way to request changes. |
| 1:15      | Make the cinema text larger                          | The same approach can help beyond booking.                          |
| 1:26–1:33 | Broader applications, then hero                      | Your needs. Your preferences. Your choice.                          |

## Before recording

- Start all three origins with `npm run dev` and reload the controller for fresh session state.
- Preserve the browser's existing aspect ratio. Keep the pointer visible and deliberate.
- Check the actual native/fallback badge. Use direct top-level pages for native calls if frame
  exposure is unavailable. Keep the distinction explicit in narration.
- Run both complete bookings once, then reload for the take.
- Capture the seat-map comparison before confirming tickets; confirmation is preserved by preview.
- Confirm that **Continue to dinner** leaves the original restaurant unchanged. Only
  **Use my preferences here** shares the receipt, without booking selections.
- Keep JSON collapsed throughout the main story. Use the readable proof panel for the reveal;
  raw tools and data are available for judge inspection afterward.
- Hide personal tabs, bookmarks, notifications and machine-specific information.

## After recording

- Generate the entire English voice-over once, including the opening pitch, before editing.
- Fit the screen holds to the returned speech timestamps. Never insert silence between chapters.
- Keep the natural performance intact; do not stretch audio to fill the old video length.
- Keep the unadapted/adapted transitions visible long enough to compare.
- Check narrated measurements against that take, rather than quoting a fixed benchmark.
- Preserve the synthetic-booking disclosure.
- Review the final video before publishing; verify submitted links in a logged-out browser.
- The old `demo-clickthru.mp4` and shop/services screenshots are legacy materials. Use the new
  cinema/restaurant [recording](recording.md); owner review and public upload remain.
