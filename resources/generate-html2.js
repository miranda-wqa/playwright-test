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

// Create a consistent date formatter function
// The dateString is already in EST because we're using the America/New_York timezone
function formatDate(date) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/New_York"
    }).format(date);
  } catch (err) {
    console.error(`Error formatting date: ${err.message}`);
    // Return a fallback
    return date.toLocaleString("en-US", {timeZone: "America/New_York"});
  }
}

// Get current date in Eastern Time
function getCurrentESTDate() {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
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
    // Use EST timezone when creating the date
    const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second || '00'}-04:00`;
    try {
      const date = new Date(dateString);
      return formatDate(date);
    } catch (err) {
      console.error(`Error parsing date from directory name: ${err.message}`);
      return dirName;
    }
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

// Get ALL report directories - including today's runs
// Use a more flexible regex to catch all date-formatted directories
const allDirs = fs
  .readdirSync(pagesPath, { withFileTypes: true })
  .filter((d) => {
    // Include all directories that match the date pattern
    const isDir = d.isDirectory();
    const matchesPattern = d.name.match(/^\d{4}-\d{2}-\d{2}/); // Starts with YYYY-MM-DD
    const notCurrentRun = d.name !== REPORT_DIR; // Not the current run being added
    
    if (isDir && matchesPattern) {
      console.log(`Found report directory: ${d.name}`);
    }
    
    return isDir && matchesPattern && notCurrentRun;
  })
  .map((d) => d.name)
  .sort((a, b) => b.localeCompare(a)); // Descending (newest first)

console.log(`Found ${allDirs.length} existing report directories`);

// Build HTML for report items
let reportItems = "";

// ALWAYS add the latest report as the first item with the "latest" class
const now = formatDate(getCurrentESTDate());
reportItems += `<li class="latest"><a href="./${REPORT_DIR}/index.html">Run: ${REPORT_DIR} <span class="date">Generated on ${now}</span></a></li>`;
console.log(`Added latest report link: ${REPORT_DIR}`);

// Add all other reports
for (const dir of allDirs) {
  const formattedDate = formatDirectoryDate(dir);
  reportItems += `<li><a href="./${dir}/index.html">Run: ${dir} <span class="date">Generated on ${formattedDate}</span></a></li>`;
  console.log(`Added previous report link: ${dir}`);
}

// Replace placeholder and write output
const finalHtml = template.replace("<!-- REPORT_ITEMS -->", reportItems);

try {
  fs.writeFileSync(outputPath, finalHtml, "utf-8");
  console.log(`Successfully updated index.html with latest report link: ${REPORT_DIR}`);
  console.log(`Total reports listed: ${allDirs.length + 1}`);
} catch (err) {
  console.error(`Error writing index.html: ${err.message}`);
  process.exit(1);
}
