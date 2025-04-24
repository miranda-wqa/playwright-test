import * as fs from 'fs';

interface TestResult {
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
}

interface Test {
  results: TestResult[];
}

interface Spec {
  tests: Test[];
}

interface Suite {
  suites?: Suite[];
  specs?: Spec[];
}

interface Report {
  suites: Suite[];
}

const results: Report = JSON.parse(
  fs.readFileSync('test-reports/playwright-report.json', 'utf-8')
);

const stats = {
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
};

function parseSuites(suites: Suite[]): void {
  for (const suite of suites) {
    if (suite.suites) {
      parseSuites(suite.suites);
    }

    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          for (const run of test.results) {
            stats.duration += run.duration || 0;
            if (run.status === 'passed') stats.passed++;
            else if (run.status === 'skipped') stats.skipped++;
            else stats.failed++;
          }
        }
      }
    }
  }
}

parseSuites(results.suites);

const totalTests = stats.passed + stats.failed + stats.skipped;
const seconds = (stats.duration / 1000).toFixed(2);
const resultSymbol = stats.failed > 0 ? '🔴' : '🟢';

const html = `
<h2>Playwright Test Run Summary</h2>
<table>
  <tr>
    <th>Results</th>
    <th>Tests 📝</th>
    <th>Passed ✅</th>
    <th>Failed ❌</th>
    <th>Skipped ⏭️</th>
    <th>Duration ⏱️</th>
  </tr>
  <tr>
    <td style="font-size: 1.5rem;">${resultSymbol}</td>
    <td>${totalTests}</td>
    <td>${stats.passed}</td>
    <td>${stats.failed}</td>
    <td>${stats.skipped}</td>
    <td>${seconds}s</td>
  </tr>
</table>
`;

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  fs.appendFileSync(summaryPath, html);
} else {
  console.error('GITHUB_STEP_SUMMARY environment variable not set.');
}
