# Phase 2: Deep Learning Plan

## Overview

Phase 2 extends the Satellite-Based Precision Agriculture project from traditional ML (Phase 1: tabular yield prediction) to **deep learning on satellite imagery**. We apply CNNs, ResNet with Attention, and Vision Transformers to classify Sentinel-2 satellite image patches into land use/land cover categories, directly relevant to precision agriculture.

---

## Dataset: EuroSAT

| Property | Detail |
|----------|--------|
| **Name** | EuroSAT |
| **Paper** | Helber et al. (2019), IEEE JSTARS, 1500+ citations |
| **Satellite** | Sentinel-2 (same as Phase 1) |
| **Images** | 27,000 geo-referenced patches, 64x64 pixels |
| **Bands** | 13 multispectral bands (full Sentinel-2) + RGB version |
| **Classes** | 10 land use/land cover classes |
| **Size** | RGB: ~90MB, Multispectral: ~2.5GB |
| **Source** | `torchgeo` library (auto-downloads) or Zenodo |

### Classes (10)
| Class | Agriculture Relevance |
|-------|----------------------|
| **AnnualCrop** | Direct - seasonal crops (wheat, corn, etc.) |
| **PermanentCrop** | Direct - orchards, vineyards |
| **Pasture** | Direct - grazing land |
| **HerbaceousVegetation** | Related - natural vegetation |
| **Forest** | Context - land boundary detection |
| **River** | Context - irrigation proximity |
| **SeaLake** | Context - water bodies |
| **Highway** | Infrastructure |
| **Industrial** | Infrastructure |
| **Residential** | Infrastructure |

### Why EuroSAT?
1. **Same satellite as Phase 1** - Sentinel-2, creating project coherence
2. **Agriculture-relevant classes** - 3 direct agriculture classes + vegetation
3. **Well-benchmarked** - Published baselines for fair comparison (ResNet-50: ~98.6%)
4. **Right size for DL** - 27K images: enough for training, manageable on Colab T4
5. **Research-grade** - Published in top remote sensing journal

---

## Architectures

### Architecture A: Simple CNN (Baseline)
- 4-layer CNN: Conv2D(13,32,3) -> ReLU -> MaxPool -> Conv2D(32,64,3) -> ReLU -> MaxPool -> Conv2D(64,128,3) -> ReLU -> AdaptiveAvgPool -> FC(128,10)
- No skip connections, no attention
- Purpose: DL baseline (analogous to Linear Regression in Phase 1)

### Architecture B: ResNet-50 + Squeeze-and-Excitation Attention (Primary)
- Modified first conv layer: 3 channels -> 13 channels for full Sentinel-2 bands
- Partial ImageNet transfer learning (pretrained weights for all layers except first conv)
- **Squeeze-and-Excitation (SE) block** after last residual block:
  - Global average pooling -> FC -> ReLU -> FC -> Sigmoid -> channel-wise rescaling
  - Learns which spectral bands are most informative for each class
- Why ResNet: Skip connections solve vanishing gradients; well-proven for image classification
- Why SE: Channel attention is especially meaningful for multispectral data where different bands carry different physical information (NIR for vegetation health, SWIR for moisture)

### Architecture C: Vision Transformer (ViT-Small)
- Patch size 8 (for 64x64 images = 64 patches)
- Modified input embedding for 13 channels
- Learnable positional embeddings
- Purpose: Compare fundamentally different architecture family (CNN vs Transformer)
- Why ViT-Small: Appropriate model size for 27K dataset (full ViT would overfit)

### Custom Block: Spectral-Spatial Attention Module (SSAM)
- **Channel attention**: learns which spectral bands matter most per sample
- **Spatial attention**: learns where in the image to focus
- Novel custom block (not a standard library module)
- Domain-motivated: different Sentinel-2 bands (B2-B12, NIR, SWIR) carry different agricultural signals
- Can be integrated into ResNet or used standalone

---

## Training Strategy

### Data Splits
- Train: 70% (18,900 images) - stratified by class
- Validation: 15% (4,050 images)
- Test: 15% (4,050 images) - held out until final evaluation

### Regularization
- Dropout (0.3) before classification head
- Weight Decay (1e-4) in optimizer
- Early Stopping on validation loss (patience=10 epochs)
- Label Smoothing (0.1) in cross-entropy loss

### Augmentation (Satellite-Appropriate)
- Random horizontal and vertical flips (no canonical orientation in satellite imagery)
- Random rotation (0, 90, 180, 270 degrees)
- Random brightness/contrast jitter (simulates atmospheric variation)
- NO perspective transforms (would distort geospatial meaning)
- Channel-wise normalization using per-band training set mean/std

### Class Imbalance Handling
- Compute class weights inversely proportional to frequency
- Weighted cross-entropy loss OR WeightedRandomSampler

### Optimizer & Schedule
- AdamW optimizer
- Cosine annealing LR schedule
- LR: 1e-3 (CNN from scratch), 1e-4 (fine-tuned ResNet/ViT)

### Data Pipeline
- PyTorch Dataset + DataLoader
- num_workers=4, pin_memory=True, prefetch_factor=2
- Device: CUDA (Google Colab T4 GPU)

---

## Evaluation Plan

### Metrics
- Overall accuracy (top-1)
- Per-class precision, recall, F1-score
- Macro-averaged F1 (handles class imbalance)
- 10x10 confusion matrix

### Baselines Comparison
| Model | Type | Purpose |
|-------|------|---------|
| Simple CNN | DL baseline | Proves DL value over random |
| ResNet-50 + SE | Primary | Main model with attention |
| ViT-Small | Transformer | CNN vs Transformer comparison |

### Learning Curves
- Train/val loss vs epoch for all architectures
- Train/val accuracy vs epoch
- Interpretation: convergence, overfitting detection, oscillation analysis

### Ablation Studies (5 experiments)
1. **RGB vs 13-band**: Impact of spectral band count
2. **With/without SE attention**: Impact of channel attention
3. **With/without augmentation**: Impact of data augmentation
4. **Scratch vs pretrained**: Impact of ImageNet transfer learning
5. **With/without SSAM**: Impact of custom spectral-spatial attention

### Robustness Testing
- Simulated cloud contamination (Gaussian noise on random patches)
- Reduced training set sizes (10%, 25%, 50%, 100%) - data efficiency curves

### Interpretability
- **Grad-CAM**: Visualize which spatial regions the model focuses on for each class
- **SHAP (DeepExplainer)**: Per-band importance analysis
- **t-SNE/UMAP**: Penultimate layer embeddings colored by class - shows learned feature space

### Optimization
- Post-training INT8 quantization (PyTorch)
- Report: model size reduction, inference speedup, accuracy impact

---

## Literature Review (Key Papers)

1. **Helber et al. (2019)** - "EuroSAT: A Novel Dataset and Deep Learning Benchmark for Land Use and Land Cover Classification" - *Dataset paper*
2. **He et al. (2016)** - "Deep Residual Learning for Image Recognition" - *ResNet architecture*
3. **Dosovitskiy et al. (2021)** - "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale" - *Vision Transformer*
4. **Hu et al. (2018)** - "Squeeze-and-Excitation Networks" - *Channel attention mechanism*
5. **Sumbul et al. (2019)** - "BigEarthNet: A Large-Scale Benchmark Archive for Remote Sensing Image Understanding" - *Alternative benchmark*
6. **Kussul et al. (2017)** - "Deep Learning Classification of Land Cover and Crop Types Using Remote Sensing Data" - *DL for crop classification*
7. **Zhong et al. (2019)** - "Deep learning based multi-temporal crop classification" - *Temporal satellite DL*
8. **Selvaraju et al. (2017)** - "Grad-CAM: Visual Explanations from Deep Networks" - *Model interpretability*

### Narrative
Phase 1 used tabular features (NDVI time-series, weather aggregates) extracted from Sentinel-2 for yield regression. Phase 2 takes the raw satellite imagery and applies DL to classify land cover - a complementary task. Together, they form a complete precision agriculture pipeline: first identify crop types from imagery (Phase 2), then predict yield for identified fields (Phase 1).

---

## Google Colab Workflow

### What to upload
Upload **one file**: `Phase2_DL/notebooks/Phase2_DL_Complete.ipynb`

### Steps
1. Go to [Google Colab](https://colab.research.google.com)
2. Upload `Phase2_DL_Complete.ipynb`
3. Go to **Runtime -> Change runtime type -> GPU (T4)**
4. **Run All Cells** - the notebook will:
   - Install all dependencies (~2 min)
   - Download EuroSAT dataset (~30 sec)
   - Train Simple CNN (~5 min)
   - Train ResNet-50 + SE (~15 min)
   - Train ViT-Small (~20 min)
   - Run all 5 ablation studies (~30 min)
   - Generate Grad-CAM, SHAP, t-SNE visualizations (~10 min)
   - Run quantization experiment (~2 min)
5. Download results: model weights (.pth), metrics (.csv), figures (.png)
6. Place downloaded files in `Phase2_DL/experiments/results/`

### Estimated Total Time: ~1.5 hours on Colab T4

---

## Rubric Alignment

| Component | Target Score | How We Achieve It |
|-----------|-------------|-------------------|
| Architecture Logic | 8-10 | ResNet+SE attention (8), quantization (9), custom SSAM block (10) |
| DL Literature Review | 8+ | Conference-format review, gap analysis, cross-domain synthesis |
| Dataset & Regularization | 8+ | Stratified splits, augmentation, weighted loss, optimized DataLoaders |
| Technical Validation | 8-10 | Ablation studies (9), Grad-CAM/SHAP interpretability (10) |
| Theoretical Rigor | 7-8 | Convolution math, skip connection gradients, attention formulas, optimizer analysis |
