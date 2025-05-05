const fs = require("fs");
const path = require("path");

// Environment variable passed from workflow
const REPORT_DIR = process.env.REPORT_DIR;
console.log(`REPORT_DIR from environment: ${REPORT_DIR || "Not set"}`);

// In the workflow, we're in 'main' directory, and public is one level up
const pagesPath = path.join(__dirname, "..", "..", "public");
const templatePath = path.join(__dirname, "..", "resources", "report-design.html");
const outputPath = path.join(pagesPath, "index.html");

// Ensure template exists
if (!fs.existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}

// Read template
const template = fs.readFileSync(templatePath, "utf-8");

// Format date specifically for Eastern Time
function formatEasternTime(date) {
  try {
    // Force Eastern Time zone regardless of server timezone
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric", 
      month: "long", 
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "America/New_York"
    });
  } catch (err) {
    console.error(`Error formatting date: ${err.message}`);
    return date.toString();
  }
}

// Get current time in Eastern Time Zone
function getCurrentEasternTime() {
  // Using UTC date and forcing display as Eastern
  const now = new Date();
  return formatEasternTime(now);
}

// Parse date from directory name and return Date object
function parseDirectoryDate(dirName) {
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
    try {
      // Create a Date object correctly representing the time in the directory name
      const date = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // JavaScript months are 0-based
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
        parseInt(second, 10)
      );
      return {
        date: date,
        formatted: formatEasternTime(date)
      };
    } catch (err) {
      console.error(`Error parsing date from directory name: ${err.message}`);
    }
  }
  
  // Return a fallback for unparseable names
  return {
    date: new Date(0), // Epoch date so it sorts to the end
    formatted: dirName
  };
}

// Get all valid directory entries from the pages path
const allItems = fs.readdirSync(pagesPath, { withFileTypes: true });

// Important: We need today's date string to find today's reports
const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
console.log(`Today's date string: ${todayStr}`);

// Find all report directories EXCEPT the current one
const allDirs = allItems
  .filter(item => {
    // Must be a directory
    if (!item.isDirectory()) return false;
    
    // Must not be the current report directory
    if (item.name === REPORT_DIR) return false;
    
    // Must match the date format pattern
    return /^\d{4}-\d{2}-\d{2}/.test(item.name);
  })
  .map(item => {
    const parsed = parseDirectoryDate(item.name);
    return {
      name: item.name,
      parsed: parsed
    };
  })
  .sort((a, b) => b.parsed.date - a.parsed.date); // Sort by date (newest first)

console.log(`Found ${allDirs.length} existing report directories`);
console.log(`Today's reports: ${allDirs.filter(d => d.name.startsWith(todayStr)).length}`);

// Build HTML for report items
let reportItems = "";

// ALWAYS add the latest report as the first item with the "latest" class
const currentTime = getCurrentEasternTime();
reportItems += `<li class="latest"><a href="./${REPORT_DIR}/index.html">Run: ${REPORT_DIR} <span class="date">Generated on ${currentTime}</span></a></li>`;
console.log(`Added latest report link: ${REPORT_DIR} with time ${currentTime}`);

// Add all other reports
for (const dir of allDirs) {
  reportItems += `<li><a href="./${dir.name}/index.html">Run: ${dir.name} <span class="date">Generated on ${dir.parsed.formatted}</span></a></li>`;
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
