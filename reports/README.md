# Project Report – Building the PDF

This folder contains the LaTeX source for the project report. The output should be `PROJECT_REPORT.pdf`.

## Option 1: Local Build (MacTeX / TeX Live)

**Install LaTeX** (one-time):
```bash
# macOS with Homebrew
brew install --cask mactex
```

Then build:
```bash
cd reports
./build_pdf.sh
```

Or manually:
```bash
cd reports
pdflatex PROJECT_REPORT.tex
pdflatex PROJECT_REPORT.tex
```

## Option 2: Overleaf (No local install)

1. Go to [overleaf.com](https://www.overleaf.com)
2. **New Project** → **Upload Project**
3. Zip the `reports/` folder (including `figures/`) and upload
4. Click **Recompile** – PDF downloads automatically

The zip need only contain `PROJECT_REPORT.tex`. **Do not** include the `figures/` folder—the placeholder PNGs cause libpng errors on Overleaf. The report uses text placeholders; add real figures later via `generate_figures.py`.

## Option 3: GitHub Actions (Automatic on push)

If you push this repo to GitHub, the workflow in `.github/workflows/build-report.yml` compiles the PDF on each push. Download the artifact from the **Actions** tab.

## Figures

- **Placeholder figures** (grey boxes): Created by `python reports/create_placeholder_figures.py`
- **Real figures**: After running `python main.py`, run `python reports/generate_figures.py` to create EDA plots, predicted vs actual, and feature importance.
