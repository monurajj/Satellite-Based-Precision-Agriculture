#!/bin/bash
# Build PROJECT_REPORT.pdf from LaTeX source
# Requires: pdflatex, tectonic, or Docker - OR use Overleaf (see README)

set -e
cd "$(dirname "$0")"
REPORTS_DIR="$(pwd)"

# Ensure figures directory exists and has placeholders
mkdir -p figures
if [ ! -f figures/eda_distributions.png ]; then
    echo "Creating placeholder figures..."
    python3 create_placeholder_figures.py 2>/dev/null || true
fi

# Try LaTeX compilers
if command -v pdflatex &>/dev/null; then
    echo "Using pdflatex..."
    pdflatex -interaction=nonstopmode PROJECT_REPORT.tex
    pdflatex -interaction=nonstopmode PROJECT_REPORT.tex
    echo "Done. Output: PROJECT_REPORT.pdf"
elif command -v tectonic &>/dev/null; then
    echo "Using tectonic..."
    tectonic --keep-intermediates PROJECT_REPORT.tex
    echo "Done. Output: PROJECT_REPORT.pdf"
elif command -v docker &>/dev/null; then
    echo "Using Docker (tectonic)..."
    docker run --rm -v "$REPORTS_DIR:/data" dxjoke/tectonic-docker \
        tectonic --keep-intermediates /data/PROJECT_REPORT.tex
    echo "Done. Output: PROJECT_REPORT.pdf"
else
    echo "ERROR: No LaTeX compiler found."
    echo ""
    echo "To get PDF, use one of:"
    echo "  1. Overleaf:  Zip 'reports/' folder → overleaf.com → Upload → Recompile"
    echo "  2. MacTeX:    brew install --cask mactex  (then re-run this script)"
    echo "  3. Tectonic:  https://tectonic-typesetting.github.io"
    echo "  4. Docker:    docker run ... dxjoke/tectonic-docker"
    exit 1
fi
