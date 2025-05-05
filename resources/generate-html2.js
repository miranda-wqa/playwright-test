const fs = require("fs");
const path = require("path");

// Environment variable passed from workflow
const REPORT_DIR = process.env.REPORT_DIR;
console.log(`REPORT_DIR from environment: ${REPORT_DIR || "Not set"}`);

// In the workflow, we're in 'main' directory, and public is one level up
const pagesPath = path.join(__dirname, "..", "..", "public");
const templatePath = path.join(__dirname, "..", "resources", "report-design.html");
const outputPath = path.join(pagesPath, "index.html");

console.log(`Pages path: ${pagesPath}`);
console.log(`Template path: ${templatePath}`);
console.log(`Output path: ${outputPath}`);

// Ensure template exists
if (!fs.existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}

// Read template
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

// Debug: List all files/folders in pagesPath
console.log("Files and folders in public directory:");
try {
  const items = fs.readdirSync(pagesPath);
  items.forEach(item => {
    const itemPath = path.join(pagesPath, item);
    const isDir = fs.statSync(itemPath).isDirectory();
    console.log(`- ${item} (${isDir ? 'directory' : 'file'})`);
  });
} catch (err) {
  console.error(`Error reading public directory: ${err.message}`);
}

// Get all report directories (excluding the latest one)
const allDirs = fs
  .readdirSync(pagesPath, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.match(/^20/) && d.name !== REPORT_DIR)
  .map((d) => d.name)
  .sort((a, b) => b.localeCompare(a)); // Descending

console.log(`Found ${allDirs.length} existing report directories`);

// Build HTML for report items
let reportItems = "";

// ALWAYS add the latest report as the first item with the "latest" class
// This is the most important change - don't check if it exists, just add it!
const now = formatDate(new Date());
reportItems += `<li class="latest"><a href="./${REPORT_DIR}/index.html">Run: ${REPORT_DIR} <span class="date">Generated on ${now}</span></a></li>`;
console.log(`Added latest report link: ${REPORT_DIR}`);

// Add all other reports
for (const dir of allDirs) {
  const formattedDate = formatDirectoryDate(dir);
  reportItems += `<li><a href="./${dir}/index.html">Run: ${dir} <span class="date">Generated on ${formattedDate}</span></a></li>`;
}

// Replace placeholder and write output
const finalHtml = template.replace("<!-- REPORT_ITEMS -->", reportItems);

try {
  fs.writeFileSync(outputPath, finalHtml, "utf-8");
  console.log(`Successfully updated index.html with latest report link: ${REPORT_DIR}`);
} catch (err) {
  console.error(`Error writing index.html: ${err.message}`);
  process.exit(1);
}
