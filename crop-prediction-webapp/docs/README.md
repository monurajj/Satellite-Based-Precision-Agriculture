# Documentation

## Project Documentation (PDF)

The **Project-Documentation.html** file contains the complete project documentation covering:
- System architecture
- Workflow and data flow
- Frontend & backend details
- ML model integration
- API reference
- Setup instructions

### How to Create PDF

**Option A: Browser (works on any system)**  
1. Open `Project-Documentation.html` in Chrome, Firefox, or Safari  
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)  
3. Choose **Save as PDF** or **Print to PDF**  
4. Save the file

**Option B: Automated script**  
From the `crop-prediction-webapp` folder:
```bash
npm install
npm run docs:pdf
```
This generates `Project-Documentation.pdf` in the `docs/` folder (requires Puppeteer).
