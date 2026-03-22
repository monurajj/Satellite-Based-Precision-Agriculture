# Rubric Checklist: Path to Full 10 Marks

Use this checklist to ensure your project meets the highest standards across all evaluation criteria.

---

## 1. Introduction (10/10)
**Target:** Reads like a publishable paper introduction. Deep historical awareness. Defends the project's existence with high-level argumentation.

| ✓ | Action |
|---|--------|
| ☐ | Expand historical context (1980s–present: NDVI → Landsat → Sentinel-2 → ML evolution) |
| ☐ | Cite 5+ seminal papers with proper context |
| ☐ | Clear problem statement: *why* does this matter for agriculture/society? |
| ☐ | Explicitly state novelty/contribution in 2–3 bullet points |

**Done in report:** Historical context, literature review, motivation, contribution summary.

---

## 2. Data Understanding (10/10)
**Target:** Finds non-obvious patterns that dictate the entire modeling strategy. Intimate "feel" for the data.

| ✓ | Action |
|---|--------|
| ☐ | Document NDVI–precipitation interaction (above/below median) |
| ☐ | Explain grain-filling slope insight from physiology |
| ☐ | Report Moran's I or spatial autocorrelation analysis |
| ☐ | Describe cloud-contamination outliers and mitigation |
| ☐ | Add EDA figures: distributions, correlation heatmap |

**Done in report:** EDA section with 4 non-obvious patterns; figure placeholders.

---

## 3. Feature Engineering (10/10)
**Target:** The feature engineering IS the breakthrough. Novel representation drastically simplifies the learning task. Significant improvement in performance.

| ✓ | Action |
|---|--------|
| ☐ | Clearly define NDVI grain-filling slope (formula + intuition) |
| ☐ | Ablation study: remove phenological metrics → report ΔR² |
| ☐ | Ablation study: remove soil features → report ΔR² |
| ☐ | Justify interaction terms from domain knowledge |
| ☐ | Show feature importance ranking (grain-fill slope in top 5) |

**Done in report:** Full feature engineering section with formulas; ablation results.

---

## 4. Modeling (10/10)
**Target:** Deep intuition of the optimization landscape. Discusses implications of violating theoretical assumptions and mitigates them.

| ✓ | Action |
|---|--------|
| ☐ | OLS: state assumptions (linearity, homoscedasticity); discuss violations |
| ☐ | RF/XGBoost: bias–variance trade-off (max_depth, min_samples_leaf) |
| ☐ | Spatial independence: explain autocorrelation risk; GroupKFold mitigation |
| ☐ | XGBoost objective function and regularization (Ω) |
| ☐ | GridSearchCV: scoring metric, CV strategy |

**Done in report:** Theoretical assumptions & violations subsection.

---

## 5. Evaluation (10/10)
**Target:** Customized solution. Rigorous "Failure Analysis"—analyze specific instances where model failed and explain why mathematically.

| ✓ | Action |
|---|--------|
| ☐ | Run `identify_failure_cases()` from `src/evaluation.py` |
| ☐ | For worst 3–5 fields: NDVI curve, soil, weather context |
| ☐ | Mathematical explanation: NDVI representation gap, cloud bias, soil heterogeneity |
| ☐ | Proposed mitigations (SMAP, finer resolution, LSTM) |
| ☐ | Paired t-test: RF vs XGBoost (report p-value) |

**Done in report:** Failure analysis with 3 mathematical causes and mitigations.

---

## 6. Code & Reproducibility (10/10)
**Target:** Outstanding repository. Professional README. Fully reproducible setup. Modular, clean code. Well-structured folders. Consistent meaningful commits. Industry-ready.

| ✓ | Action |
|---|--------|
| ☐ | README: problem, approach, results table, usage, setup in <5 min |
| ☐ | `requirements.txt` / `environment.yml` with pinned versions |
| ☐ | `python main.py` runs full pipeline end-to-end |
| ☐ | `data/README.md` explains schema and acquisition |
| ☐ | `experiments/README.md` describes outputs |
| ☐ | Consistent commit messages (e.g., `feat:`, `fix:`) |
| ☐ | `.gitignore` for data, venv, __pycache__ |
| ☐ | Web app: Docker or clear run instructions |

---

## 7. Report (10/10)
**Target:** Professionally written LaTeX. Excellent formatting (math, figures, references). Clear flow (Intro → Method → Results → Conclusion). Strong clarity. High-quality visuals. Properly cited references.

| ✓ | Action |
|---|--------|
| ☐ | Use `reports/PROJECT_REPORT.tex` |
| ☐ | Run `python reports/generate_figures.py` to create figures |
| ☐ | Compile: `cd reports && pdflatex PROJECT_REPORT.tex` (×2) |
| ☐ | Update author name, institution, email |
| ☐ | Add 2–3 more references if needed |
| ☐ | Ensure all equations are correct |

**Files:**
- `reports/PROJECT_REPORT.tex` – full LaTeX report
- `reports/generate_figures.py` – generates EDA, predicted vs actual, feature importance

---

## 8. Video Presentation (10/10)
**Target:** Clearly explains why project was built. Smooth, complete working demo. Well-paced, technically sound narrative. Crystal clear audio. High-resolution video. Professional transitions.

| ✓ | Action |
|---|--------|
| ☐ | 5–10 min; structure: problem → approach → demo → results |
| ☐ | Live demo: run prediction, show dashboard, history |
| ☐ | Record screen (1080p) + voice; minimal background noise |
| ☐ | Edit: intro, outro, smooth transitions |
| ☐ | Upload to YouTube/Vimeo; link in README |

---

## 9. Oral Exam (10/10)
**Target:** Clearly explains full system architecture and data flow. Confidently answers detailed code-level questions. Strong understanding of tools/libraries. Justifies design decisions. Unquestionable ownership.

| ✓ | Action |
|---|--------|
| ☐ | Draw system diagram: GEE → merge → features → model → web app |
| ☐ | Be ready to explain: GroupKFold, feature importance, failure cases |
| ☐ | Know `predict_ml.py` mapping: form inputs → 24 features |
| ☐ | Justify: why XGBoost over LSTM? why spatial CV? |
| ☐ | Practice explaining grain-filling slope in 30 seconds |

---

## Quick Commands

```bash
# Generate figures for report
python main.py                    # Creates data/features.csv
python reports/generate_figures.py

# Compile LaTeX report
cd reports && pdflatex PROJECT_REPORT.tex && pdflatex PROJECT_REPORT.tex

# Run web app
cd crop-prediction-webapp && node backend/server.js &
cd crop-prediction-webapp/frontend && npm run dev
```
