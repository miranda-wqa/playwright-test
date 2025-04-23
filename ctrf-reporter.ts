import { FullResult, Reporter, TestCase, TestResult, Suite, FullConfig } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

interface CtrfTestResult {
  name: string;
  status: string;
  duration: number;
  error: string | null;
  startTime: Date;
  endTime: Date;
}

interface CtrfReport {
  version: string;
  tests: CtrfTestResult[];
}

class CtrfReporter implements Reporter {
  private report: CtrfReport = {
    version: '1.0',
    tests: []
  };

  onBegin(config: FullConfig, suite: Suite) {
    // Initialize report
    this.report = {
      version: '1.0',
      tests: []
    };
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.report.tests.push({
      name: test.title,
      status: result.status,
      duration: result.duration,
      error: result.error?.message ?? null,
      startTime: result.startTime,
      endTime: new Date(result.startTime.getTime() + result.duration),
    });
  }

  async onEnd(result: FullResult) {
    const outputDir = 'test-reports';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'ctrf-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.report, null, 2));
    console.log(`✅ CTRF report written to: ${outputPath}`);
  }
}

export default CtrfReporter;