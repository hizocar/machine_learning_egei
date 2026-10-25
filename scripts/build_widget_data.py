"""Export the small JSON files the interactive widgets read (docs/data/widgets/*.json).

Every number a widget shows comes from the same course dataset and the same models as the session
notebooks, so what students see on the page matches what they reproduce in Colab.
Usage:  python scripts/build_widget_data.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "data" / "widgets"
OUT.mkdir(parents=True, exist_ok=True)
df = pd.read_csv(ROOT / "docs" / "data" / "casen_households.csv")


def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, separators=(",", ":")))
    print("wrote", name)


# --- Session 4: KNN on log income per capita -------------------------------------------------
reg = df[(df.income_per_capita > 0)].dropna(subset=["head_age", "head_schooling_years", "household_size"])
reg = reg.assign(log_income_pc=np.log(reg.income_per_capita))
pts = reg.sample(400, random_state=7)
is_test = np.zeros(len(pts), dtype=int)
is_test[np.random.default_rng(7).choice(len(pts), 100, replace=False)] = 1
dump("s04_knn.json", {
    "x": pts.head_schooling_years.astype(int).tolist(),
    "y": pts.log_income_pc.round(3).tolist(),
    "test": is_test.tolist(),
})

FEATS = ["head_age", "head_schooling_years", "household_size"]
X, y = reg[FEATS], reg.log_income_pc
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
cv = KFold(5, shuffle=True, random_state=42)
folds = {}
for k in [1, 5, 25, 100, 400]:
    s = -cross_val_score(make_pipeline(StandardScaler(), KNeighborsRegressor(k)), X_tr, y_tr,
                         cv=cv, scoring="neg_root_mean_squared_error")
    folds[str(k)] = s.round(3).tolist()
dump("s04_cv.json", {"folds": folds, "baseline": round(float(np.sqrt(((y_te - y_tr.mean()) ** 2).mean())), 3)})

# --- Session 5: logistic regression scores on the test set -----------------------------------
NUM = ["head_age", "head_schooling_years", "household_size"]
HOURS = ["head_weekly_hours"]  # missing = the head does not work, so 0 hours, not "unknown"
CAT = ["region", "area", "head_sex", "head_activity", "head_job_type", "health_insurance",
       "head_nationality", "head_indigenous", "has_children", "has_elderly", "household_type",
       "housing_tenure", "dwelling_type", "overcrowding", "head_education"]
pre = ColumnTransformer([
    ("num", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), NUM),
    ("hours", make_pipeline(SimpleImputer(strategy="constant", fill_value=0), StandardScaler()), HOURS),
    ("cat", make_pipeline(SimpleImputer(strategy="constant", fill_value="missing"),
                          OneHotEncoder(handle_unknown="ignore")), CAT),
])
X, y = df[NUM + HOURS + CAT], df.poor
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)
model = Pipeline([("pre", pre), ("clf", LogisticRegression(max_iter=3000))]).fit(X_tr, y_tr)
p = model.predict_proba(X_te)[:, 1]
dump("s05_scores.json", {"p": np.round(p, 5).tolist(), "y": y_te.astype(int).tolist()})
from sklearn.metrics import roc_auc_score, recall_score, precision_score
for t in (0.2, 0.5):
    print(f"t={t} recall={recall_score(y_te, p > t):.3f} precision={precision_score(y_te, p > t):.3f}")
print(f"AUC={roc_auc_score(y_te, p):.3f} accuracy@0.5={((p > 0.5) == y_te).mean():.3f} majority={1 - y_te.mean():.3f}")

# One-feature logistic curve: P(poor | schooling years), for the sigmoid widget.
one = df.dropna(subset=["head_schooling_years"]).sample(400, random_state=3)
lr = LogisticRegression().fit(one[["head_schooling_years"]], one.poor)
dump("s05_sigmoid.json", {
    "x": one.head_schooling_years.astype(int).tolist(),
    "y": one.poor.astype(int).tolist(),
    "b0": round(float(lr.intercept_[0]), 3),
    "b1": round(float(lr.coef_[0][0]), 3),
})
