"""Model wrappers for training and hyperparameter tuning."""

from typing import Any, Dict, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GridSearchCV, GroupKFold

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except Exception:
    xgb = None
    XGBOOST_AVAILABLE = False


def get_spatial_cv_splits(
    n_samples: int,
    groups: np.ndarray,
    n_splits: int = 5,
) -> list:
    """
    Create GroupKFold splits to avoid spatial autocorrelation.

    Each fold leaves out entire fields (groups) for validation.

    Args:
        n_samples: Number of samples.
        groups: Group labels (e.g., field_id encoded).
        n_splits: Number of folds.

    Returns:
        List of (train_idx, val_idx) tuples.
    """
    gkf = GroupKFold(n_splits=n_splits)
    return list(gkf.split(np.arange(n_samples), groups=groups))


def train_linear_regression(
    X: np.ndarray,
    y: np.ndarray,
    fit_intercept: bool = True,
) -> Tuple[LinearRegression, Dict[str, float]]:
    """
    Train OLS linear regression baseline.

    Loss: L = (1/n) * sum((y_i - X_i * beta)^2). Minimizing gives normal equations.

    Returns:
        Tuple of (fitted model, empty dict for compatibility).
    """
    model = LinearRegression(fit_intercept=fit_intercept)
    model.fit(X, y)
    return model, {}


def train_random_forest(
    X: np.ndarray,
    y: np.ndarray,
    groups: np.ndarray = None,
    param_grid: Dict = None,
    cv: int = 5,
) -> Tuple[RandomForestRegressor, Dict[str, Any]]:
    """
    Train Random Forest with hyperparameter tuning via GridSearchCV.

    Bias-variance trade-off: max_depth and min_samples_leaf control complexity.
    - High max_depth: low bias, high variance (overfitting)
    - Low max_depth: high bias, low variance (underfitting)

    Returns:
        Tuple of (best estimator, cv_results).
    """
    if param_grid is None:
        param_grid = {
            "n_estimators": [100, 200],
            "max_depth": [5, 10, 15, None],
            "min_samples_leaf": [2, 5, 10],
            "min_samples_split": [2, 5],
        }

    model = RandomForestRegressor(random_state=42)
    cv_strategy = GroupKFold(n_splits=cv) if groups is not None else cv
    search = GridSearchCV(
        model,
        param_grid,
        cv=cv_strategy,
        scoring="neg_root_mean_squared_error",
        n_jobs=-1,
        verbose=0,
    )
    fit_params = {"groups": groups} if groups is not None else {}
    search.fit(X, y, **fit_params)
    return search.best_estimator_, {"best_params": search.best_params_, "cv_results": search.cv_results_}


def train_xgboost(
    X: np.ndarray,
    y: np.ndarray,
    groups: np.ndarray = None,
    param_grid: Dict = None,
    cv: int = 5,
    early_stopping_rounds: int = 20,
) -> Tuple[Any, Dict[str, Any]]:
    """
    Train XGBoost with hyperparameter tuning and early stopping.

    Returns:
        Tuple of (best estimator, tuning results).
    """
    if not XGBOOST_AVAILABLE:
        raise ImportError("XGBoost not available (e.g., libomp missing on Mac). Install: brew install libomp")
    if param_grid is None:
        param_grid = {
            "n_estimators": [200, 500],
            "max_depth": [3, 5, 7],
            "learning_rate": [0.01, 0.05, 0.1],
            "min_child_weight": [1, 3, 5],
            "subsample": [0.8],
        }

    model = xgb.XGBRegressor(random_state=42)
    cv_strategy = GroupKFold(n_splits=cv) if groups is not None else cv
    search = GridSearchCV(
        model,
        param_grid,
        cv=cv_strategy,
        scoring="neg_root_mean_squared_error",
        n_jobs=-1,
        verbose=0,
    )
    fit_params = {"groups": groups} if groups is not None else {}
    search.fit(X, y, **fit_params)
    return search.best_estimator_, {"best_params": search.best_params_, "cv_results": search.cv_results_}


def train_lstm(
    X_seq: np.ndarray,
    y: np.ndarray,
    epochs: int = 50,
    batch_size: int = 16,
) -> Tuple[Any, Dict]:
    """
    Train LSTM on time-series features (optional).

    X_seq shape: (n_samples, seq_len, n_features).

    Returns:
        Tuple of (fitted model, history dict).
    """
    try:
        import tensorflow as tf
    except ImportError:
        raise ImportError("TensorFlow required for LSTM. Install with: pip install tensorflow")

    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout

    seq_len, n_features = X_seq.shape[1], X_seq.shape[2]
    model = Sequential([
        LSTM(64, activation="tanh", return_sequences=True, input_shape=(seq_len, n_features)),
        Dropout(0.2),
        LSTM(32, activation="tanh"),
        Dropout(0.2),
        Dense(1),
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=10,
        restore_best_weights=True,
    )
    history = model.fit(
        X_seq, y,
        epochs=epochs,
        batch_size=batch_size,
        validation_split=0.2,
        callbacks=[early_stop],
        verbose=0,
    )
    return model, {"history": history.history}


def get_feature_importance(
    model: Any,
    feature_names: list,
) -> pd.DataFrame:
    """
    Extract feature importance from tree-based models.

    Args:
        model: Fitted RandomForest or XGBoost model.
        feature_names: List of feature column names.

    Returns:
        DataFrame with feature names and importance scores.
    """
    if hasattr(model, "feature_importances_"):
        imp = model.feature_importances_
    else:
        return pd.DataFrame({"feature": feature_names, "importance": [0.0] * len(feature_names)})
    return pd.DataFrame({"feature": feature_names, "importance": imp}).sort_values("importance", ascending=False)
