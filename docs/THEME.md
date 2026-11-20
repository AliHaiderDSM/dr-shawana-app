# App colours

Every colour in the app comes from one file: `src/theme/tokens.ts`.

## Change the brand colours

Edit only the `brand` object at the top of `src/theme/tokens.ts`:

| Key | Used for |
|---|---|
| `primary` | Buttons, tabs, links, headings, home cards, your own chat bubbles |
| `primaryDark` | Buttons while pressed |
| `primaryDeep` | Text on the light primary tint |
| `primaryTint` | Light backgrounds behind icons, times and chips |
| `heroStart`, `heroEnd` | The gradient on the top card of the patient and doctor home screens (`HeroGradient`) |
| `green` | Leaf stripe on the home cards and other small accents |
| `greenTint` | Light green backgrounds (for example the Booked status) |
| `ink` | Main text |
| `inkMuted` | Secondary text |
| `paper` | Screen background |
| `paperMuted` | Muted surfaces |
| `line` | Borders and dividers |

`colors`, `chart` and the prescription PDF read from `brand`, so the whole app, both the patient and doctor sides, changes together. Keep text readable: white text must stay readable on `primary`.

Status colours (`warning`, `danger`, `info`) live in `colors` and are meant to stay the same.

After changing colours, run `npx tsc --noEmit`, then send them to the phones with `eas update`.

## Colours that are not in tokens.ts

- `app.json` → `expo-notifications` → `color`: the small notification icon colour. Changing it needs a new build (`eas build`), not `eas update`.
- `app.json` splash and adaptive icon backgrounds: also need a new build.
- The web dashboard has its own colours in `dashboard/src/index.css`.
