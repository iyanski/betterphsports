# 🏅 Better Philippine Sports

A community-built portal for the **Philippine Sports Commission** — its services, its
structure, and the public records it publishes but does not make readable.

The PSC discloses its budget, spending, revenue and procurement as required by law. It
does so as scanned PDFs, one document at a time, with no way to compare a year against
the one before it. This project mirrors those documents, reads them, checks the
arithmetic, and publishes the result as charts and downloadable tables.

![The Better Philippine Sports home page: a hero reading "Better Philippine Sports — programs, facilities, and support for Filipino athletes, and a clear look at how the agency works", above cards for Grassroots Sports, National Athletes, Sports Facilities and Sports Development](docs/images/home.png)

> **Not an official PSC website.** Everything here is built from documents the agency
> published itself. Figures are machine-read from scans and may contain errors; each
> page states how its numbers were read and links to the original.

## What's here

|                                 |                                                                       |
| ------------------------------- | --------------------------------------------------------------------- |
| **Services & Government pages** | Plain-language guides to PSC programmes, built from Markdown and YAML |
| **`/data` — data stories**      | Charted analyses of the agency's own disclosures                      |
| **`scripts/psc-data/`**         | The pipeline that turns scanned PDFs into checked, committed data     |

### Data stories

- **[`/data/budget`](src/pages/data/Budget.tsx)** — _Ten years of money._ Appropriations,
  allotments, obligations and disbursements, FY2017–FY2026, from the agency's FAR No. 1.
- **[`/data/revenue`](src/pages/data/Revenue.tsx)** — _Where the money comes from._
  Income by source against target, from FAR No. 5.
- **[`/data/participation`](src/pages/Participation.tsx)** — _Who actually plays._ 20,662
  athletes across three national games, obtained under freedom of information.

Currently mirrored: **142 documents, 929 pages, FY2017–FY2026.** Twenty-eight of the
PSC's own transparency links do not resolve — twenty on a host it retired, eight are
404s on the live site — which is why the record starts at 2017. See
**[docs/psc-data.md](docs/psc-data.md)** for the full status.

## 🚀 Quick start

Requires **Node.js 20+**.

```bash
git clone https://github.com/iyanski/betterphsports.git
cd betterphsports
npm install
npm run dev          # http://localhost:5173
```

Copy `env.example` to `.env.local` and adjust as needed. `VITE_CANONICAL_ORIGIN` should
be this site's own public domain — **not** `psc.gov.ph`, or search engines will be told
every page here duplicates the agency's site.

## 🛠️ Scripts

### App

| Script                            | What it does                                                 |
| --------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                     | Development server                                           |
| `npm run build`                   | Type-check and build for production                          |
| `npm run lint` / `lint:fix`       | ESLint                                                       |
| `npm run format` / `format:check` | Prettier                                                     |
| `npm run index-content`           | Push content into Meilisearch ([guide](docs/meilisearch.md)) |

### Data pipeline

The pipeline needs macOS (it uses the Vision framework for OCR) and a signed-in browser,
so **it never runs in CI** — that is why its outputs are committed.

| Script                          | Stage                                                              |
| ------------------------------- | ------------------------------------------------------------------ |
| `npm run psc:catalog`           | Build the document catalogue from the Transparency Seal page       |
| `npm run psc:ingest`            | Move downloads into `data/raw/`, verify hashes, build the manifest |
| `npm run psc:wayback`           | Try the Internet Archive for links the PSC no longer serves        |
| `npm run psc:render`            | Render pages at 300 dpi and read them with Vision OCR              |
| `npm run psc:far1` / `psc:far5` | Reconstruct the tables and cross-foot them                         |
| `npm run psc:revenue`           | Build the revenue series the pages read                            |
| `npm run psc:verify`            | Cut page strips for a second, independent reading                  |
| `npm run psc:test`              | Number parsing, budget identities, revenue consistency             |

`npm run psc:test` is the gate between "a machine read a scan" and "this is on a public
accountability site". Every published budget year satisfies all three of the FAR No. 1
form's own arithmetic identities, exactly, to the centavo. **A figure that does not
balance is not published.**

## 📁 Project structure

```
content/                  Markdown + YAML for services and government pages
  government/             About the PSC, leadership, transparency, procurement, careers
  services/               Grassroots sports, national athletes, facilities, inclusion…

data/                     The document archive and what was read from it
  catalog/                Harvested links and the derived document catalogue  (committed)
  manifest/               Per-document provenance: URL, SHA-256, pages, status (committed)
  derived/                Extracted rows and the series the pages read        (committed)
  raw/                    The mirrored PDFs                                   (gitignored)

scripts/psc-data/         The pipeline, stage by stage
  lib/                    Number parsing, table reconstruction, OCR geometry
  ocr/VisionOCR.swift     Word-level OCR via Apple's Vision framework
  layouts/                What each column of each form means

src/
  components/charts/      Hand-written SVG marks — no charting library
  components/story/       Section furniture for the data stories
  data/psc/               Typed, checked datasets the pages import
  pages/data/             The data stories
```

## 📚 Documentation

- **[docs/psc-data.md](docs/psc-data.md)** — pipeline status, what is solved, what is not
- **[docs/meilisearch.md](docs/meilisearch.md)** — search setup
- **[CONTENT-MANAGEMENT.md](CONTENT-MANAGEMENT.md)** — editing content without Git
- **[CONTENT-GUIDE.md](CONTENT-GUIDE.md)** — writing guidelines
- **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)** — deploying to Vercel
- **[CHANGELOG.md](CHANGELOG.md)** — version history

## 🤝 Contributing

### Found a wrong number?

That is the most valuable thing you can report. These figures were read off scans by
machine. Open an issue with the page, the figure, and the source document — corrections
take priority over everything else.

### Content, without Git

You do not need to code. Every page under `content/` is a Markdown file editable through
GitHub's web interface — see **[CONTENT-MANAGEMENT.md](CONTENT-MANAGEMENT.md)** for
step-by-step instructions. Useful contributions include correcting outdated service
information, adding missing requirements or contacts, and translating into Filipino.

### Code

```bash
git checkout -b feature/your-change
npm run lint && npm run psc:test && npm run build
```

Then open a pull request. Follow the surrounding style; the charts are deliberately
hand-written SVG rather than a charting library, and datasets are typed so `tsc` catches
a schema change instead of a chart rendering `NaN`.

## 📄 License

Released under **[Creative Commons Zero (CC0)](LICENSE)** — public domain, no
restrictions, no attribution required.

Philippine government works are in the public domain under Section 176 of RA 8293. The
tables derived from them here are offered on the same terms. If a figure is wrong, the
error is ours and not the agency's.

## 🙏 Built with

[React](https://reactjs.org/) · [Tailwind CSS v4](https://tailwindcss.com/) ·
[@bettergov/kapwa](https://github.com/bettergov/kapwa) ·
[Lucide](https://lucide.dev/) · [i18next](https://www.i18next.com/) ·
[Vite](https://vite.dev/)

Forked from [betterlocalgov](https://github.com/iyanski/betterlocalgov), a starter kit
for Philippine local government units.

## 👥 Contributors

- **[iyanski](https://github.com/iyanski)** — creator and maintainer
- **[Nicu Listana](https://github.com/niculistana)** — contributor

---

**Made for everyone who pays for Philippine sport.**
