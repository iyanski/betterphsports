/**
 * Every published BAR No. 1 row, checked against the form's own arithmetic.
 *
 * Three identities live on that form:
 *
 *   column 7  = columns 3..6      (the quarterly targets add to the annual one)
 *   column 12 = columns 8..11     (the quarterly accomplishments add to theirs)
 *   column 13 = column 12 - column 7          (the variance is that difference)
 *
 * Rows the form marks "ave." fold by mean rather than by sum, because a head
 * count that exists all year cannot be added up quarter by quarter.
 *
 * This suite is the inverse of budget.test.mjs. There, a row that does not
 * balance is not published. Here the failures ARE the subject: the page is
 * about an agency marking its own homework, and several rows do not add up.
 * So the test does not demand that every identity hold — it demands that the
 * set of identities which FAIL is exactly the set declared in delivery.ts.
 *
 * A transcription slip therefore fails the run twice over: as an anomaly that
 * was not declared, or as a declared anomaly that has silently gone away.
 *
 * Usage:  node scripts/psc-data/delivery.test.mjs
 */
import {
  years,
  indicatorBy,
  quartersFold,
  identityChecks,
  varianceIsCheckable,
} from '../../src/data/psc/delivery.ts';

/** The printed annual figure on an "ave." row is rounded to a whole person. */
const AVG_TOLERANCE = 1;

const fmt = n =>
  n === null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: 2 });

let checks = 0;
const failures = [];
/** `${fy}:${indicator}:${kind}` for every identity that actually fails. */
const found = new Set();

for (const y of years) {
  for (const row of y.rows) {
    const def = indicatorBy(row.indicator);
    const id = `FY${y.fiscalYear} ${def.label}`;
    const key = kind => `${y.fiscalYear}:${row.indicator}:${kind}`;

    const holds = (a, b) =>
      Math.abs(a - b) <= (def.average ? AVG_TOLERANCE : 0);

    // 1. Quarterly targets against the annual target.
    //
    // An "ave." row is allowed to fold either way, and which way it folds has
    // changed over the years: up to FY2021 the agency wrote four quarterly
    // shares that sum to the annual average, and from FY2022 it writes the
    // annual average four times. Both are self-consistent; neither is wrong.
    const tf = quartersFold(row.targetQuarters, false);
    if (tf !== null && row.target !== null) {
      checks++;
      const mean = tf / row.targetQuarters.length;
      const ok = def.average
        ? holds(tf, row.target) || holds(mean, row.target)
        : tf === row.target;
      if (!ok) {
        found.add(key('target-quarters'));
        failures.push(
          `${id}: target quarters fold to ${fmt(def.average ? mean : tf)}, ` +
            `printed ${fmt(row.target)}`
        );
      }
    }

    // 2. Quarterly accomplishments against the annual accomplishment.
    const af = quartersFold(row.accomplishmentQuarters, def.average);
    if (af !== null && row.accomplishment !== null) {
      checks++;
      if (!holds(af, row.accomplishment)) {
        found.add(key('accomplishment-quarters'));
        failures.push(
          `${id}: accomplishment quarters fold to ${fmt(af)}, ` +
            `printed ${fmt(row.accomplishment)}`
        );
      }
    }

    // 3. The variance against the subtraction it claims to be.
    //
    // FY2017's variance column is empty top to bottom -- the framework of the
    // day did not ask for one -- so there is nothing to check on those rows.
    if (varianceIsCheckable(y, row)) {
      checks++;
      const want = row.accomplishment - row.target;
      const got = row.variance;
      if (got === null || Math.abs(got - want) > 0.5) {
        found.add(key('variance'));
        failures.push(
          `${id}: variance printed ${got === null ? `"${row.varianceNote}"` : fmt(got)}, ` +
            `accomplishment minus target is ${fmt(want)}`
        );
      }
    }
  }
}

// ---------------------------------------------- declared against what happened

const declared = new Set();
for (const y of years)
  for (const row of y.rows)
    for (const kind of row.anomalies ?? [])
      declared.add(`${y.fiscalYear}:${row.indicator}:${kind}`);

const undeclared = [...found].filter(k => !declared.has(k));
const stale = [...declared].filter(k => !found.has(k));

const label = k => {
  const [fy, indicator, kind] = k.split(':');
  return `FY${fy} ${indicatorBy(indicator).label} — ${kind}`;
};

console.log(
  `${years.length} filings, ${years.reduce((a, y) => a + y.rows.length, 0)} rows, ` +
    `${checks} identities checked\n`
);

console.log(
  `${found.size} of them fail, and the agency's own figures are published as printed:`
);
for (const f of failures) console.log(`  ${f}`);

if (undeclared.length) {
  console.log(`\nNOT DECLARED in src/data/psc/delivery.ts:`);
  for (const k of undeclared) console.log(`  ${label(k)}`);
}
if (stale.length) {
  console.log(`\nDECLARED but no longer failing (was a figure edited?):`);
  for (const k of stale) console.log(`  ${label(k)}`);
}

// The page quotes how many checks there are to make. It reads that from the
// data module, and this run counted them independently; they have to agree.
const miscount = checks !== identityChecks;
if (miscount)
  console.log(
    `\nCOUNT MISMATCH: this run made ${checks} checks, delivery.ts reports ${identityChecks}.`
  );

const bad = undeclared.length + stale.length + (miscount ? 1 : 0);
console.log(
  bad
    ? `\n${bad} anomaly declaration${bad === 1 ? '' : 's'} out of step with the figures.`
    : `\nEvery failing identity is declared, and every declaration still fails.`
);
process.exit(bad ? 1 : 0);
