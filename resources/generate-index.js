const fs = require("fs");
const path = require("path");

const reportDir = process.env.REPORT_DIR;
if (!reportDir) {
  console.error("Missing REPORT_DIR env var");
  process.exit(1);
}

const indexPath = path.join(__dirname, "public", "index.html");
let oldItems = [];

if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, "utf-8");
  const matches = [...html.matchAll(/<li><a href='(.+?)'>.+?<\/a><\/li>/g)];
  for (const match of matches) {
    const link = match[1];
    if (!link.includes(`./${reportDir}/index.html`)) {
      oldItems.push(match[0]);
    }
  }
}

const formattedDate = new Date().toLocaleString("en-US", {
  timeZone: "America/New_York",
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const newItem = `<li><a href='./${reportDir}/index.html'>Run: ${reportDir} <span class="date">Generated on ${formattedDate}</span></a></li>`;

const finalHtml = `
<html>
  <body>
    <h1>Test Reports</h1>
    <ul>
      ${[newItem, ...oldItems.slice(0, 99)].join("\n")}
    </ul>
  </body>
</html>`;

fs.writeFileSync(indexPath, finalHtml.trim());
console.log("✅ index.html updated successfully.");
