# Satellite-Based Precision Agriculture - Docker Image
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for geospatial packages
RUN apt-get update && apt-get install -y \
    libgdal-dev \
    gdal-bin \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies (skip GEE if problematic in container)
RUN pip install --no-cache-dir -r requirements.txt || \
    pip install --no-cache-dir pandas numpy scikit-learn xgboost matplotlib seaborn scipy joblib tqdm

# Copy project
COPY . .

# Set PYTHONPATH for imports
ENV PYTHONPATH=/app

# Default: run main pipeline
CMD ["python", "main.py"]
