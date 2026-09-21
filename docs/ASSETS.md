# Asset provenance and generation prompts

Mode: built-in `image_gen` tool. Two original PNG images were generated, visually inspected, and copied from the local generated-images directory into the project. No runtime image API is required.

## Checkpoint environment

Saved at `public/assets/checkpoint.png` (1536 × 1024).

Final prompt:

> Use case: stylized-concept. Asset type: background art for a border inspection simulation game. Wide panoramic illustration, 1536x1024. View from inside a dark border checkpoint looking out across a bleak Eastern European concrete checkpoint, razor wire fences, striped barrier, distant brutalist apartment towers, a watchtower, faint mountains, overcast foggy autumn morning. No people in foreground. Muted olive gray, charcoal, desaturated khaki, subtle warm amber window light. Beautiful detailed hand-painted pixel art with deliberate pixel edges, atmospheric depth, cinematic indie game art. Composition: central road recedes into distance, booth framing at left and right edges. No text, no lettering, no watermark, no interface.

## Traveler portrait atlas

Saved at `public/assets/travelers.png` (1536 × 1024). The three 512-pixel columns are used directly by the Portrait component without destructively cropping the original.

Final prompt:

> Use case: stylized-concept. Asset type: three character portrait sprite atlas for border inspection game. One wide image with exactly three equal-width vertical panels, no gaps. Each panel has identical flat dark olive gray background and contains one head and shoulders portrait centered, facing directly forward, upper torso visible. LEFT: Jorji, a middle aged weary man with short dark graying hair, big nose, stubble, worn brown jacket over beige shirt, slightly sheepish expression. CENTER: Boris, a stern 40 year old man, black short hair, thin mustache, olive utility coat, tense expression. RIGHT: Elysia, a woman in her 30s, short auburn bob hair, round glasses, cream shirt and dark green coat, composed expression. Detailed hand-painted pixel art style, deliberate visible pixel edges, restrained muted olive charcoal beige rust palette, subtle directional lighting. Same scale and framing for all three. Original fictional characters. No text, no borders, no watermark. Landscape 1536x1024.

## Code-native assets

- `public/assets/ministry-seal.svg`: original editable vector seal based on the specification; its canonical serialized content lives in `lib/seal.ts` for integrity verification.
- Passport, permit and ink stamps: CSS and accessible HTML, keeping text sharp and selectable by assistive tools.
- Sound effects: procedural Web Audio in `lib/sound.ts`; filtered noise for paper and stamp impacts, distinct triangle-wave tones for each stamp, intercom cues, and audit success/citation tones. No external audio files.
- Interface icons: Lucide React.
