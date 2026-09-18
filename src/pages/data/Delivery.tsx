import { Link } from 'react-router';
import SEO from '../../components/SEO';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import StoryHero from '../../components/story/StoryHero';
import SectionHeading from '../../components/story/SectionHeading';
import Note from '../../components/story/Note';
import SourceNote from '../../components/story/SourceNote';
import TrendChart from '../../components/charts/TrendChart';
import ColumnChart from '../../components/charts/ColumnChart';
import StackedColumns from '../../components/charts/StackedColumns';
import GroupedBars from '../../components/charts/GroupedBars';
import ChartLegend from '../../components/charts/ChartLegend';
import DataTable from '../../components/charts/DataTable';
import { MONEY, SERIES, fmt } from '../../components/charts/chartKit';
import {
  years,
  fullYears,
  indicators,
  indicatorBy,
  rowOf,
  byYear,
  attainment,
  computedVariance,
  quartersFold,
  reportedRows,
  atOrAboveTarget,
  belowTarget,
  q4Only,
  anomalies,
  identityChecks,
  longestUnchangedRun,
  source,
  type DeliveryRow,
  type IndicatorKey,
} from '../../data/psc/delivery';

/** Years with a reported accomplishment. FY2026 has targets and half a year. */
const reportedYears = fullYears;
const firstYear = years[0].fiscalYear;
const lastYear = years[years.length - 1].fiscalYear;

const frozen = longestUnchangedRun('sportsForAll');
const frozenFrom = frozen.years[0];
const frozenTo = frozen.years[frozen.years.length - 1];

/** Targets that did not move once across the frozen run. */
const alsoFrozen = indicators.filter(i => {
  const run = longestUnchangedRun(i.key);
  return i.key !== 'sportsForAll' && run.years.length >= frozen.years.length;
});

/** Small counts read better spelled out, and every count here is small. */
const WORDS = [
  'no',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];
const word = (n: number) => WORDS[n] ?? String(n);
const Word = (n: number) => `${word(n)[0].toUpperCase()}${word(n).slice(1)}`;

const met = atOrAboveTarget.length;
const reported = reportedRows.length;

const recent = reportedRows.filter(r => r.year.fiscalYear >= 2022);
const recentMet = recent.filter(r => (attainment(r.row) ?? 0) >= 100);
/** Of the rows reported below target, the share that are FY2020 or FY2021. */
const pandemicShortfalls = belowTarget.filter(r =>
  [2020, 2021].includes(r.year.fiscalYear)
);

/** The single best reported result against target, across the decade. */
const best = reportedRows.reduce((a, b) =>
  (attainment(a.row) ?? 0) >= (attainment(b.row) ?? 0) ? a : b
);
const bestPct = attainment(best.row)!;
/** Percentages this large need a thousands separator like any other number. */
const bestPctLabel = `${fmt(Math.round(bestPct))}%`;

/** Indicator-years reported at or above target, counted per year. */
const metPerYear = reportedYears.map(y => ({
  key: y.fiscalYear,
  label: String(y.fiscalYear).slice(2),
  value: y.rows.filter(r => (attainment(r) ?? 0) >= 100).length,
  of: y.rows.filter(r => r.target !== null && r.accomplishment !== null).length,
}));

const sfa = (fy: number) => rowOf(fy, 'sportsForAll')!;
const grassroots = (fy: number) => rowOf(fy, 'grassroots')!;

/** Years where the grassroots row is zero, zero, zero, then the whole year. */
const grassrootsQ4Only = q4Only.filter(r => r.row.indicator === 'grassroots');

/** Q1–Q3 against Q4, for the rows where the split is the whole point. */
const q4Split = reportedYears.map(y => {
  const r = grassroots(y.fiscalYear);
  const q = r.accomplishmentQuarters;
  const early = q
    .slice(0, 3)
    .reduce<number | null>(
      (a, v) => (a === null || v === null ? null : a + v),
      0
    );
  return {
    label: String(y.fiscalYear).slice(2),
    values: { early, late: q[3] },
  };
});

/**
 * The pandemic rows, as a share of their own target.
 *
 * Grassroots athletes and Sports-for-All participants differ by three orders of
 * magnitude, so a shared scale in raw counts would draw the LGU row as nothing
 * at all. Per cent of target is the comparison the section is making anyway.
 */
const pandemicRows = [2020, 2021].flatMap(fy =>
  byYear(fy)!
    .rows.filter(
      r => r.indicator !== 'athletesSupported' && r.indicator !== 'events'
    )
    .map(r => ({
      label: `FY${fy} · ${indicatorBy(r.indicator).label}`,
      values: { target: 100, reported: attainment(r) },
    }))
);

const fy2020 = byYear(2020)!;
const fy2026 = byYear(2026)!;

/** The four quotations the page uses, kept beside the year they come from. */
const quoted = [
  { fy: 2020, key: 'grassroots' as IndicatorKey },
  { fy: 2021, key: 'lgus' as IndicatorKey },
  { fy: 2022, key: 'grassroots' as IndicatorKey },
  { fy: 2018, key: 'grassroots' as IndicatorKey },
].map(q => ({ ...q, row: rowOf(q.fy, q.key)! }));

/** What each declared anomaly says, in the form's terms and in arithmetic. */
const anomalyTable = anomalies.flatMap(a =>
  a.kinds.map(kind => {
    const row = a.row;
    const def = indicatorBy(a.indicator);
    const printed =
      kind === 'variance'
        ? row.variance === null
          ? `“${row.varianceNote}”`
          : fmt(row.variance)
        : kind === 'target-quarters'
          ? fmt(row.target!)
          : fmt(row.accomplishment!);
    const implied =
      kind === 'variance'
        ? fmt(computedVariance(row)!)
        : kind === 'target-quarters'
          ? fmt(quartersFold(row.targetQuarters, false)!)
          : fmt(quartersFold(row.accomplishmentQuarters, !!def.average)!);
    return {
      id: `${a.fiscalYear}-${a.indicator}-${kind}`,
      fiscalYear: a.fiscalYear,
      indicator: def.label,
      column:
        kind === 'variance'
          ? 'Variance'
          : kind === 'target-quarters'
            ? 'Annual target'
            : 'Annual accomplishment',
      printed,
      implied,
    };
  })
);

/** Every published row, flattened for the table at the foot of the page. */
interface TableRow {
  fiscalYear: number;
  through: 'Q2' | 'Q4';
  indicator: string;
  row: DeliveryRow;
}
const tableRows: TableRow[] = years.flatMap(y =>
  y.rows.map(r => ({
    fiscalYear: y.fiscalYear,
    through: y.through,
    indicator: indicatorBy(r.indicator).label,
    row: r,
  }))
);

const pct = (n: number | null) => (n === null ? '—' : `${n.toFixed(0)}%`);

export default function Delivery() {
  return (
    <>
      <SEO
        title="Promised, and delivered"
        description="Philippine Sports Commission physical targets against reported accomplishment, FY2017–FY2026, read from the agency's own quarterly BAR No. 1 reports."
        keywords="PSC targets, BAR No. 1, physical report of operation, performance, accountability"
      />

      <main className="flex-grow">
        <StoryHero
          eyebrow="From the PSC's own quarterly BAR No. 1 filings"
          title="Promised, and delivered"
          stats={[
            {
              value: `${met} of ${reported}`,
              label: 'targets it reports meeting',
            },
            {
              value: `${frozen.years.length} years`,
              label: 'the same target, unchanged',
            },
            { value: bestPctLabel, label: 'best result against target' },
            { value: `${firstYear}–${lastYear}`, label: 'years on record' },
          ]}
        >
          <p>
            BAR No. 1 is where the agency sets its own targets and marks its own
            homework. Read ten years of it together and the pattern shows.
          </p>
        </StoryHero>

        <div className="container mx-auto px-4">
          <Breadcrumbs
            className="py-6"
            items={[
              { label: 'Home', href: '/' },
              { label: 'Data', href: '/data' },
              { label: 'Promised vs delivered' },
            ]}
          />
        </div>

        {/* 01 */}
        <section className="border-b border-gray-200 bg-gray-50 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeading
              index="01"
              label="How the scoreboard works"
              title="One form, fourteen columns, one author."
            >
              <p>
                Every quarter the Philippine Sports Commission files a Physical
                Report of Operation. It writes what it{' '}
                <strong className="font-semibold text-gray-900">meant</strong>{' '}
                to do in each quarter, then what it{' '}
                <strong className="font-semibold text-gray-900">did</strong>,
                then the difference between them, then a sentence explaining it.
                Six indicators, three called outcomes and three called outputs.
                Nobody outside the agency supplies any part of it.
              </p>
            </SectionHeading>

            <div className="mt-10 max-w-3xl">
              <SourceNote
                methods={['ocr', 'ai-verified']}
                sources={[{ label: 'PSC Transparency Seal', url: source.url }]}
              >
                <p>
                  Ten scanned filings, no two of them the same page size. Every
                  figure here was read by machine from a 300 dpi render, then
                  read again from the page image, cell by cell, and reconciled.
                </p>
                <p>
                  Where the agency's own arithmetic does not hold, the figures
                  are published exactly as printed and{' '}
                  <a
                    href="#anomalies"
                    className="text-primary-700 underline underline-offset-2"
                  >
                    section 06
                  </a>{' '}
                  says where. Correcting them quietly would remove the finding.
                </p>
              </SourceNote>

              <Note>
                <strong className="font-semibold text-gray-900">
                  The framework changed in 2018, and the indicators changed with
                  it.
                </strong>{' '}
                FY2017 uses the older Major Final Output form, whose targets are
                written as “5% inc from 2014 (13,644)” and whose variance column
                is empty from top to bottom. It has no LGU indicator at all. The
                six numbered indicators start in FY2018 and have not changed
                since.
              </Note>
            </div>
          </div>
        </section>

        {/* 02 */}
        <section className="border-b border-gray-200 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeading
              index="02"
              label="The target that does not move"
              title={`${fmt(frozen.target!)}, ${word(frozen.years.length)} years running.`}
            >
              <p>
                From FY{frozenFrom} to FY{frozenTo} the PSC set itself the same
                Sports-for-All target — {fmt(frozen.target!)} Filipinos, split
                into the same four quarters — while what it actually reported
                ranged from {fmt(sfa(2020).accomplishment!)} to{' '}
                {fmt(sfa(2023).accomplishment!)}. A twenty-fold swing in
                delivery against a line that never moved.
              </p>
            </SectionHeading>

            <figure className="mt-10 max-w-4xl">
              <ChartLegend
                items={[
                  { label: 'Target', color: MONEY.target },
                  { label: 'Reported', color: MONEY.actual },
                ]}
              />
              <TrendChart
                ariaLabel="PSC Sports-for-All participation target against reported accomplishment, FY2017 to FY2025"
                height={300}
                markMissing={false}
                series={[
                  {
                    key: 'target',
                    label: 'Target',
                    color: MONEY.target,
                    points: reportedYears.map(y => ({
                      x: y.fiscalYear,
                      y: sfa(y.fiscalYear).target,
                    })),
                  },
                  {
                    key: 'reported',
                    label: 'Reported',
                    color: MONEY.actual,
                    points: reportedYears.map(y => ({
                      x: y.fiscalYear,
                      y: sfa(y.fiscalYear).accomplishment,
                    })),
                  },
                ]}
              />
              <figcaption className="mt-3 max-w-3xl text-sm text-gray-500">
                Number of Filipinos participating in Sports-for-All activities.
                FY2026 is omitted: it reports two quarters and no annual figure.
              </figcaption>
            </figure>

            <div className="mt-10 max-w-3xl">
              <p className="text-lg leading-relaxed text-gray-600">
                It is not one indicator. {Word(alsoFrozen.length)} of the other
                five sat at exactly the same number for the same{' '}
                {word(frozen.years.length)} years:{' '}
                {alsoFrozen
                  .map(i => {
                    const run = longestUnchangedRun(i.key);
                    return `${fmt(run.target!)} ${i.unit}`;
                  })
                  .join(', ')}
                . The FY{frozenTo} target sheet and the FY{frozenFrom} target
                sheet are, for those rows, the same sheet.
              </p>
            </div>

            <div className="mt-10 max-w-4xl">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400">
                The target sheet, year by year
              </h3>
              <DataTable<{ fiscalYear: number }>
                caption="PSC physical targets by indicator and fiscal year, FY2017 to FY2026"
                rows={years.map(y => ({ fiscalYear: y.fiscalYear }))}
                rowKey={r => String(r.fiscalYear)}
                columns={[
                  {
                    key: 'fiscalYear',
                    label: 'FY',
                    align: 'left',
                    render: r => String(r.fiscalYear),
                  },
                  ...indicators.map(i => ({
                    key: i.key,
                    label: i.label,
                    align: 'right' as const,
                    render: (r: { fiscalYear: number }) => {
                      const row = rowOf(r.fiscalYear, i.key);
                      const prev = rowOf(r.fiscalYear - 1, i.key);
                      if (!row || row.target === null) return '—';
                      const same = prev && prev.target === row.target;
                      return (
                        <span className={same ? 'text-gray-300' : undefined}>
                          {fmt(row.target)}
                        </span>
                      );
                    },
                  })),
                ]}
              />
              <p className="mt-3 max-w-3xl text-sm text-gray-500">
                Greyed where the target is identical to the year before it.
              </p>
            </div>
          </div>
        </section>

        {/* 03 */}
        <section className="border-b border-gray-200 bg-gray-50 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeading
              index="03"
              label="The result"
              title="A target you cannot miss is not a target."
            >
              <p>
                Of {reported} indicator-years with a target and a reported
                result, the PSC reports meeting or beating{' '}
                <strong className="font-semibold text-gray-900">{met}</strong>.
                Since FY2022 it is {recentMet.length} of {recent.length}.{' '}
                {Word(belowTarget.length)} rows fall short across the decade,
                and {word(pandemicShortfalls.length)} of them are FY2020 and
                FY2021.
              </p>
            </SectionHeading>

            <figure className="mt-10 max-w-4xl">
              <ColumnChart
                data={metPerYear}
                color={MONEY.actual}
                ariaLabel="Number of indicators reported at or above target, by fiscal year"
                axisLabel="FISCAL YEAR"
                yFormat={n => n.toFixed(0)}
                tooltip={d =>
                  `FY${d.key} — ${d.value} of ${metPerYear.find(m => m.key === d.key)?.of} indicators reported at or above target`
                }
                domainMax={6}
                tickMode="data"
                labelEvery={1}
                height={240}
              />
              <figcaption className="mt-3 max-w-3xl text-sm text-gray-500">
                Six indicators a year from FY2018, so a full-height column is a
                year in which the agency reports meeting every one of them.
                FY2017 has five, under the older framework.
              </figcaption>
            </figure>

            <div className="mt-12 max-w-3xl">
              <p className="text-lg leading-relaxed text-gray-600">
                The clearest case is promotional events. The target has been 80
                a year since FY2020 — twenty a quarter. Here is what the agency
                reports holding against it.
              </p>
            </div>

            <figure className="mt-8 max-w-3xl">
              <ChartLegend
                items={[
                  { label: 'Target', color: MONEY.target },
                  { label: 'Reported', color: MONEY.actual },
                ]}
              />
              <GroupedBars
                rows={reportedYears.map(y => {
                  const r = rowOf(y.fiscalYear, 'events')!;
                  return {
                    label: `FY${y.fiscalYear}`,
                    values: { target: r.target, reported: r.accomplishment },
                  };
                })}
                series={[
                  { key: 'target', label: 'Target', color: MONEY.target },
                  { key: 'reported', label: 'Reported', color: MONEY.actual },
                ]}
                unit="events"
              />
              <figcaption className="mt-3 text-sm text-gray-500">
                Promotional events and activities held, against the target set
                for that year.
              </figcaption>
            </figure>

            <div className="mt-10 max-w-3xl">
              <Note>
                In FY{best.year.fiscalYear} the agency reported{' '}
                {fmt(best.row.accomplishment!)}{' '}
                {indicatorBy(best.row.indicator).unit} against a target of{' '}
                {fmt(best.row.target!)} — {bestPctLabel} of it — and left the
                target at {fmt(best.row.target!)} for the two years after.
                Beating a target by a factor of ten is not a performance
                finding. It is a target finding.
              </Note>
            </div>
          </div>
        </section>

        {/* 04 */}
        <section className="border-b border-gray-200 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeading
              index="04"
              label="When the work lands"
              title="Three quarters of nothing, then a year in December."
            >
              <p>
                The grassroots indicator counts athletes at the Philippine
                National Games and Batang Pinoy. In each of the last{' '}
                {word(grassrootsQ4Only.length)} complete years the agency
                reports zero for the first three quarters and the entire annual
                figure in the fourth.
              </p>
            </SectionHeading>

            <figure className="mt-10 max-w-4xl">
              <ChartLegend
                items={[
                  { label: 'First three quarters', color: SERIES.muted },
                  { label: 'Fourth quarter', color: MONEY.actual },
                ]}
              />
              <StackedColumns
                ariaLabel="Grassroots athletes reported, split between the first three quarters and the fourth, by fiscal year"
                groups={q4Split}
                series={[
                  {
                    key: 'early',
                    label: 'First three quarters',
                    color: SERIES.muted,
                  },
                  { key: 'late', label: 'Fourth quarter', color: MONEY.actual },
                ]}
                height={270}
              />
              <figcaption className="mt-3 max-w-3xl text-sm text-gray-500">
                FY2020 and FY2021 report nothing in any quarter. FY2018's
                quarters are printed as they appear and do not add to the annual
                figure beside them; see section 06.
              </figcaption>
            </figure>

            <div className="mt-10 max-w-3xl space-y-5 text-lg leading-relaxed text-gray-600">
              <p>
                The quarterly targets moved to match. Until FY2023 the agency
                divided the grassroots target into four equal quarters of 4,415.
                From FY2024 the early quarters are blank or zero and the target
                sits in the later ones — which is where the delivery had been
                all along.
              </p>
              <p>
                The same shape holds for LGUs sending delegates: zero, zero,
                zero, then the year's whole figure. Both indicators count
                attendance at national games that happen once, late, so the
                annual number is not wrong. But on those two rows the quarterly
                columns carry nothing: for four years running they have been
                filled with zeroes that mean “not yet”, in a column the form
                reads as “none”.
              </p>
            </div>
          </div>
        </section>

        {/* 05 */}
        <section className="border-b border-gray-200 bg-gray-50 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeading
              index="05"
              label="FY2020 and FY2021"
              title="The two years the form had to record a miss."
            >
              <p>
                Competitions stopped. Across both years the PSC reports zero
                grassroots athletes and zero LGUs — four rows, four zeroes — and{' '}
                {pct(attainment(sfa(2020)))} of its Sports-for-All target in
                FY2020.
              </p>
            </SectionHeading>

            <figure className="mt-10 max-w-3xl">
              <ChartLegend
                items={[
                  { label: 'Target', color: MONEY.target },
                  { label: 'Reported', color: MONEY.actual },
                ]}
              />
              <GroupedBars
                rows={pandemicRows}
                series={[
                  { key: 'target', label: 'Target', color: MONEY.target },
                  { key: 'reported', label: 'Reported', color: MONEY.actual },
                ]}
                scaleMax={100}
                format={n => `${n.toFixed(0)}%`}
                tooltip={(row, s) =>
                  `${row.label} — ${s.label} ${s.key === 'target' ? '100% by definition' : `${(row.values.reported ?? 0).toFixed(0)}% of it`}`
                }
              />
              <figcaption className="mt-3 text-sm text-gray-500">
                Each row as a share of its own target, so indicators counted in
                hundreds and in hundreds of thousands can sit on one scale. The
                two indicators left out are the ones that did not depend on
                competitions — promotional events and athletes supported — and
                both were reported above target in both years.
              </figcaption>
            </figure>

            <div className="mt-12 max-w-3xl">
              <p className="text-lg leading-relaxed text-gray-600">
                The remarks column is the only part of this form written in
                sentences, and it is where the agency explains itself. Four of
                them, verbatim, from across the decade:
              </p>

              <ul className="mt-7 space-y-6">
                {quoted.map(q => (
                  <li
                    key={`${q.fy}-${q.key}`}
                    className="border-l-2 border-primary-600 pl-5"
                  >
                    <p className="text-lg leading-relaxed text-gray-700">
                      “{q.row.remark}”
                    </p>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-400">
                      FY{q.fy} · {indicatorBy(q.key).label} ·{' '}
                      {fmt(q.row.accomplishment!)} against {fmt(q.row.target!)}
                    </p>
                  </li>
                ))}
              </ul>

              <Note>
                <strong className="font-semibold text-gray-900">
                  Note what FY{fy2020.fiscalYear} does not say.
                </strong>{' '}
                Two of its rows report zero against a target of{' '}
                {fmt(rowOf(2020, 'grassroots')!.target!)} and{' '}
                {fmt(rowOf(2020, 'lgus')!.target!)}. In the variance column, in
                both, the agency wrote “None”.
              </Note>
            </div>
          </div>
        </section>

        {/* 06 */}
        <section
          id="anomalies"
          className="border-b border-gray-200 py-14 md:py-20 scroll-mt-20"
        >
          <div className="container mx-auto px-4">
            <SectionHeading
              index="06"
              label="Where the arithmetic fails"
              title={`${Word(anomalyTable.length)} rows that do not add up.`}
            >
              <p>
                The form carries three identities: the quarterly targets add to
                the annual target, the quarterly results add to the annual
                result, and the variance is the second minus the first. Across{' '}
                {word(years.length)} filings there are {identityChecks} such
                checks to make. {Word(anomalyTable.length)} of them fail.
              </p>
            </SectionHeading>

            <div className="mt-10 max-w-4xl">
              <DataTable<(typeof anomalyTable)[number]>
                caption="Rows where the PSC's own figures do not satisfy the form's arithmetic"
                rows={anomalyTable}
                rowKey={r => r.id}
                columns={[
                  {
                    key: 'fiscalYear',
                    label: 'FY',
                    align: 'left',
                    render: r => String(r.fiscalYear),
                  },
                  { key: 'indicator', label: 'Indicator', align: 'left' },
                  { key: 'column', label: 'Column', align: 'left' },
                  {
                    key: 'printed',
                    label: 'As printed',
                    align: 'right',
                    render: r => r.printed,
                  },
                  {
                    key: 'implied',
                    label: 'Its own figures give',
                    align: 'right',
                    muted: true,
                    render: r => r.implied,
                  },
                ]}
              />
            </div>

            <div className="mt-10 max-w-3xl space-y-5 text-lg leading-relaxed text-gray-600">
              <p>
                Three of them are the variance column, and they matter more than
                the rest. In FY2020 two rows delivered nothing against targets
                of {fmt(rowOf(2020, 'grassroots')!.target!)} and{' '}
                {fmt(rowOf(2020, 'lgus')!.target!)}, and the variance says
                “None”. In FY2021 the LGU row delivered nothing against{' '}
                {fmt(rowOf(2021, 'lgus')!.target!)} and the variance says 0 —
                while the row directly above it, identically zero, correctly
                says {fmt(rowOf(2021, 'grassroots')!.variance!)}.
              </p>
              <p>
                A shortfall written as a nought is a target met. Anyone adding
                up that column, in the agency or above it, reads a year in which
                nothing happened as a year on plan.
              </p>
              <p>
                The rest are smaller and duller: four annual totals that do not
                match the quarters printed beside them, by 4, 20, 27 and 1; and
                FY2021's Sports-for-All target, written as {fmt(46087)} four
                times, which comes to {fmt(184348)} rather than the{' '}
                {fmt(sfa(2021).target!)} printed as its total. {fmt(46087)} is{' '}
                {fmt(46807)} with two digits swapped, and {fmt(46807)} is what
                the year before and the year after both say.
              </p>
            </div>

            <div className="mt-10 max-w-3xl">
              <Note>
                <strong className="font-semibold text-gray-900">
                  These are the agency's figures, not ours.
                </strong>{' '}
                Each of these rows was read from the page image at a
                magnification where the digits are unambiguous, then checked
                against an independent machine reading of the same scan, which
                is recorded in{' '}
                <code className="font-mono text-base">
                  data/derived/bar1/corroboration.json
                </code>
                . Where the two disagreed, the cell was read again at pixel
                scale. Check any of them against the original filing before
                citing it.
              </Note>
            </div>
          </div>
        </section>

        {/* 07 */}
        <section className="border-b border-gray-200 bg-gray-50 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeading
              index="07"
              label="The figures"
              title="Every row on this page."
            >
              <p>
                {Word(years.length)} filings, {tableRows.length} rows. A dash is
                a cell the form leaves blank: FY{fy2026.fiscalYear} covers two
                quarters and reports no annual figure, and FY{firstYear} has no
                variance column to fill in.
              </p>
            </SectionHeading>

            <div className="mt-10 max-w-5xl">
              <DataTable<TableRow>
                caption="PSC physical targets and reported accomplishment by indicator and fiscal year, FY2017 to FY2026"
                rows={tableRows}
                rowKey={r => `${r.fiscalYear}-${r.row.indicator}`}
                sortable
                sortParam="bar"
                columns={[
                  {
                    key: 'fiscalYear',
                    label: 'FY',
                    align: 'left',
                    render: r =>
                      r.through === 'Q2'
                        ? `${r.fiscalYear} (to Q2)`
                        : String(r.fiscalYear),
                  },
                  { key: 'indicator', label: 'Indicator', align: 'left' },
                  {
                    key: 'target',
                    label: 'Target',
                    align: 'right',
                    sortValue: r => r.row.target,
                    render: r =>
                      r.row.target === null ? '—' : fmt(r.row.target),
                  },
                  {
                    key: 'accomplishment',
                    label: 'Reported',
                    align: 'right',
                    sortValue: r => r.row.accomplishment,
                    render: r =>
                      r.row.accomplishment === null
                        ? '—'
                        : fmt(r.row.accomplishment),
                  },
                  {
                    key: 'attainment',
                    label: 'Of target',
                    align: 'right',
                    muted: true,
                    sortValue: r => attainment(r.row),
                    render: r => pct(attainment(r.row)),
                  },
                  {
                    key: 'variance',
                    label: 'Variance, as printed',
                    align: 'right',
                    sortValue: r => r.row.variance,
                    render: r =>
                      r.row.variance === null
                        ? r.row.varianceNote
                          ? `“${r.row.varianceNote}”`
                          : '—'
                        : fmt(r.row.variance),
                  },
                ]}
              />
            </div>

            <div className="mt-10 max-w-3xl rounded-sm border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">Source</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {source.publisher}, {source.form}, the 31 December filing for FY
                {source.firstYear}–FY2025 and the 30 June filing for FY
                {source.lastYear}, published on the agency's{' '}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 underline underline-offset-2 hover:text-primary-700"
                >
                  Transparency Seal
                </a>{' '}
                page. The filings for FY{source.missingYears[0]}–FY
                {source.missingYears[source.missingYears.length - 1]} are listed
                there too, on a web host the agency retired; none of them
                resolve.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Remarks are quoted verbatim. Spelling and punctuation in them
                are the agency's.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Philippine government works are in the public domain under
                Section 176 of RA 8293. If a figure here is wrong, it is our
                error and not the agency's.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <Link
                  to="/data"
                  className="rounded-sm bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
                >
                  All data stories
                </Link>
                <Link
                  to="/data/budget"
                  className="rounded-sm border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:border-gray-400"
                >
                  Ten years of money
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
