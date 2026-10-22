# Vendored libraries

Third-party scripts the apps load from this folder instead of a CDN. All are MIT licensed; each file keeps its own license banner.

| File | Package | Version | Used by |
|---|---|---|---|
| `chart.js` | [chart.js](https://www.npmjs.com/package/chart.js) | 4.6.1 | Cpi Explorer, Yield Curves, Yields Monitor |
| `chartjs-adapter-date-fns.js` | [chartjs-adapter-date-fns](https://www.npmjs.com/package/chartjs-adapter-date-fns) | 3.0.0 | Cpi Explorer, Yield Curves, Yields Monitor |
| `hammer.js` | [hammerjs](https://www.npmjs.com/package/hammerjs) | 2.0.8 | Cpi Explorer, Yield Curves, Yields Monitor |
| `chartjs-plugin-zoom.js` | [chartjs-plugin-zoom](https://www.npmjs.com/package/chartjs-plugin-zoom) | 2.2.0 | Cpi Explorer, Yield Curves, Yields Monitor |
| `chartjs-plugin-annotation.js` | [chartjs-plugin-annotation](https://www.npmjs.com/package/chartjs-plugin-annotation) | 3.1.0 | Yields Monitor |
| `marked.js` | [marked](https://www.npmjs.com/package/marked) | 18.1.1 | Taxation of Treasuries, Primer beta, knowledge viewer |
| `mermaid.js` | [mermaid](https://www.npmjs.com/package/mermaid) | 12.2.0 | knowledge viewer |
| `katex/` | [katex](https://www.npmjs.com/package/katex) | 0.19.0 | knowledge viewer |

Each file is the distribution file the package's jsDelivr URL serves for that version, except `marked.js`, which is the package's `lib/marked.umd.js`, and `mermaid.js`, which is the package's `dist/mermaid.min.js`. `katex/` holds `katex.min.js`, `katex.min.css` and `contrib/auto-render.min.js` from the package's `dist` folder, and the 20 `.woff2` fonts the stylesheet names, in `katex/fonts/`; the stylesheet's `.woff` and `.ttf` fallbacks are not kept, since every current browser takes the `.woff2`.

`scripts/checkVendorUpdates.js` compares the versions in this table with the latest npm releases and with npm's security advisories; the `VendorUpdateCheck` scheduled task runs it every Monday. For `mermaid.js` (5.5 MB, about 1.6 MB added to the repository by each version committed) the check reports security advisories only, not newer versions.
