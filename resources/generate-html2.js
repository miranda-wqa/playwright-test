const fs = require("fs");
const path = require("path");

// Environment variable passed from workflow
const REPORT_DIR = process.env.REPORT_DIR;

const pagesPath = path.join(__dirname, "..", "public"); // when using default GitHub pages on main branch
const templatePath = path.join(__dirname, "..", "resources", "report-design.html");
const outputPath = path.join(pagesPath, "index.html");

const template = fs.readFileSync(templatePath, "utf-8");

if (!fs.existsSync(pagesPath)) {
  fs.mkdirSync(pagesPath, { recursive: true });
}

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

// Get all directories in the pages path
const allDirs = fs
  .readdirSync(pagesPath, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.match(/^20/))
  .map((d) => d.name)
  .sort((a, b) => b.localeCompare(a)); // Descending

// Check if REPORT_DIR exists in the pagesPath
const reportDirExists = fs.existsSync(path.join(pagesPath, REPORT_DIR));
const reportDirInList = allDirs.includes(REPORT_DIR);

// Create an array with all directories, ensuring REPORT_DIR is first if it exists
let sortedDirs = [...allDirs];
if (reportDirExists && !reportDirInList) {
  sortedDirs.unshift(REPORT_DIR);
} else if (reportDirInList) {
  // If REPORT_DIR is in allDirs, make sure it's first
  sortedDirs = [REPORT_DIR, ...sortedDirs.filter(dir => dir !== REPORT_DIR)];
}

let reportItems = "";

// Generate HTML list items for all directories
for (let i = 0; i < sortedDirs.length; i++) {
  const dir = sortedDirs[i];
  const formattedDate = formatDirectoryDate(dir);
  
  // Add the "latest" class only to the first item
  if (i === 0) {
    reportItems += `<li class="latest"><a href="./${dir}/index.html">Run: ${dir} <span class="date">Generated on ${formattedDate}</span></a></li>`;
  } else {
    reportItems += `<li><a href="./${dir}/index.html">Run: ${dir} <span class="date">Generated on ${formattedDate}</span></a></li>`;
  }
}

// Replace placeholder
const finalHtml = template.replace("<!-- REPORT_ITEMS -->", reportItems);
fs.writeFileSync(outputPath, finalHtml, "utf-8");

// Log completion
console.log(`Generated index.html with ${sortedDirs.length} report links. Latest report: ${sortedDirs[0]}`);
