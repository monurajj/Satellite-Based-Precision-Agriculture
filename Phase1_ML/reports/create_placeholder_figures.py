#!/usr/bin/env python3
"""
Create placeholder figure images (no matplotlib required).
Use when generate_figures.py cannot run (missing pandas/matplotlib).
Creates simple placeholder PNGs so the LaTeX report compiles with graphics.
"""
from pathlib import Path

# Minimal 100x100 grey PNG (valid PNG structure)
# This is a base64-encoded minimal PNG - grey rectangle
MINIMAL_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDQE"
    "HQPnNIQNTAAAAMegZ7wABF+LXDAAAAABJRU5ErkJggg=="
)

FIG_DIR = Path(__file__).resolve().parent / "figures"
FIG_NAMES = ["eda_distributions.png", "eda_correlation.png", "predicted_vs_actual.png", "feature_importance.png"]


def main():
    import base64
    FIG_DIR.mkdir(exist_ok=True)
    data = base64.b64decode(MINIMAL_PNG_B64)
    for name in FIG_NAMES:
        (FIG_DIR / name).write_bytes(data)
        print(f"Created placeholder: figures/{name}")
    print("Placeholder figures created. Run 'python reports/generate_figures.py' after main.py for real figures.")


if __name__ == "__main__":
    main()
