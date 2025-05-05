const fs = require("fs");
const path = require("path");

// Environment variable passed from workflow
const REPORT_DIR = process.env.REPORT_DIR;

if (!REPORT_DIR) {
  console.error("ERROR: REPORT_DIR environment variable not set!");
  process.exit(1);
}

const pagesPath = path.join(__dirname, "..", "public");
const templatePath = path.join(__dirname, "..", "resources", "report-design.html");
const outputPath = path.join(pagesPath, "index.html");

// Ensure public directory exists
if (!fs.existsSync(pagesPath)) {
  fs.mkdirSync(pagesPath, { recursive: true });
}

const template = fs.readFileSync(templatePath, "utf-8");

// Date formatter function
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

function formatDirectoryDate(dirName) {
  // Try to match format: YYYY-MM-DD_HH-MM-SS_runid
  let match = dirName.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})(?:_\d+)?$/);
  
  if (!match) {
    // Try alternative format: YYYY-MM-DD_HH-MM-SS (without run ID)
    match = dirName.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})$/);
  }
  
  if (!match) {
    // Try shorter format: YYYY-MM-DD_HH-MM
    match = dirName.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})$/);
  }
  
  if (match) {
    const [_, year, month, day, hour, minute, second = 0] = match;
    // Create date string in ISO format and explicitly set timezone
    const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second || '00'}-04:00`;
    const date = new Date(dateString);
    return formatDate(date);
  }
  
  // Fallback if directory name doesn't match any expected format
  return dirName;
}

// Get all existing report directories - EXCLUDING the newest one which might not exist yet
const allDirs = fs
  .readdirSync(pagesPath, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.match(/^20/) && d.name !== REPORT_DIR)
  .map((d) => d.name)
  .sort((a, b) => b.localeCompare(a)); // Descending

// Build the HTML for report items
let reportItems = "";

// Critical change: Always add the current REPORT_DIR as the latest, regardless of
// whether it exists on disk yet (it will by the time the page is viewed)
const now = formatDate(new Date());
reportItems += `<li class="latest"><a href="./${REPORT_DIR}/index.html">Run: ${REPORT_DIR} <span class="date">Generated on ${now}</span></a></li>`;

// Add all other reports
for (const dir of allDirs) {
  const formattedDate = formatDirectoryDate(dir);
  reportItems += `<li><a href="./${dir}/index.html">Run: ${dir} <span class="date">Generated on ${formattedDate}</span></a></li>`;
}

// Replace placeholder
const finalHtml = template.replace("<!-- REPORT_ITEMS -->", reportItems);
fs.writeFileSync(outputPath, finalHtml, "utf-8");

console.log(`Generated index.html with latest report (${REPORT_DIR}) and ${allDirs.length} previous reports.`);
