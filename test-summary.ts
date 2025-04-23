const fs = require('fs');

// Read report
const reportPath = 'test-reports/playwright-report.json';
const results = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

// Initialize stats
const stats = {
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
};

// Recursively parse test suites
function parseSuites(suites: Array<{ suites?: any[]; specs?: Array<{ tests?: Array<{ results?: Array<{ duration?: number; status?: string }> }> }> }> = []) {
  for (const suite of suites) {
    if (suite.suites?.length) parseSuites(suite.suites);

    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        for (const run of test.results || []) {
          stats.duration += run.duration || 0;

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

// Compute summary
const totalTests = stats.passed + stats.failed + stats.skipped;
const durationInSeconds = (stats.duration / 1000).toFixed(2);
const resultEmoji = stats.failed > 0 ? '🔴' : '🟢';

// Generate HTML summary
const html = `
<h2>🎭 Playwright Test Summary</h2>
<table>
  <tr>
    <th>Status</th>
    <th>Total 📝</th>
    <th>Passed ✅</th>
    <th>Failed ❌</th>
    <th>Skipped ⏭️</th>
    <th>Duration ⏱️</th>
  </tr>
  <tr>
    <td style="font-size: 1.5rem;">${resultEmoji}</td>
    <td>${totalTests}</td>
    <td>${stats.passed}</td>
    <td>${stats.failed}</td>
    <td>${stats.skipped}</td>
    <td>${durationInSeconds}s</td>
  </tr>
</table>
`;

// Output to GitHub Actions summary
fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, html);
