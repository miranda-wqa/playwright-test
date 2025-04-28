const fs = require("fs");
const path = require("path");

// Environment variable passed from workflow
const REPORT_DIR = process.env.REPORT_DIR;

const ghPagesPath = path.join(__dirname, "..", "gh-pages");
const templatePath = path.join(__dirname, "..", "resources", "report-design.html");
const outputPath = path.join(ghPagesPath, "index.html");

const template = fs.readFileSync(templatePath, "utf-8");

// Create a consistent date formatter function
function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York"
  }).format(date);
}

// Function to format directory date string to a nice readable date
function formatDirectoryDate(dirName) {
  // Extract date and time information from the directory name format: YYYY-MM-DD_HH-MM-SS_runid
  const match = dirName.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})_/);
  
  if (match) {
    const [_, year, month, day, hour, minute, second] = match;
    const date = new Date(year, month - 1, day, hour, minute, second);
    return formatDate(date);
  }
  
  // Fallback if directory name doesn't match expected format
  return dirName;
}

const allDirs = fs
  .readdirSync(ghPagesPath, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.match(/^20/))
  .map((d) => d.name)
  .sort((a, b) => b.localeCompare(a)); // Descending

let reportItems = "";

// Latest run
const now = formatDate(new Date());
reportItems += `<li class="latest"><a href="./${REPORT_DIR}/index.html">Run: ${REPORT_DIR} <span class="date">Generated on ${now}</span></a></li>`;

// Older runs
for (const dir of allDirs) {
  if (dir !== REPORT_DIR) {
    const formattedDate = formatDirectoryDate(dir);
    reportItems += `<li><a href="./${dir}/index.html">Run: ${dir} <span class="date">Generated on ${formattedDate}</span></a></li>`;
  }
}

// Replace placeholder
const finalHtml = template.replace("<!-- REPORT_ITEMS -->", reportItems);
fs.writeFileSync(outputPath, finalHtml, "utf-8");
