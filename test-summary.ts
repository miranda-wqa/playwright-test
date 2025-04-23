const fs = require('fs');
const results = JSON.parse(fs.readFileSync('test-reports/playwright-report.json', 'utf-8'));

const stats = {
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
};

for (const result of results.suites.flatMap(s => s.suites || [])) {
  for (const test of result.specs.flatMap(s => s.tests)) {
    for (const run of test.results) {
      stats.duration += run.duration;
      if (run.status === 'passed') stats.passed++;
      else if (run.status === 'skipped') stats.skipped++;
      else stats.failed++;
    }
  }
}

const seconds = (stats.duration / 1000).toFixed(2);

const html = `
<h2>Playwright Results</h2>
<table>
  <tr>
    <th>Passed ✅</th>
    <th>Failed ❌</th>
    <th>Skipped ↩️</th>
    <th>Duration ⏱️</th>
  </tr>
  <tr>
    <td>${stats.passed}</td>
    <td>${stats.failed}</td>
    <td>${stats.skipped}</td>
    <td>${seconds}s</td>
  </tr>
</table>
`;

fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, html);
