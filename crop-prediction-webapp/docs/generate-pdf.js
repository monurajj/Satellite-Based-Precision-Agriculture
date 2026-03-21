#!/usr/bin/env node
/**
 * Generate PDF from Project-Documentation.html
 * Requires: npm install puppeteer (or run with npx)
 * Usage: node generate-pdf.js  OR  npx puppeteer generate-pdf.js
 */

const fs = require('fs');
const path = require('path');

const DOC_DIR = __dirname;
const HTML_FILE = path.join(DOC_DIR, 'Project-Documentation.html');
const PDF_FILE = path.join(DOC_DIR, 'Project-Documentation.pdf');

async function main() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.error('Puppeteer not found. Install with: npm install puppeteer');
    console.error('Or run: npx puppeteer docs/generate-pdf.js');
    process.exit(1);
  }

  if (!fs.existsSync(HTML_FILE)) {
    console.error('Project-Documentation.html not found');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('file://' + HTML_FILE, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: PDF_FILE,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true,
  });
  await browser.close();
  console.log('PDF generated:', PDF_FILE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
