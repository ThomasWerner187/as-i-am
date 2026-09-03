# Art direction and asset provenance

The opening must communicate the task without explaining the protocol. A small, believable
seat map becomes three obvious pairs; a recognizable restaurant becomes three clear dinner
choices. Technical evidence is progressively disclosed under “How it works.”

The story-led cut shows both original, working websites before requesting any help. The restaurant
is shown again immediately before the separate transfer action. The explanation uses three plain
steps and a readable preference receipt; raw JSON stays under “Actual tools & data.” The motive is
individual needs and preferences, not a claim that the original sites are broken. Broader contexts
are explicitly limited to websites that support the contract.

The frontend-design approach preserves distinct site identities: charcoal/amber LUNA,
cream/olive OLIVA, and a quiet paper/sage controller. Fraunces and Instrument Sans continue
the existing local-font direction. Transformation comes from actual component structure,
target size and content priority, not a decorative animation or screenshot swap.

## Generated production artwork

Both assets were generated specifically for this fictional demo on 2026-09-02 with the
image-generation tool. They contain no UI text. Text overlays and labels are rendered as HTML.

### `public/art/luna-poster.webp`

The lossless source is preserved at `docs/art-sources/luna-poster.png`. The website serves
an optimized 640px-wide WebP.

Prompt:

> Use case: stylized-concept. Generate a production website asset: a cinematic science fiction film poster ARTWORK ONLY, portrait 2:3 aspect. A huge richly textured amber moon hangs above a majestic quiet ochre desert with layered sand dunes and a single tiny silhouetted traveler. Rich almost-black sky, luminous bronze moon, fine analog photographic film grain, art-house science fiction tone, dramatic composition. Carefully composed vast scale, controlled deep dark shadows, warm amber highlights. No text, no logos, no watermarks, no UI, no frames. This will be used as the LUNA cinema film poster in an accessibility demo; retain large quiet lower area suitable for text overlay added in code.

### `public/art/oliva-table.webp`

The lossless source is preserved at `docs/art-sources/oliva-table.png`. The website serves
an optimized 640px-wide WebP.

Prompt:

> Use case: photorealistic-natural. Generate a production website asset: a beautiful realistic editorial photograph for an intimate Mediterranean restaurant called OLIVA (do not include text). Portrait 3:4 crop, close tabletop scene with a rustic ceramic plate of fresh hand-shaped pasta with basil, olive oil and cherry tomatoes, beside a softly folded linen napkin and a small glass of water. Warm late-afternoon sunlight raking across a pale stone table, gentle long shadows, glimpse of olive foliage at the edge. Sophisticated food magazine quality, real tactile ingredients, natural imperfect plating, peaceful inviting mood. Keep the food recognizable even as a small side panel. No people, no letters, no logo, no watermark, no UI, no border.

Images are static, locally served and have meaningful alt text. Review final artwork and
licensing requirements before public submission. No third-party cinema or restaurant is implied.
The two deployed WebP files total approximately 124 KiB, about 97% smaller than the original
PNGs. The source images remain in the repository for provenance and future exports.

## Fonts and code

Fraunces, Instrument Sans and Atkinson Hyperlegible are installed through Fontsource and
served locally. Their original copyright and SIL Open Font License 1.1 notices are preserved
in [third-party-licenses.txt](../public/third-party-licenses.txt), which is included in the
static deployment at `/third-party-licenses.txt`. The project's [MIT license](../LICENSE)
applies to its source code; it does not replace those font licenses.

The cinema and restaurant names, film, inventory and bookings are fictional. SVG interface
icons are authored in the source. The video uses the ElevenLabs premade Chris voice; details
and the publication review step are in [recording](recording.md).
