/**
 * Philippine Sports Commission — physical targets against reported
 * accomplishment, FY2017–FY2026.
 *
 * Source: the agency's own BAR No. 1 (Quarterly Physical Report of Operation),
 * filed with the budget department and published on its Transparency Seal page.
 * Each year here is the filing dated 31 December, which is cumulative for the
 * year; FY2026 is the 30 June filing and covers only two quarters.
 *
 * WHY IT STARTS AT 2017. The same reason the budget page does: the PSC's own
 * links for the FY2013–FY2016 filings point at `www.web.psc.gov.ph`, a host it
 * retired. Nothing before FY2017 resolves.
 *
 * WHAT IS ON THE FORM. Fourteen columns. The agency writes its physical target
 * for each quarter (columns 3–6) and their total (7), then what it accomplished
 * each quarter (8–11) and that total (12), then the variance (13) and a free
 * text remark (14). Nobody outside the agency supplies any of it.
 *
 * HOW THESE WERE READ. Machine-read from 300 dpi renders of the scans by Vision
 * OCR, then read again from the page images, cell by cell, and reconciled. The
 * two readings agree on every figure published here.
 *
 * WHAT IS NOT FIXED. Where the agency's own arithmetic does not hold — a column
 * of quarters that does not add up to the total printed beside it, a variance
 * that is not the difference it claims to be — the figures are published as
 * printed and the row carries an `anomalies` entry saying so. Correcting them
 * would hide the finding. `scripts/psc-data/delivery.test.mjs` recomputes every
 * identity from these numbers and fails if a row's anomalies are not exactly
 * what is declared here, which is what stops a transcription slip from being
 * mistaken for an agency error.
 */

export type IndicatorKey =
  | 'grassroots'
  | 'sportsForAll'
  | 'competitions'
  | 'lgus'
  | 'events'
  | 'athletesSupported';

export interface IndicatorDef {
  key: IndicatorKey;
  /** Short label for charts and tables. */
  label: string;
  /** How the form words it, in the years that use the current wording. */
  formLabel: string;
  kind: 'outcome' | 'output';
  /** The noun being counted, for tooltips. */
  unit: string;
  /**
   * The annual figure is an average of the four quarters, not their sum. The
   * form marks these rows "ave." — a head count that exists at every moment of
   * the year cannot be added up quarter by quarter.
   */
  average?: boolean;
}

export const indicators: IndicatorDef[] = [
  {
    key: 'grassroots',
    label: 'Grassroots athletes',
    formLabel:
      'Number of grassroots athletes competing in the Philippine National Games and Batang Pinoy Games',
    kind: 'outcome',
    unit: 'athletes',
  },
  {
    key: 'sportsForAll',
    label: 'Sports-for-All participants',
    formLabel: 'Number of Filipinos participating in Sports-for-All activities',
    kind: 'outcome',
    unit: 'participants',
  },
  {
    key: 'competitions',
    label: 'Athletes in competition',
    formLabel:
      'Number of national athletes participating in international and national competitions',
    kind: 'outcome',
    unit: 'athletes',
  },
  {
    key: 'lgus',
    label: 'LGUs sending delegates',
    formLabel: 'Number of LGUs sending delegates in PSC competitions',
    kind: 'output',
    unit: 'LGUs',
  },
  {
    key: 'events',
    label: 'Promotional events',
    formLabel: 'Number of promotional events/activities held',
    kind: 'output',
    unit: 'events',
  },
  {
    key: 'athletesSupported',
    label: 'Athletes and coaches supported',
    formLabel: 'Number of national athletes and coaches supported',
    kind: 'output',
    unit: 'athletes and coaches',
    average: true,
  },
];

export const indicatorBy = (key: IndicatorKey) =>
  indicators.find(i => i.key === key)!;

/**
 * An identity on the form that the form's own figures do not satisfy.
 *
 * `target-quarters`      — columns 3–6 do not reconcile with column 7.
 * `accomplishment-quarters` — columns 8–11 do not reconcile with column 12.
 * `variance`             — column 13 is not column 12 minus column 7.
 */
export type Anomaly =
  'target-quarters' | 'accomplishment-quarters' | 'variance';

export interface DeliveryRow {
  indicator: IndicatorKey;
  /** Columns 3–6, exactly as printed. null is a blank cell, not a zero. */
  targetQuarters: (number | null)[];
  /** Column 7, as printed. */
  target: number | null;
  /** Columns 8–11, exactly as printed. */
  accomplishmentQuarters: (number | null)[];
  /** Column 12, as printed. */
  accomplishment: number | null;
  /** Column 13, when the agency wrote a number there. */
  variance: number | null;
  /** Column 13 verbatim when what it holds is a word rather than a number. */
  varianceNote?: string;
  /** Column 14, verbatim. Spelling and punctuation are the agency's. */
  remark?: string;
  /** Identities the printed figures fail. Asserted by the test, not inferred. */
  anomalies?: Anomaly[];
}

export interface DeliveryYear {
  fiscalYear: number;
  /** The quarter the filing covers. 'Q2' is half a year and not comparable. */
  through: 'Q2' | 'Q4';
  docId: string;
  /**
   * 'mfo'   — the old Major Final Output form: targets written as a percentage
   *           increase on a 2014 baseline, no variance column filled in.
   * 'prexc' — the programme-expenditure form in use since FY2018: six numbered
   *           indicators, three outcome and three output.
   */
  framework: 'mfo' | 'prexc';
  rows: DeliveryRow[];
}

export const years: DeliveryYear[] = [
  {
    fiscalYear: 2017,
    through: 'Q4',
    docId: 'bar1-2017-q4',
    framework: 'mfo',
    // The FY2017 form has no quarterly targets and an empty variance column.
    // Its targets are written as "5% inc from 2014 (13,644)"; the same filing
    // restates each one as a number on its second page, and those numbers are
    // what is carried here. There is no LGU indicator in this framework.
    rows: [
      {
        indicator: 'grassroots',
        targetQuarters: [null, null, null, null],
        target: 14326,
        accomplishmentQuarters: [4000, 5000, 9597, 6846],
        accomplishment: 25443,
        variance: null,
      },
      {
        indicator: 'sportsForAll',
        targetQuarters: [null, null, null, null],
        target: 80692,
        accomplishmentQuarters: [21200, 22260, 31318, 33318],
        accomplishment: 108096,
        variance: null,
      },
      {
        indicator: 'competitions',
        targetQuarters: [null, null, null, null],
        target: 238,
        accomplishmentQuarters: [350, 517, 409, 217],
        accomplishment: 1493,
        variance: null,
      },
      {
        indicator: 'events',
        targetQuarters: [null, null, null, null],
        target: 29,
        accomplishmentQuarters: [18, 11, 12, 14],
        accomplishment: 55,
        variance: null,
      },
      {
        indicator: 'athletesSupported',
        targetQuarters: [null, null, null, null],
        target: 830,
        accomplishmentQuarters: [1033, 876, 956, 956],
        accomplishment: 955,
        variance: null,
      },
    ],
  },
  {
    fiscalYear: 2018,
    through: 'Q4',
    docId: 'bar1-2018-q4',
    framework: 'prexc',
    // FY2018 words the three outcome indicators as "Percentage increase in..."
    // and then reports head counts under them. The wording is fixed in FY2019.
    rows: [
      {
        indicator: 'grassroots',
        targetQuarters: [9722, 9722, 7000, 0],
        target: 26444,
        accomplishmentQuarters: [2354, 3366, 4396, 5935],
        accomplishment: 16055,
        variance: -10389,
        remark:
          "BP Mindanao leg and PNG re-scheduled from 2017 to 2018 due to Marawi siege. As a result, schedules of 2018 Batang Pinoy legs and participation rate were affected. Re-verified participants' data reflected in Q4",
        // 2,354 + 3,366 + 4,396 + 5,935 = 16,051, not the 16,055 printed.
        anomalies: ['accomplishment-quarters'],
      },
      {
        indicator: 'sportsForAll',
        targetQuarters: [42474, 42474, 32995, 25000],
        target: 142943,
        accomplishmentQuarters: [19500, 10384, 17930, 122395],
        accomplishment: 170209,
        variance: 27266,
      },
      {
        indicator: 'competitions',
        targetQuarters: [477, 477, 337, 226],
        target: 1517,
        accomplishmentQuarters: [258, 214, 998, 212],
        accomplishment: 1709,
        variance: 192,
        // The four quarters come to 1,682. The variance is taken from 1,709.
        anomalies: ['accomplishment-quarters'],
      },
      {
        indicator: 'lgus',
        targetQuarters: [100, 100, 78, 0],
        target: 278,
        accomplishmentQuarters: [55, 99, 250, 38],
        accomplishment: 442,
        variance: 164,
      },
      {
        indicator: 'events',
        targetQuarters: [20, 25, 20, 10],
        target: 75,
        accomplishmentQuarters: [31, 48, 22, 14],
        accomplishment: 115,
        variance: 40,
        remark: 'Additional commitments with LGUs during Q4',
      },
      {
        indicator: 'athletesSupported',
        targetQuarters: [1033, 1033, 1033, 1033],
        target: 1033,
        accomplishmentQuarters: [1137, 1171, 1107, 1123],
        accomplishment: 1134,
        variance: 101,
      },
    ],
  },
  {
    fiscalYear: 2019,
    through: 'Q4',
    docId: 'bar1-2019-q4',
    framework: 'prexc',
    rows: [
      {
        indicator: 'grassroots',
        targetQuarters: [7870, 3935, null, 3954],
        target: 15759,
        accomplishmentQuarters: [11315, 0, 6270, 0],
        accomplishment: 17585,
        variance: 1826,
        remark: 'Increase of 11.59%',
      },
      {
        indicator: 'sportsForAll',
        targetQuarters: [22190, 22190, 22191, 22190],
        target: 88761,
        accomplishmentQuarters: [3601, 26844, 36456, 24183],
        accomplishment: 91084,
        variance: 2323,
        remark: 'Increase of 2.62%',
      },
      {
        indicator: 'competitions',
        targetQuarters: [62, 63, 63, 62],
        target: 250,
        accomplishmentQuarters: [173, 491, 410, 175],
        accomplishment: 1249,
        variance: 999,
        remark: 'Increase of 399.6%',
      },
      {
        indicator: 'lgus',
        targetQuarters: [151, 75, null, 76],
        target: 302,
        accomplishmentQuarters: [273, 54, 249, 0],
        accomplishment: 576,
        variance: 274,
        remark: 'Increase of 90.73%',
      },
      {
        indicator: 'events',
        targetQuarters: [11, 11, 10, null],
        target: 32,
        accomplishmentQuarters: [16, 8, 15, 7],
        accomplishment: 46,
        variance: 14,
        remark: 'Increase of 43.75%',
      },
      {
        indicator: 'athletesSupported',
        targetQuarters: [989, 989, 989, 989],
        target: 989,
        accomplishmentQuarters: [999, 1132, 1223, 1503],
        accomplishment: 1215,
        // 1,215 - 989 is 226, and the remark's own percentage is 226/989 to
        // two places. The variance cell says 228.
        variance: 228,
        remark: 'Increase of 22.85%',
        anomalies: ['variance'],
      },
    ],
  },
  {
    fiscalYear: 2020,
    through: 'Q4',
    docId: 'bar1-2020-q4',
    framework: 'prexc',
    rows: [
      {
        indicator: 'grassroots',
        targetQuarters: [4415, 4415, 4415, 4415],
        target: 17660,
        accomplishmentQuarters: [0, 0, 0, 0],
        accomplishment: 0,
        // The shortfall is the whole target. The form says "None".
        variance: null,
        varianceNote: 'None',
        remark: 'PNG and BP Games were cancelled due COVID-19 pandemic.',
        anomalies: ['variance'],
      },
      {
        indicator: 'sportsForAll',
        targetQuarters: [46807, 46807, 46808, 46808],
        target: 187230,
        accomplishmentQuarters: [1250, 7028, 2521, 1574],
        accomplishment: 12373,
        variance: -174857,
        remark:
          "Laro't Saya sa Parke (LSP), IP Games, Children's Games, Women in Sports Programs, and all other sports-for-all projects were cancelled due to COVID-19 pandemic. However, webinars and other virtual activities were offered.",
      },
      {
        indicator: 'competitions',
        targetQuarters: [448, 448, 449, 449],
        target: 1794,
        accomplishmentQuarters: [203, 0, 9, 5],
        accomplishment: 217,
        variance: -1577,
        remark:
          'International sports competitions were cancelled due to COVID-19 pandemic. Inputs in the 3rd and 4th quarters were international competitons done virtually, and the sports were played individually or not by team.',
      },
      {
        indicator: 'lgus',
        targetQuarters: [33, 33, 32, 32],
        target: 130,
        accomplishmentQuarters: [0, 0, 0, 0],
        accomplishment: 0,
        variance: null,
        varianceNote: 'None',
        remark:
          'PNG, BP Games and other local sports competitions were cancelled due COVID-19 pandemic.',
        anomalies: ['variance'],
      },
      {
        indicator: 'events',
        targetQuarters: [20, 20, 20, 20],
        target: 80,
        accomplishmentQuarters: [2, 15, 56, 72],
        accomplishment: 145,
        variance: 65,
        remark:
          'More sports promotional activities (webinars and virtual engagements) were offered to compensate on some cancelled programs and projects.',
      },
      {
        indicator: 'athletesSupported',
        // The target quarters are shares of 1,191; the accomplishment quarters
        // are head counts averaged into the total. Same row, two units.
        targetQuarters: [297, 298, 298, 298],
        target: 1191,
        accomplishmentQuarters: [1182, 1423, 1232, 1402],
        accomplishment: 1310,
        variance: 119,
        remark:
          'PSC continued to support the national athletes and coaches inspite of cancellation of international competitions.',
      },
    ],
  },
  {
    fiscalYear: 2021,
    through: 'Q4',
    docId: 'bar1-2021-q4',
    framework: 'prexc',
    rows: [
      {
        indicator: 'grassroots',
        targetQuarters: [4415, 4415, 4415, 4415],
        target: 17660,
        accomplishmentQuarters: [0, 0, 0, 0],
        accomplishment: 0,
        variance: -17660,
        remark:
          'All national/local competitions were suspended since March 2020 due to the pandemic.',
      },
      {
        indicator: 'sportsForAll',
        // 46,087 is 46,807 with two digits swapped. The total beside it is the
        // FY2020 total, unchanged, and does not follow from these quarters.
        targetQuarters: [46087, 46087, 46087, 46087],
        target: 187230,
        accomplishmentQuarters: [5970, 15453, 25893, 32169],
        accomplishment: 79485,
        variance: -107745,
        remark:
          'Lower by 107,745 due to the suspension/discontinuance of face-to-face sports activites because of the pandemic. Instead, various nationwide webinars and online trainings were offered by the PSC.',
        anomalies: ['target-quarters'],
      },
      {
        indicator: 'competitions',
        targetQuarters: [448, 448, 449, 449],
        target: 1794,
        accomplishmentQuarters: [5, 62, 501, 316],
        accomplishment: 884,
        variance: -910,
        remark:
          'Lower by 910 due to limited international competitions organized, and all national/local competitions were suspended because of the pandemic.',
      },
      {
        indicator: 'lgus',
        targetQuarters: [33, 33, 32, 32],
        target: 130,
        accomplishmentQuarters: [0, 0, 0, 0],
        accomplishment: 0,
        // Not left blank and not "None": the agency wrote a nought, which reads
        // as a target met. The row above it, identically zero, says -17,660.
        variance: 0,
        remark:
          'All national/local competitions were suspended since March 2020 due to the pandemic.',
        anomalies: ['variance'],
      },
      {
        indicator: 'events',
        targetQuarters: [20, 20, 20, 20],
        target: 80,
        accomplishmentQuarters: [74, 99, 223, 128],
        accomplishment: 524,
        variance: 444,
        remark: 'Higher to the target by 444.',
      },
      {
        indicator: 'athletesSupported',
        targetQuarters: [297, 298, 298, 298],
        target: 1191,
        accomplishmentQuarters: [1398, 1353, 1503, 1747],
        accomplishment: 1500,
        variance: 309,
        remark: 'Higher to the target by 309.',
      },
    ],
  },
  {
    fiscalYear: 2022,
    through: 'Q4',
    docId: 'bar1-2022-q4',
    framework: 'prexc',
    rows: [
      {
        indicator: 'grassroots',
        targetQuarters: [4415, 4415, 4415, 4415],
        target: 17660,
        accomplishmentQuarters: [0, 0, 0, 6037],
        accomplishment: 6037,
        variance: -11623,
        remark: 'Lower by 11,623 due to post-pandemic effect.',
      },
      {
        indicator: 'sportsForAll',
        targetQuarters: [46807, 46807, 46808, 46808],
        target: 187230,
        accomplishmentQuarters: [8308, 55614, 95555, 46678],
        accomplishment: 206155,
        variance: 18925,
        remark: 'Higher to the target by 18,925.',
      },
      {
        indicator: 'competitions',
        targetQuarters: [447, 449, 449, 449],
        target: 1794,
        accomplishmentQuarters: [85, 836, 372, 1314],
        accomplishment: 2607,
        variance: 813,
        remark: 'Higher to the target by 813.',
      },
      {
        indicator: 'lgus',
        targetQuarters: [33, 33, 32, 32],
        target: 130,
        accomplishmentQuarters: [0, 0, 0, 147],
        accomplishment: 147,
        variance: 17,
        remark: 'Higher to the target by 17.',
      },
      {
        indicator: 'events',
        targetQuarters: [20, 20, 20, 20],
        target: 80,
        accomplishmentQuarters: [81, 122, 75, 95],
        accomplishment: 373,
        variance: 293,
        remark: 'Higher to the target by 293.',
      },
      {
        indicator: 'athletesSupported',
        targetQuarters: [1191, 1191, 1191, 1191],
        target: 1191,
        accomplishmentQuarters: [1459, 1580, 1645, 1609],
        accomplishment: 1573,
        variance: 382,
        remark: 'Higher to the target average by 382.',
      },
    ],
  },
  {
    fiscalYear: 2023,
    through: 'Q4',
    docId: 'bar1-2023-q4',
    framework: 'prexc',
    rows: [
      {
        indicator: 'grassroots',
        targetQuarters: [4415, 4415, 4415, 4415],
        target: 17660,
        accomplishmentQuarters: [0, 0, 0, 19802],
        accomplishment: 19802,
        variance: 2142,
        remark: 'Higher by 2,142 from target.',
      },
      {
        indicator: 'sportsForAll',
        targetQuarters: [46807, 46807, 46808, 46808],
        target: 187230,
        accomplishmentQuarters: [72160, 77273, 58644, 53221],
        accomplishment: 261318,
        variance: 74088,
        remark: 'Higher by 74,088 from target.',
        // The quarters come to 261,298. The variance follows the total.
        anomalies: ['accomplishment-quarters'],
      },
      {
        indicator: 'competitions',
        targetQuarters: [449, 449, 448, 448],
        target: 1794,
        accomplishmentQuarters: [655, 1360, 1150, 528],
        accomplishment: 3693,
        variance: 1899,
        remark: 'Higher by 1,899 from target.',
      },
      {
        indicator: 'lgus',
        targetQuarters: [33, 33, 32, 32],
        target: 130,
        accomplishmentQuarters: [0, 0, 0, 184],
        accomplishment: 184,
        variance: 54,
        remark: 'Higher by 54 from target.',
      },
      {
        indicator: 'events',
        targetQuarters: [20, 20, 20, 20],
        target: 80,
        accomplishmentQuarters: [184, 283, 204, 216],
        accomplishment: 887,
        variance: 807,
        remark: 'Higher by 807 from target.',
      },
      {
        indicator: 'athletesSupported',
        targetQuarters: [1191, 1191, 1191, 1191],
        target: 1191,
        accomplishmentQuarters: [1396, 1578, 1641, 1644],
        accomplishment: 1565,
        variance: 374,
        remark: 'Higher by 374 from target average.',
      },
    ],
  },
  {
    fiscalYear: 2024,
    through: 'Q4',
    docId: 'bar1-2024',
    framework: 'prexc',
    rows: [
      {
        indicator: 'grassroots',
        // The only year the grassroots target is not 17,660: two quarters of
        // nothing, then half the usual number.
        targetQuarters: [0, 0, 4415, 4414],
        target: 8829,
        accomplishmentQuarters: [0, 0, 0, 12773],
        accomplishment: 12773,
        variance: 3944,
        remark: 'Higher by 3,944 from target.',
      },
      {
        indicator: 'sportsForAll',
        targetQuarters: [46807, 46807, 46808, 46808],
        target: 187230,
        accomplishmentQuarters: [23640, 45280, 74152, 82235],
        accomplishment: 225307,
        variance: 38077,
        remark: 'Higher by 38,077 from target.',
      },
      {
        indicator: 'competitions',
        targetQuarters: [448, 448, 449, 449],
        target: 1794,
        accomplishmentQuarters: [926, 907, 392, 799],
        accomplishment: 3024,
        variance: 1230,
        remark: 'Higher by 1,230 from target.',
      },
      {
        indicator: 'lgus',
        targetQuarters: [0, 0, 65, 65],
        target: 130,
        accomplishmentQuarters: [0, 0, 0, 171],
        accomplishment: 171,
        variance: 41,
        remark: 'Higher by 41 from target.',
      },
      {
        indicator: 'events',
        targetQuarters: [20, 20, 20, 20],
        target: 80,
        accomplishmentQuarters: [110, 236, 215, 259],
        accomplishment: 820,
        variance: 740,
        remark: 'Higher by 740 from target.',
      },
      {
        indicator: 'athletesSupported',
        targetQuarters: [1191, 1191, 1191, 1191],
        target: 1191,
        accomplishmentQuarters: [1147, 1652, 1666, 1743],
        accomplishment: 1552,
        variance: 361,
        remark: 'Higher by 361 from target average.',
      },
    ],
  },
  {
    fiscalYear: 2025,
    through: 'Q4',
    docId: 'bar1-2025-q4',
    framework: 'prexc',
    rows: [
      {
        indicator: 'grassroots',
        targetQuarters: [0, 0, 8830, 8830],
        target: 17660,
        accomplishmentQuarters: [0, 0, 0, 18596],
        accomplishment: 18596,
        variance: 936,
        remark: 'Higher by 936 from target',
      },
      {
        indicator: 'sportsForAll',
        targetQuarters: [46807, 46807, 46808, 46808],
        target: 187230,
        accomplishmentQuarters: [29999, 38805, 71341, 84731],
        accomplishment: 224876,
        variance: 37646,
        remark: 'Higher by 37,646 from target',
      },
      {
        indicator: 'competitions',
        // The first change to this target since FY2020.
        targetQuarters: [493, 493, 493, 494],
        target: 1973,
        accomplishmentQuarters: [256, 767, 1004, 1543],
        accomplishment: 3571,
        variance: 1598,
        remark: 'Higher by 1,598 from target',
        // The quarters come to 3,570. One out.
        anomalies: ['accomplishment-quarters'],
      },
      {
        indicator: 'lgus',
        targetQuarters: [0, 0, 65, 65],
        target: 130,
        accomplishmentQuarters: [0, 0, 0, 188],
        accomplishment: 188,
        variance: 58,
        remark: 'Higher by 58 from target.',
      },
      {
        indicator: 'events',
        targetQuarters: [20, 20, 20, 20],
        target: 80,
        accomplishmentQuarters: [141, 178, 160, 140],
        accomplishment: 619,
        variance: 539,
        remark: 'Higher by 539 from target',
      },
      {
        indicator: 'athletesSupported',
        targetQuarters: [1191, 1191, 1191, 1191],
        target: 1191,
        accomplishmentQuarters: [1547, 1667, 1851, 1947],
        accomplishment: 1753,
        variance: 562,
        remark: 'Higher by 562 from target average',
      },
    ],
  },
  {
    fiscalYear: 2026,
    through: 'Q2',
    docId: 'bar1-2026-q2',
    framework: 'prexc',
    // Half a year. Two quarters of accomplishment, no annual total, no variance
    // and no remarks — the columns are there and empty.
    rows: [
      {
        indicator: 'grassroots',
        targetQuarters: [null, 5887, 5887, 5886],
        target: 17660,
        accomplishmentQuarters: [0, 0, null, null],
        accomplishment: null,
        variance: null,
      },
      {
        indicator: 'sportsForAll',
        // The first move in this target in six years.
        targetQuarters: [52518, 52518, 52518, 52519],
        target: 210073,
        accomplishmentQuarters: [58455, 32240, null, null],
        accomplishment: null,
        variance: null,
      },
      {
        indicator: 'competitions',
        targetQuarters: [553, 553, 553, 554],
        target: 2213,
        accomplishmentQuarters: [503, 1166, null, null],
        accomplishment: null,
        variance: null,
      },
      {
        indicator: 'lgus',
        targetQuarters: [null, 79, 79, 79],
        target: 237,
        accomplishmentQuarters: [0, 0, null, null],
        accomplishment: null,
        variance: null,
      },
      {
        indicator: 'events',
        targetQuarters: [120, 120, 120, 120],
        target: 480,
        accomplishmentQuarters: [166, 286, null, null],
        accomplishment: null,
        variance: null,
      },
      {
        indicator: 'athletesSupported',
        targetQuarters: [1337, 1337, 1337, 1337],
        target: 1337,
        accomplishmentQuarters: [1773, 1804, null, null],
        accomplishment: null,
        variance: null,
      },
    ],
  },
];

// ----------------------------------------------------------------- selectors

/** Full fiscal years only. FY2026 covers half a year and reports no total. */
export const fullYears = years.filter(y => y.through === 'Q4');

export const byYear = (fy: number) => years.find(y => y.fiscalYear === fy);

export const rowOf = (fy: number, key: IndicatorKey) =>
  byYear(fy)?.rows.find(r => r.indicator === key);

/** Every (year, row) pair, flattened, for counting. */
export const allRows = years.flatMap(y =>
  y.rows.map(r => ({ year: y, row: r }))
);

/** Rows with both a target and a reported accomplishment. */
export const reportedRows = allRows.filter(
  ({ row }) => row.target !== null && row.accomplishment !== null
);

/** Accomplishment as a share of target, in per cent. */
export const attainment = (row: DeliveryRow) =>
  row.target && row.accomplishment !== null
    ? (row.accomplishment / row.target) * 100
    : null;

/** What the variance would be if it were the subtraction the column claims. */
export const computedVariance = (row: DeliveryRow) =>
  row.target !== null && row.accomplishment !== null
    ? row.accomplishment - row.target
    : null;

/**
 * How the quarters reconcile with the printed total.
 *
 * Sum for a count, mean for a row the form marks "ave.". Returns null when a
 * quarter is blank, because three quarters of a four-quarter year prove nothing.
 */
export function quartersFold(
  quarters: (number | null)[],
  average: boolean
): number | null {
  if (quarters.some(q => q === null)) return null;
  const qs = quarters as number[];
  const sum = qs.reduce((a, q) => a + q, 0);
  return average ? sum / qs.length : sum;
}

/**
 * Whether the variance cell is one the form asked for at all.
 *
 * FY2017's column 13 is empty from the first row to the last: the Major Final
 * Output form of the day did not carry a variance. An empty cell there is the
 * form working as designed, not the agency failing to subtract.
 */
export const varianceIsCheckable = (year: DeliveryYear, row: DeliveryRow) =>
  year.framework !== 'mfo' &&
  row.target !== null &&
  row.accomplishment !== null;

/**
 * How many of the form's identities can be checked at all.
 *
 * An identity with a blank cell in it is not a failed check, it is no check:
 * FY2017 prints no quarterly targets and no variance, FY2026 prints no annual
 * figure. The page quotes this count, and
 * `scripts/psc-data/delivery.test.mjs` counts the same way — if the two ever
 * disagree, one of them has been edited without the other.
 */
export const identityChecks = allRows.reduce((a, { year, row }) => {
  const average = !!indicatorBy(row.indicator).average;
  const target =
    quartersFold(row.targetQuarters, false) !== null && row.target !== null;
  const actual =
    quartersFold(row.accomplishmentQuarters, average) !== null &&
    row.accomplishment !== null;
  const variance = varianceIsCheckable(year, row);
  return a + Number(target) + Number(actual) + Number(variance);
}, 0);

/** Declared anomalies, as a flat list, newest year last. */
export const anomalies = allRows
  .filter(({ row }) => row.anomalies?.length)
  .map(({ year, row }) => ({
    fiscalYear: year.fiscalYear,
    indicator: row.indicator,
    kinds: row.anomalies!,
    row,
  }));

/** Indicator-years reported at or above the agency's own target. */
export const atOrAboveTarget = reportedRows.filter(
  ({ row }) => (attainment(row) ?? 0) >= 100
);

/** Indicator-years reported below it. */
export const belowTarget = reportedRows.filter(
  ({ row }) => (attainment(row) ?? 0) < 100
);

/**
 * The longest run of consecutive years in which an indicator's target did not
 * change at all, and the value it was stuck at.
 */
export function longestUnchangedRun(key: IndicatorKey) {
  let best = { years: [] as number[], target: null as number | null };
  let run: number[] = [];
  let value: number | null = null;

  for (const y of years) {
    const t = y.rows.find(r => r.indicator === key)?.target ?? null;
    if (t !== null && t === value) run.push(y.fiscalYear);
    else {
      run = t === null ? [] : [y.fiscalYear];
      value = t;
    }
    if (run.length > best.years.length)
      best = { years: [...run], target: value };
  }
  return best;
}

/** Rows whose entire year's delivery is reported in the fourth quarter. */
export const q4Only = allRows.filter(({ row }) => {
  const q = row.accomplishmentQuarters;
  if (q.some(v => v === null)) return false;
  const qs = q as number[];
  return qs[3] > 0 && qs[0] === 0 && qs[1] === 0 && qs[2] === 0;
});

export const source = {
  form: 'BAR No. 1 — Quarterly Physical Report of Operation',
  publisher: 'Philippine Sports Commission',
  page: 'Transparency Seal',
  url: 'https://psc.gov.ph/psc_site/transparency-seal/',
  firstYear: 2017,
  lastYear: 2026,
  /** Listed in the agency's index, on a host it retired. */
  missingYears: [2013, 2014, 2015, 2016],
  documents: years.length,
};
