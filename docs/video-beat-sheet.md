# Recording beat sheet

The current [122-second recording](recording.md) follows these actual chapter timestamps.
Both original sites are used before the first adaptation.

| Time      | Screen                                                 | The audience should understand                                      |
| --------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| 0:00      | Select F6 and F7 on the original LUNA seat map         | I want a night out: two seats and dinner.                           |
| 0:07      | Full OLIVA page; select 18:30 in its normal grid       | These are working websites.                                         |
| 0:14      | Hold the busy restaurant, then return to cinema        | Different needs and preferences deserve different interfaces.       |
| 0:24      | Read the request; adapt LUNA                           | Bigger buttons, fewer distractions, two seats together.             |
| 0:36      | Original / My view; review and confirm                 | Same seats, simpler choices. I stay in control.                     |
| 0:49      | Continue to dinner; hold the unchanged full restaurant | Navigation does not share preferences.                              |
| 1:00      | Use my preferences here; compare, review and confirm   | I choose to carry preferences. My table choice stays.               |
| 1:19      | Discover → Adapt → Carry; readable receipt             | WebMCP gives the agent and website a shared way to request changes. |
| 1:38      | Make the cinema text larger                            | This is about individual preferences, beyond a single booking flow. |
| 1:50–2:02 | Broader applications, then hero                        | A web that adapts to what you like and need.                        |

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

- Use real application footage with spoken English and captions; target two minutes.
- Keep the unadapted/adapted transitions visible long enough to compare.
- Check narrated measurements against that take, rather than quoting a fixed benchmark.
- Preserve the synthetic-booking disclosure.
- Review the final video before publishing; verify submitted links in a logged-out browser.
- The old `demo-clickthru.mp4` and shop/services screenshots are legacy materials. Use the new
  cinema/restaurant [recording](recording.md); owner review and public upload remain.
