"""Evaluation utilities: cross-validation, metrics, plotting."""

from typing import Any, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root Mean Squared Error: sqrt(mean((y_true - y_pred)^2))."""
    return np.sqrt(mean_squared_error(y_true, y_pred))


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Error."""
    return mean_absolute_error(y_true, y_pred)


def r2(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Coefficient of determination R²."""
    return r2_score(y_true, y_pred)


def compute_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> dict:
    """Compute RMSE, MAE, R²."""
    return {
        "RMSE": rmse(y_true, y_pred),
        "MAE": mae(y_true, y_pred),
        "R2": r2(y_true, y_pred),
    }


def spatial_cross_validate(
    X: np.ndarray,
    y: np.ndarray,
    groups: np.ndarray,
    model_factory,
    n_splits: int = 5,
) -> Tuple[dict, np.ndarray, np.ndarray]:
    """
    Run spatial cross-validation (GroupKFold).

    Args:
        X: Feature matrix.
        y: Target vector.
        groups: Field IDs for grouping.
        model_factory: Callable that returns a new model (e.g., lambda: RandomForestRegressor()).
        n_splits: Number of folds.

    Returns:
        Tuple of (aggregate_metrics, all_y_true, all_y_pred).
    """
    from sklearn.model_selection import GroupKFold

    gkf = GroupKFold(n_splits=n_splits)
    y_true_list, y_pred_list = [], []
    fold_metrics = []

    for train_idx, val_idx in gkf.split(X, y, groups=groups):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        model = model_factory()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_val)
        y_true_list.extend(y_val)
        y_pred_list.extend(y_pred)
        fold_metrics.append(compute_metrics(y_val, y_pred))

    y_true_all = np.array(y_true_list)
    y_pred_all = np.array(y_pred_list)
    agg = compute_metrics(y_true_all, y_pred_all)
    agg["fold_metrics"] = fold_metrics
    return agg, y_true_all, y_pred_all


def paired_ttest(
    y_true: np.ndarray,
    y_pred_a: np.ndarray,
    y_pred_b: np.ndarray,
) -> Tuple[float, float]:
    """
    Paired t-test for model comparison.

    Tests whether the difference in absolute errors (|y_true - y_pred_a| vs |y_true - y_pred_b|)
    is significantly different from zero.

    Args:
        y_true: Ground truth.
        y_pred_a: Predictions from model A.
        y_pred_b: Predictions from model B.

    Returns:
        Tuple of (t_statistic, p_value).
    """
    err_a = np.abs(y_true - y_pred_a)
    err_b = np.abs(y_true - y_pred_b)
    diff = err_a - err_b
    t_stat, p_val = stats.ttest_rel(err_a, err_b)
    return t_stat, p_val


def identify_failure_cases(
    df: pd.DataFrame,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    field_ids: np.ndarray,
    n_worst: int = 5,
) -> pd.DataFrame:
    """
    Identify fields with highest prediction error for failure analysis.

    Args:
        df: Full DataFrame with field-level data.
        y_true: Actual yields.
        y_pred: Predicted yields.
        field_ids: Field identifiers corresponding to y_true/y_pred.
        n_worst: Number of worst cases to return.

    Returns:
        DataFrame of worst-performing fields with error and context.
    """
    errors = np.abs(y_true - y_pred)
    worst_idx = np.argsort(errors)[-n_worst:][::-1]
    results = []
    for i in worst_idx:
        results.append({
            "field_id": field_ids[i],
            "y_true": y_true[i],
            "y_pred": y_pred[i],
            "abs_error": errors[i],
        })
    return pd.DataFrame(results)


def plot_predicted_vs_actual(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    ax=None,
    title: str = "Predicted vs Actual Yield",
    save_path: Optional[str] = None,
):
    """Create predicted vs actual scatter plot."""
    import matplotlib.pyplot as plt

    if ax is None:
        fig, ax = plt.subplots(figsize=(6, 6))
    ax.scatter(y_true, y_pred, alpha=0.6, edgecolors="k", linewidth=0.5)
    lims = [min(y_true.min(), y_pred.min()) - 0.2, max(y_true.max(), y_pred.max()) + 0.2]
    ax.plot(lims, lims, "r--", label="Perfect prediction")
    ax.set_xlabel("Actual Yield (t/ha)")
    ax.set_ylabel("Predicted Yield (t/ha)")
    ax.set_title(title)
    ax.legend()
    ax.set_xlim(lims)
    ax.set_ylim(lims)
    ax.set_aspect("equal")
    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150)
    return ax


def plot_feature_importance(
    importance_df: pd.DataFrame,
    top_n: int = 15,
    ax=None,
    save_path: Optional[str] = None,
):
    """Horizontal bar plot of feature importance."""
    import matplotlib.pyplot as plt

    df = importance_df.head(top_n)
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 6))
    ax.barh(range(len(df)), df["importance"].values, align="center")
    ax.set_yticks(range(len(df)))
    ax.set_yticklabels(df["feature"].values)
    ax.invert_yaxis()
    ax.set_xlabel("Importance")
    ax.set_title("Feature Importance")
    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150)
    return ax
