import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    brier_score_loss,
)
import xgboost as xgb
from app.ml.features import FEATURE_COLUMNS, engineer_features, prepare_train_test_data

class MajorityBaselineClassifier:
    """Baseline classifier predicting the most frequent training class"""
    def __init__(self):
        self.majority_class_ = 1
        self.prob_ = 0.5

    def fit(self, X, y):
        counts = pd.Series(y).value_counts(normalize=True)
        self.majority_class_ = int(counts.idxmax())
        self.prob_ = float(counts.max())
        return self

    def predict(self, X):
        return np.full(len(X), self.majority_class_)

    def predict_proba(self, X):
        prob = np.zeros((len(X), 2))
        prob[:, self.majority_class_] = self.prob_
        prob[:, 1 - self.majority_class_] = 1.0 - self.prob_
        return prob

def train_model(
    model_type: str,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> Tuple[Any, Any, Dict[str, float]]:
    """
    Fits scaler and model strictly on training data, evaluates on test data.
    """
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model_type = model_type.lower()
    if model_type == "logistic":
        clf = LogisticRegression(C=0.1, max_iter=1000, random_state=42)
    elif model_type == "rf" or model_type == "random_forest":
        clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    elif model_type == "xgboost":
        clf = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.05,
            eval_metric="logloss",
            random_state=42,
        )
    else:  # baseline
        clf = MajorityBaselineClassifier()

    clf.fit(X_train_scaled, y_train)

    y_pred = clf.predict(X_test_scaled)
    y_proba = clf.predict_proba(X_test_scaled)[:, 1]

    # Calculate metrics
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "auc_roc": (
            round(float(roc_auc_score(y_test, y_proba)), 4)
            if len(np.unique(y_test)) > 1
            else 0.5
        ),
        "brier_score": round(float(brier_score_loss(y_test, y_proba)), 4),
        "test_samples": len(y_test),
    }

    return clf, scaler, metrics

def walk_forward_validation(
    features_df: pd.DataFrame,
    model_type: str = "rf",
    window_size: int = 252,
    step_size: int = 63,
) -> Dict[str, Any]:
    """
    Chronological walk-forward validation with expanding window.
    Strictly prevents lookahead bias.
    """
    clean_df = features_df.dropna(subset=FEATURE_COLUMNS + ["target"]).copy()
    n = len(clean_df)
    if n < window_size + step_size:
        return {"error": "Insufficient data for walk-forward validation"}

    fold_metrics = []
    current_end = window_size

    while current_end + step_size <= n:
        train_data = clean_df.iloc[:current_end]
        test_data = clean_df.iloc[current_end : current_end + step_size]

        X_train = train_data[FEATURE_COLUMNS]
        y_train = train_data["target"].astype(int)
        X_test = test_data[FEATURE_COLUMNS]
        y_test = test_data["target"].astype(int)

        _, _, metrics = train_model(model_type, X_train, y_train, X_test, y_test)
        fold_metrics.append(metrics)
        current_end += step_size

    # Average metrics across all folds
    avg_metrics = {}
    for key in ["accuracy", "precision", "recall", "f1", "auc_roc", "brier_score"]:
        vals = [f[key] for f in fold_metrics if key in f]
        avg_metrics[f"avg_{key}"] = round(float(np.mean(vals)), 4) if vals else 0.0

    return {
        "model_type": model_type,
        "folds_count": len(fold_metrics),
        "average_metrics": avg_metrics,
        "fold_details": fold_metrics,
    }

def save_model_artifacts(
    symbol: str,
    model_type: str,
    model: Any,
    scaler: Any,
    model_dir: str = "/app/models",
) -> str:
    """Serializes model and scaler into a single artifact file"""
    os.makedirs(model_dir, exist_ok=True)
    filename = f"{symbol}_{model_type}_latest.joblib"
    path = os.path.join(model_dir, filename)
    joblib.dump({"model": model, "scaler": scaler, "features": FEATURE_COLUMNS}, path)
    return path

def load_model_artifacts(
    symbol: str, model_type: str, model_dir: str = "/app/models"
) -> Optional[Dict[str, Any]]:
    filename = f"{symbol}_{model_type}_latest.joblib"
    path = os.path.join(model_dir, filename)
    if not os.path.exists(path):
        return None
    return joblib.load(path)
