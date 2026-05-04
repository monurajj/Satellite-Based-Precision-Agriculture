"""Generate the Phase 3 hybrid architecture diagram for the IEEE report."""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyArrowPatch
from pathlib import Path

OUTPUT = Path(__file__).parent / "figures" / "architecture_diagram.png"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

fig, ax = plt.subplots(figsize=(11, 7.5))
ax.set_xlim(0, 11)
ax.set_ylim(0, 7.5)
ax.axis("off")

GREEN = "#1a5c2e"
LIGHT_GREEN = "#d1fae5"
EMERALD = "#22c55e"
GRAY = "#94a3b8"
LIGHT_GRAY = "#e2e8f0"
ACCENT = "#0ea5e9"
LIGHT_ACCENT = "#dbeafe"
ORANGE = "#f59e0b"
LIGHT_ORANGE = "#fef3c7"


def box(x, y, w, h, label, fill, edge, fontsize=10, fontweight="normal", lines=None):
    rect = patches.FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.06,rounding_size=0.15",
        linewidth=1.4, edgecolor=edge, facecolor=fill,
    )
    ax.add_patch(rect)
    if lines:
        text = "\n".join(lines)
    else:
        text = label
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=fontsize, fontweight=fontweight, color="black")


def arrow(x1, y1, x2, y2, color="black", lw=1.4):
    a = FancyArrowPatch((x1, y1), (x2, y2),
                        arrowstyle="-|>", mutation_scale=14,
                        color=color, linewidth=lw)
    ax.add_patch(a)


# Top: User input
box(0.4, 6.4, 10.2, 0.8, "",
    fill=LIGHT_ACCENT, edge=ACCENT, fontsize=11, fontweight="bold",
    lines=["USER INPUT (Web Form)",
           "State  Â·  District  Â·  Crop  Â·  Season  Â·  Acres  Â·  [optional satellite image]"])

# Two main pipelines
arrow(2.5, 6.35, 2.5, 5.85, color=ACCENT)
arrow(8.5, 6.35, 8.5, 5.85, color=ACCENT)

# Tabular branch (left)
box(0.4, 4.0, 4.7, 1.85, "",
    fill=LIGHT_GREEN, edge=GREEN, fontsize=10, fontweight="bold",
    lines=["TABULAR BRANCH",
           "",
           "1. district_lat_lon.json  -> (lat, lon)",
           "2. SoilGrids API  -> pH, OC, clay",
           "3. NASA POWER API  -> T, rainfall (6 months)",
           "4. One-hot encode (state, district, crop, season)"])

# DL branch (right)
box(5.9, 4.0, 4.7, 1.85, "",
    fill=LIGHT_ORANGE, edge=ORANGE, fontsize=10, fontweight="bold",
    lines=["DEEP LEARNING BRANCH (Phase 2)",
           "",
           "1. Phase 2 ResNet-50+SE (Indian fine-tuned)",
           "2. forward_features  ->  [1, 2048, H, W]",
           "3. SE block + adaptive avg-pool  ->  [1, 2048]",
           "4. PCA  ->  [1, 50]"])

# Arrows down from input to branches
arrow(2.5, 5.85, 2.5, 5.85)  # placeholder
arrow(8.5, 5.85, 8.5, 5.85)

# Concatenation
box(3.2, 2.85, 4.7, 0.75, "",
    fill="white", edge=GRAY, fontsize=10, fontweight="bold",
    lines=["FEATURE CONCATENATION",
           "[6 numerical | 50 one-hot | 50 DL] = 106 dims (Hybrid)"])

arrow(2.8, 4.0, 4.5, 3.6, color=GREEN)
arrow(8.2, 4.0, 6.5, 3.6, color=ORANGE)

# XGBoost
box(3.2, 1.7, 4.7, 0.85, "",
    fill="white", edge=GREEN, fontsize=10, fontweight="bold",
    lines=["MULTI-CROP XGBOOST  (n_est=400, max_depth=8, hist)",
           "Trained on ICRISAT VDSA + data.gov.in APY"])

arrow(5.55, 2.85, 5.55, 2.55, color="black")

# Output
box(0.4, 0.3, 10.2, 1.05, "",
    fill=LIGHT_GREEN, edge=GREEN, fontsize=10, fontweight="bold",
    lines=["OUTPUT  (JSON returned to webapp)",
           "yieldPerHectare (t/ha)  Â·  totalProduction (tons = yield x acres x 0.4047)",
           "soil panel  Â·  weather panel  Â·  CNN crop verification  Â·  insights  Â·  modelUsed"])

arrow(5.55, 1.7, 5.55, 1.4, color="black")

# Title
ax.text(5.5, 7.25, "Phase 3 Hybrid Architecture",
        ha="center", va="center", fontsize=14, fontweight="bold", color=GREEN)

# Legend
ax.text(0.4, 0.05, "ML branch", color=GREEN, fontsize=9, fontweight="bold")
ax.text(2.0, 0.05, "Â· DL branch", color=ORANGE, fontsize=9, fontweight="bold")
ax.text(3.7, 0.05, "Â· Hybrid fusion = ML + DL", color="black", fontsize=9)

plt.tight_layout()
plt.savefig(OUTPUT, dpi=150, bbox_inches="tight", facecolor="white")
print(f"Saved: {OUTPUT}")
