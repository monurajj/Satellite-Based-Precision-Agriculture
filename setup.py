"""Setup script for satellite-based precision agriculture package."""

from setuptools import setup, find_packages

setup(
    name="satellite-agriculture",
    version="1.0.0",
    description="Satellite-Based Precision Agriculture: Crop Yield Prediction",
    author="Author",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "scikit-learn>=1.3.0",
        "xgboost>=2.0.0",
        "scipy>=1.11.0",
        "joblib>=1.3.0",
    ],
)
