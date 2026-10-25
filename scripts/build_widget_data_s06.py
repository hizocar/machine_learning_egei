"""Export the JSON files the Session 6 widgets read (docs/data/widgets/s06_*.json).

Same data, split, folds and models as docs/notebooks/s06_trees.ipynb, so every number a widget shows
is one students can reproduce in Colab.
Usage:  python scripts/build_widget_data_s06.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict, cross_validate, train_test_split
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "data" / "widgets"
OUT.mkdir(parents=True, exist_ok=True)
df = pd.read_csv(ROOT / "docs" / "data" / "casen_households.csv")

NUM = ["head_age", "head_schooling_years", "household_size"]
HOURS = ["head_weekly_hours"]
CAT = ["region", "area", "head_sex", "head_activity", "head_job_type", "health_insurance",
       "head_nationality", "head_indigenous", "has_children", "has_elderly", "household_type",
       "housing_tenure", "dwelling_type", "overcrowding", "head_education"]
X, y = df[NUM + HOURS + CAT], df["poor"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

pre_logit = ColumnTransformer([
    ("num", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), NUM),
    ("hours", make_pipeline(SimpleImputer(strategy="constant", fill_value=0), StandardScaler()), HOURS),
    ("cat", make_pipeline(SimpleImputer(strategy="constant", fill_value="missing"),
                          OneHotEncoder(handle_unknown="ignore")), CAT),
])
# Trees need no scaling; the one-hot output is dense because gradient boosting requires it.
pre_tree = ColumnTransformer([
    ("num", SimpleImputer(strategy="median"), NUM),
    ("hours", SimpleImputer(strategy="constant", fill_value=0), HOURS),
    ("cat", make_pipeline(SimpleImputer(strategy="constant", fill_value="missing"),
                          OneHotEncoder(handle_unknown="ignore", sparse_output=False)), CAT),
])
MODELS = {
    "Logit (Session 5)": Pipeline([("pre", pre_logit), ("clf", LogisticRegression(max_iter=3000))]),
    "Tree (depth 4)": Pipeline([("pre", pre_tree), ("clf", DecisionTreeClassifier(max_depth=4, random_state=42))]),
    "Random forest": Pipeline([("pre", pre_tree), ("clf", RandomForestClassifier(
        n_estimators=300, min_samples_leaf=5, n_jobs=-1, random_state=42))]),
    "Gradient boosting": Pipeline([("pre", pre_tree), ("clf", HistGradientBoostingClassifier(random_state=42))]),
}


def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, separators=(",", ":"), ensure_ascii=False))
    print("wrote", name)


def cost_threshold(p, y_true):
    """Threshold minimising 3*FN + 1*FP over a 0.01 grid."""
    ts = np.round(np.arange(0.02, 0.90, 0.01), 2)
    cost = [3 * ((p < t) & (y_true == 1)).sum() + ((p >= t) & (y_true == 0)).sum() for t in ts]
    return float(ts[int(np.argmin(cost))])


# --- 1. tree-split: poverty counts by value of three numeric variables (training set) ----------
split = {}
for col, label in [("head_schooling_years", "Years of schooling (head)"),
                   ("household_size", "Household size"), ("head_age", "Age of the head")]:
    d = pd.DataFrame({"v": X_train[col], "y": y_train}).dropna()
    g = d.groupby(d["v"].astype(int))["y"].agg(["count", "sum"]).reset_index()
    split[col] = {"label": label, "v": g["v"].tolist(), "n": g["count"].tolist(), "poor": g["sum"].tolist()}
dump("s06_split.json", split)

# --- 2. tree-depth: train vs CV AUC by depth, and the real fitted tree up to depth 3 ------------
depths = list(range(1, 13))
train_auc, cv_auc = [], []
for dpt in depths:
    m = Pipeline([("pre", pre_tree), ("clf", DecisionTreeClassifier(max_depth=dpt, random_state=42))])
    r = cross_validate(m, X_train, y_train, cv=cv, scoring="roc_auc", return_train_score=True)
    train_auc.append(round(float(r["train_score"].mean()), 3))
    cv_auc.append(round(float(r["test_score"].mean()), 3))

tree3 = Pipeline([("pre", pre_tree), ("clf", DecisionTreeClassifier(max_depth=3, random_state=42))]).fit(X_train, y_train)
names = tree3.named_steps["pre"].get_feature_names_out()
t = tree3.named_steps["clf"].tree_


def readable(i):
    """Turn a split on a (possibly one-hot) column into a yes/no question."""
    raw, thr = names[t.feature[i]], t.threshold[i]
    kind, col = raw.split("__", 1)
    if kind == "cat":
        base = next(c for c in CAT if col.startswith(c + "_"))
        return f"{base.replace('_', ' ')} = {col[len(base) + 1:].replace('_', ' ')}?", True
    return f"{col.replace('_', ' ')} ≤ {thr:.1f}?", False


nodes = []


def walk(i, depth, parent, branch):
    n = int(t.n_node_samples[i])
    share = float(t.value[i][0][1])  # sklearn stores class proportions per node
    node = {"id": int(i), "depth": depth, "parent": None if parent is None else int(parent), "branch": branch, "n": n, "poor": round(share, 3)}
    if t.children_left[i] != -1:
        q, onehot = readable(i)
        node["q"] = q
        # left child = condition true for numeric (≤), = category absent ("no") for one-hot
        left_lbl, right_lbl = ("no", "yes") if onehot else ("yes", "no")
        nodes.append(node)
        walk(t.children_left[i], depth + 1, i, left_lbl)
        walk(t.children_right[i], depth + 1, i, right_lbl)
    else:
        nodes.append(node)


walk(0, 0, None, None)
dump("s06_depth.json", {"depth": depths, "train": train_auc, "cv": cv_auc, "tree": nodes})

# --- 3/4. Models: CV and test AUC, thresholds; forest votes for two households ---------------
race, fitted = [], {}
for name, model in MODELS.items():
    r = cross_validate(model, X_train, y_train, cv=cv, scoring="roc_auc", return_train_score=True)
    oof = cross_val_predict(model, X_train, y_train, cv=cv, method="predict_proba")[:, 1]
    thr = cost_threshold(oof, y_train.to_numpy())
    model.fit(X_train, y_train)
    fitted[name] = model
    p = model.predict_proba(X_test)[:, 1]
    yt = y_test.to_numpy()
    race.append({
        "model": name,
        "train": round(float(r["train_score"].mean()), 3),
        "folds": np.round(r["test_score"], 3).tolist(),
        "cv": round(float(r["test_score"].mean()), 3),
        "sd": round(float(r["test_score"].std()), 3),
        "test": round(float(roc_auc_score(yt, p)), 3),
        "threshold": thr,
        "recall": round(float(recall_score(yt, p >= thr)), 3),
        "precision": round(float(precision_score(yt, p >= thr)), 3),
        "cost": int(3 * ((p < thr) & (yt == 1)).sum() + ((p >= thr) & (yt == 0)).sum()),
    })
    print(race[-1])
dump("s06_race.json", race)

rf = fitted["Random forest"]
Z = rf.named_steps["pre"].transform(X_test)
forest = rf.named_steps["clf"]
votes = np.array([est.predict_proba(Z)[:, 1] for est in forest.estimators_])  # trees x households
p_rf = forest.predict_proba(Z)[:, 1]
spread = votes.std(axis=0)
# Two contrasting test households: one the forest is fairly sure is poor, one it is unsure about.
sure = int(np.argmax(np.where(y_test.to_numpy() == 1, p_rf, -1)))
unsure = int(np.argmax(-np.abs(p_rf - 0.3) - (spread < 0.15)))


def describe(i):
    r = X_test.iloc[i]
    hours = "not working" if pd.isna(r["head_weekly_hours"]) else f"{int(r['head_weekly_hours'])} h/week"
    school = "?" if pd.isna(r["head_schooling_years"]) else int(r["head_schooling_years"])
    return (f"{r['region']}, {r['area']} · {int(r['household_size'])} people · head aged {int(r['head_age'])}, "
            f"{school} years of schooling, {hours} · {r['housing_tenure']} {r['dwelling_type']}")


dump("s06_forest.json", {"households": [
    {"label": lbl, "desc": describe(i), "poor": int(y_test.iloc[i]),
     "votes": np.round(votes[:, i], 3).tolist(), "forest": round(float(p_rf[i]), 3)}
    for lbl, i in [("Household A", sure), ("Household B", unsure)]
]})
