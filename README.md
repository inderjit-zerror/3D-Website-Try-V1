# Model S Plaid — Beyond Ludicrous

An interactive, scroll-driven WebGL story for a Tesla Model S Plaid concept.
Built with Next.js 16, React Three Fiber, drei, custom GLSL, GSAP and Lenis.

```bash
npm run dev     # http://localhost:3000  (webpack, needed for the .glsl loader)
npm run build   # production build (also webpack)
```

Add `?debug` to the URL to get orbit controls instead of the scripted camera.

## The story

| # | Chapter   | What the scene does                                                    |
|---|-----------|------------------------------------------------------------------------|
| 0 | Prologue  | Front three-quarter hero, wheels turned in, headlight welcome blink    |
| 1 | Form      | Side profile with GLSL airflow streamlines tracing the body            |
| 2 | Power     | Low chase shot, light streaks rush past, body squats under power       |
| 3 | Energy    | Car turns nose-up, paint scans away into an x-ray of the battery pack  |
| 4 | Sanctuary | Camera dives through the glass roof into the cabin (driver, then rear) |
| 5 | Yours     | Configurator: paint, finish, wheels, interior; drag to rotate          |
| 6 | Horizon   | Rear three-quarter, then the car drives off into the fog               |

The **day / night switch** in the nav is a drag slider: hold the knob and
scrub from noon to midnight (environment, sky, floor, lamps and UI all blend),
release and it settles on the nearest end. Click, Enter or Space toggles.

## Where things live

- `src/lib/carGeometry.js` — the procedural car body (lofted cross-sections,
  glass/trim/paint material groups). Tweak the profile splines to reshape it.
- `src/lib/story.js` — camera and scene keyframes per chapter.
- `src/lib/store.js` — paints, finishes, wheels, interiors and shared state.
- `src/shaders/` — GLSL: car paint (repaint sweep, flakes, seams, arch
  cut-outs, x-ray scan), sky, airflow, light streaks, hologram, battery cells.
- `src/components/canvas/` — the R3F scene; `src/components/ui/` — the DOM layer.

Builds are shareable: **Share this build** copies a link like
`/?paint=%239c0a12&finish=matte&wheels=tempest&interior=black#yours`.

> Independent concept; not affiliated with Tesla, Inc. The car is modelled
> procedurally in code; specs shown are illustrative.
