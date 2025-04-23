import fs from 'fs';
const results = JSON.parse(fs.readFileSync('test-reports/playwright-report.json', 'utf-8'));

const stats = {
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
};

interface TestResult {
    duration?: number;
    status: 'passed' | 'failed' | 'skipped';
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

function parseSuites(suites: Suite[] = []): void {
    for (const suite of suites) {
      // Recursively process nested suites
      if (suite.suites?.length) {
        parseSuites(suite.suites);
      }
  
      // Process specs within the suite
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          for (const run of test.results || []) {
            stats.duration += run.duration ?? 0;
  
            switch (run.status) {
              case 'passed':
                stats.passed++;
                break;
              case 'skipped':
                stats.skipped++;
                break;
              default:
                stats.failed++;
            }
          }
        }
      }
    }
  }

parseSuites(results.suites);

const totalTests = stats.passed + stats.failed + stats.skipped;
const seconds = (stats.duration / 1000).toFixed(2);

// Determine the result symbol
const resultSymbol = stats.failed > 0 ? '🔴' : '🟢';

const html = `
<h2>Playwright Results</h2>
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

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, html);
} else {
  console.error('GITHUB_STEP_SUMMARY environment variable is not defined.');
}
