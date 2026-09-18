/**
 * Stage 10 - corroborate the published BAR No. 1 figures against the OCR.
 *
 * The figures in src/data/psc/delivery.ts were read off the page images cell by
 * cell. That is a careful reading, but it is one reading, and a reader who
 * already believes a number is the worst possible checker of it. This stage
 * asks a second, indifferent witness -- the Vision OCR token stream from the
 * same 300 dpi render -- whether each published figure is actually printed
 * where it is claimed to be.
 *
 * It is not an extractor. Building a geometric reconstruction of ten filings
 * that share no two page sizes, to recover sixty rows, would be a great deal of
 * machinery for numbers that are already double-read. What this does instead is
 * cheap and specific:
 *
 *   1. cluster the page's tokens into visual rows by vertical overlap, because
 *      Vision's own `line` field splits one row of a wide form into a dozen;
 *   2. for each published row, find the cluster that holds the most of its
 *      figures;
 *   3. report how many of them are there, IN COLUMN ORDER left to right.
 *
 * Order is what makes this worth running. A value alone proves little on a page
 * covered in numbers -- but four quarters, a total and a variance appearing in
 * that sequence, ascending across the page, is the row.
 *
 * A figure OCR did not see is not an error. Vision drops faint digits and welds
 * neighbouring cells together, which is documented at length in
 * docs/psc-data.md; the corroboration rate is a floor, not a score. The output
 * lists every uncorroborated figure so it can be looked at again.
 *
 * Writes data/derived/bar1/corroboration.json.
 *
 * Usage:  node scripts/psc-data/10-bar1.mjs [--only <docId>] [--verbose]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { years, indicatorBy } from '../../src/data/psc/delivery.ts';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const OCR = path.join(ROOT, 'data/derived/_work/ocr');
const OUT = path.join(ROOT, 'data/derived/bar1');

const arg = (f, d) => {
  const i = process.argv.indexOf(f);
  return i > -1 ? process.argv[i + 1] : d;
};
const ONLY = arg('--only', null);
const VERBOSE = process.argv.includes('--verbose');

/**
 * Which pages carry the statement each year's figures come from.
 *
 * Page 1 everywhere: the December filing is printed first in every one of these
 * documents, ahead of the earlier quarters. FY2017 is the exception -- its
 * statement runs onto page 2, which is where that year's targets are restated
 * as numbers rather than as "5% inc from 2014 (13,644)".
 */
const STATEMENT_PAGES = { 'bar1-2017-q4': [1, 2] };
const pagesFor = docId => STATEMENT_PAGES[docId] ?? [1];

/** A money-free integer, as the form prints them. "1,794" and "1794" both. */
const NUMERIC = /^-?\(?\d[\d,]*\)?$/;

function valueOf(text) {
  if (!NUMERIC.test(text)) return null;
  // Parentheses are the form's way of writing a baseline, not a negative.
  const bare = text.replace(/[(),]/g, '');
  const n = Number(bare);
  if (!Number.isFinite(n)) return null;
  return text.startsWith('-') ? -Math.abs(n) : n;
}

/**
 * Cluster tokens into visual rows.
 *
 * Tolerance follows the page's own type size rather than a fixed pixel count,
 * because one of these renders is 10000 px wide and another 3300.
 */
function rowsOf(words) {
  const toks = words
    .map(w => ({ ...w, value: valueOf(w.text), mid: (w.y0 + w.y1) / 2 }))
    .filter(w => w.value !== null)
    .sort((a, b) => a.mid - b.mid);
  if (!toks.length) return [];

  const heights = words.map(w => w.y1 - w.y0).sort((a, b) => a - b);
  const tol = Math.max(8, heights[Math.floor(heights.length / 2)] * 0.55);

  const clusters = [];
  let current = [toks[0]];
  for (const t of toks.slice(1)) {
    const mean = current.reduce((a, c) => a + c.mid, 0) / current.length;
    if (Math.abs(t.mid - mean) <= tol) current.push(t);
    else {
      clusters.push(current);
      current = [t];
    }
  }
  clusters.push(current);
  return clusters.map(c => c.sort((a, b) => a.x0 - b.x0));
}

/**
 * Does this token carry this figure?
 *
 * Exact, with one licence: the variance column. Over ten years the agency
 * writes a shortfall three different ways -- "-10,389", "Lower by 174,857",
 * and "None" -- so a negative variance is matched on its magnitude too.
 */
const carries = (token, figure) =>
  token.value === figure.value ||
  (figure.column === 'variance' && token.value === Math.abs(figure.value));

/**
 * The longest run of `wanted` that appears in `cluster` left to right.
 *
 * Greedy, and deliberately so: it walks the cluster once, taking each wanted
 * value only after the one before it has been found further left. That is the
 * claim being tested -- these numbers, in this order, across this row.
 */
function matchInOrder(cluster, wanted) {
  const hit = new Array(wanted.length).fill(false);
  let ci = 0;
  for (let wi = 0; wi < wanted.length; wi++) {
    for (let j = ci; j < cluster.length; j++) {
      if (carries(cluster[j], wanted[wi])) {
        hit[wi] = true;
        ci = j + 1;
        break;
      }
    }
  }
  return hit;
}

/** The figures a row publishes, in the order the form prints them. */
function figuresOf(row) {
  const out = [];
  row.targetQuarters.forEach((v, i) => {
    if (v !== null) out.push({ column: `target Q${i + 1}`, value: v });
  });
  if (row.target !== null) out.push({ column: 'target', value: row.target });
  row.accomplishmentQuarters.forEach((v, i) => {
    if (v !== null) out.push({ column: `actual Q${i + 1}`, value: v });
  });
  if (row.accomplishment !== null)
    out.push({ column: 'actual', value: row.accomplishment });
  if (row.variance !== null)
    out.push({ column: 'variance', value: row.variance });
  return out;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const report = { generatedAt: new Date().toISOString(), years: [] };
  let total = 0;
  let seen = 0;
  let zeroMisses = 0;

  for (const y of years) {
    if (ONLY && y.docId !== ONLY) continue;

    const file = path.join(OCR, `${y.docId}.ndjson`);
    if (!existsSync(file)) {
      console.log(
        `${String(y.fiscalYear).padEnd(6)} no OCR — run: npm run psc:render -- --series bar1`
      );
      continue;
    }
    const pages = (await readFile(file, 'utf8')).trimEnd().split('\n');
    const clusters = pagesFor(y.docId).flatMap(p =>
      pages[p - 1] ? rowsOf(JSON.parse(pages[p - 1]).words) : []
    );

    const rows = [];
    for (const row of y.rows) {
      const figures = figuresOf(row);
      // The cluster that holds the most of this row's figures, in order. Ties
      // go to the first, which is the topmost row on the page.
      let best = { hit: figures.map(() => false), score: 0 };
      for (const c of clusters) {
        const hit = matchInOrder(c, figures);
        const score = hit.filter(Boolean).length;
        if (score > best.score) best = { hit, score };
      }

      // Second pass, weaker: a figure the row's own cluster does not hold may
      // still be printed elsewhere in the statement. FY2017 needs this -- that
      // year's targets are restated in a block of their own on page 2 -- and it
      // is recorded as a separate, lesser class of evidence, not folded in.
      const elsewhere = figures
        .map((f, i) =>
          best.hit[i]
            ? null
            : clusters.some(c => c.some(t => carries(t, f)))
              ? f
              : null
        )
        .filter(Boolean);

      const missed = figures
        .filter((_, i) => !best.hit[i])
        .filter(f => !elsewhere.includes(f))
        .map(f => `${f.column}=${f.value.toLocaleString('en-US')}`);
      const zeros = figures.filter(
        (f, i) => !best.hit[i] && !elsewhere.includes(f) && f.value === 0
      ).length;

      total += figures.length;
      seen += best.score;
      zeroMisses += zeros;
      rows.push({
        indicator: row.indicator,
        figures: figures.length,
        corroborated: best.score,
        seenElsewhere: elsewhere.map(f => f.column),
        uncorroborated: missed,
      });
    }

    const f = rows.reduce((a, r) => a + r.figures, 0);
    const c = rows.reduce((a, r) => a + r.corroborated, 0);
    const e = rows.reduce((a, r) => a + r.seenElsewhere.length, 0);
    console.log(
      `${String(y.fiscalYear).padEnd(6)} ${String(c).padStart(3)}/${String(f).padEnd(3)} ` +
        `in row order  ${((c / f) * 100).toFixed(0).padStart(3)}%` +
        (e ? `   +${e} elsewhere in the statement` : '')
    );
    if (VERBOSE)
      for (const r of rows)
        if (r.uncorroborated.length)
          console.log(
            `         ${indicatorBy(r.indicator).label}: ${r.uncorroborated.join(', ')}`
          );

    report.years.push({
      fiscalYear: y.fiscalYear,
      docId: y.docId,
      pages: pagesFor(y.docId),
      figures: f,
      corroborated: c,
      rows,
    });
  }

  const elsewhere = report.years.reduce(
    (a, y) => a + y.rows.reduce((b, r) => b + r.seenElsewhere.length, 0),
    0
  );
  report.figures = total;
  report.corroborated = seen;
  report.seenElsewhere = elsewhere;
  report.zeroMisses = zeroMisses;
  report.rate = total ? seen / total : 0;

  await writeFile(
    path.join(OUT, 'corroboration.json'),
    `${JSON.stringify(report, null, 2)}\n`
  );
  console.log(
    `\n${seen} of ${total} published figures (${((seen / total) * 100).toFixed(1)}%) ` +
      `appear in the OCR of their own row, in column order` +
      (elsewhere ? `, and ${elsewhere} more elsewhere in the statement` : '') +
      '.'
  );
  console.log(
    `${zeroMisses} of the ${total - seen - elsewhere} remaining are the digit 0, which Vision drops ` +
      `from these scans more often than it reads it.`
  );
  console.log(
    'A figure OCR missed is not a figure that is wrong. Pass --verbose to list them.'
  );
}

await main();
