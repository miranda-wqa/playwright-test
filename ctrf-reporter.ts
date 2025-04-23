import {
    FullResult,
    Reporter,
    TestCase,
    TestResult,
    Suite,
    FullConfig
  } from '@playwright/test/reporter';
  import fs from 'fs';
  import path from 'path';
  
  interface CtrfTestResult {
    name: string;
    scope: string;
    description: string;
    classification: string;
    result: string;
    start: number;
    stop: number;
    attachments: any[];
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
      const start = result.startTime.getTime();
      const stop = start + result.duration;
  
      this.report.tests.push({
        name: test.title,
        scope: test.parent?.title || '', // Usually the file or suite name
        description: '',
        classification: '',
        result: result.status,
        start,
        stop,
        attachments: [] // You can push attachments here if needed
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