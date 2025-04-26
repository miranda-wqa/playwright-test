const fs = require("fs");
const path = require("path");

// Environment variable passed from workflow
const REPORT_DIR = process.env.REPORT_DIR;

const ghPagesPath = path.join(__dirname, "..", "gh-pages");
const templatePath = path.join(__dirname, "..", "resources", "report-design.html");
const outputPath = path.join(ghPagesPath, "index.html");

const template = fs.readFileSync(templatePath, "utf-8");

const allDirs = fs
  .readdirSync(ghPagesPath, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.match(/^20/))
  .map((d) => d.name)
  .sort((a, b) => b.localeCompare(a)); // Descending

let reportItems = "";

// Latest run
const now = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/New_York"
}).format(new Date());
reportItems += `<li class="latest"><a href="./${REPORT_DIR}/index.html">Run: ${REPORT_DIR} <span class="date">Generated on ${now}</span></a></li>`;

// Older runs
for (const dir of allDirs) {
  if (dir !== REPORT_DIR) {
    
    reportItems += `<li><a href="./${dir}/index.html">Run: ${dir} <span class="date">Generated on ${dir}</span></a></li>`;
  }
}

// Replace placeholder
const finalHtml = template.replace("<!-- REPORT_ITEMS -->", reportItems);
fs.writeFileSync(outputPath, finalHtml, "utf-8");
