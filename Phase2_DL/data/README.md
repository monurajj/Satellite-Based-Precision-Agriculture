# Phase 2 Data: EuroSAT Dataset

## About

EuroSAT is a dataset of 27,000 Sentinel-2 satellite image patches (64x64 pixels) covering 10 land use/land cover classes across 34 European countries.

**Paper:** Helber et al. (2019) - "EuroSAT: A Novel Dataset and Deep Learning Benchmark for Land Use and Land Cover Classification", IEEE JSTARS

## Classes (10)

| # | Class | Count | Agriculture? |
|---|-------|-------|-------------|
| 1 | AnnualCrop | 3,000 | Yes |
| 2 | Forest | 3,000 | No |
| 3 | HerbaceousVegetation | 3,000 | Related |
| 4 | Highway | 2,500 | No |
| 5 | Industrial | 2,500 | No |
| 6 | Pasture | 2,000 | Yes |
| 7 | PermanentCrop | 2,500 | Yes |
| 8 | Residential | 3,000 | No |
| 9 | River | 2,500 | No |
| 10 | SeaLake | 3,000 | No |

## How Data is Loaded

The EuroSAT dataset is **automatically downloaded** in the Colab notebook using the `torchgeo` library:

```python
from torchgeo.datasets import EuroSAT
dataset = EuroSAT(root="./data", download=True)
```

No manual download is needed. The dataset (~90MB for RGB, ~2.5GB for 13-band) is downloaded to the Colab runtime storage.

## Sentinel-2 Bands (13-band version)

| Band | Name | Wavelength (nm) | Resolution (m) | Use |
|------|------|-----------------|-----------------|-----|
| B1 | Coastal Aerosol | 443 | 60 | Atmosphere |
| B2 | Blue | 490 | 10 | Visible |
| B3 | Green | 560 | 10 | Visible |
| B4 | Red | 665 | 10 | Visible |
| B5 | Veg Red Edge 1 | 705 | 20 | Vegetation |
| B6 | Veg Red Edge 2 | 740 | 20 | Vegetation |
| B7 | Veg Red Edge 3 | 783 | 20 | Vegetation |
| B8 | NIR | 842 | 10 | Vegetation health |
| B8A | Narrow NIR | 865 | 20 | Vegetation |
| B9 | Water Vapour | 945 | 60 | Atmosphere |
| B10 | SWIR Cirrus | 1375 | 60 | Cloud detection |
| B11 | SWIR 1 | 1610 | 20 | Moisture/soil |
| B12 | SWIR 2 | 2190 | 20 | Moisture/soil |

## Connection to Phase 1

Phase 1 used **tabular features** extracted from Sentinel-2 (NDVI, EVI, spectral bands → PCA) for yield regression. Phase 2 uses **raw Sentinel-2 imagery** for classification via deep learning. Same satellite platform, different ML paradigm.

## Local Storage

After downloading results from Colab, place model weights and metrics in `../experiments/results/`.
