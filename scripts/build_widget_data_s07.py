"""Export the JSON files for the Session 7 widgets (docs/data/widgets/s07_*.json).

Same data, split and preprocessing as Sessions 5-6, so every number matches the s07 notebook:
- s07_path.json     the L1 (LASSO) logistic regularisation path: coefficients, CV AUC and the
                    number of form questions still used, for a grid of penalties
- s07_forward.json  forward selection over the 19 raw variables (questions on the form), scored
                    by cross-validated AUC
Usage:  python scripts/build_widget_data_s07.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

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

# scikit-learn 1.8 replaced penalty="l1"/"l2"/"elasticnet" with l1_ratio alone; older versions
# (still common on Colab) silently ignore l1_ratio unless penalty="elasticnet".
NEW_API = tuple(int(p) for p in sklearn.__version__.split(".")[:2]) >= (1, 8)


def penalised_logit(C, l1_ratio):
    """l1_ratio = 0 -> Ridge, 1 -> LASSO, in between -> Elastic Net."""
    solver = "liblinear" if l1_ratio in (0, 1) else "saga"
    if NEW_API:
        return LogisticRegression(C=C, l1_ratio=l1_ratio, solver=solver, max_iter=5000, random_state=0)
    penalty = {0: "l2", 1: "l1"}.get(l1_ratio, "elasticnet")
    extra = {"l1_ratio": l1_ratio} if penalty == "elasticnet" else {}
    return LogisticRegression(C=C, penalty=penalty, solver=solver, max_iter=5000, random_state=0, **extra)


def preprocessor(num, hours, cat):
    parts = []
    if num:
        parts.append(("num", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), num))
    if hours:
        parts.append(("hours", make_pipeline(SimpleImputer(strategy="constant", fill_value=0),
                                             StandardScaler()), hours))
    if cat:
        parts.append(("cat", make_pipeline(SimpleImputer(strategy="constant", fill_value="missing"),
                                           OneHotEncoder(handle_unknown="ignore")), cat))
    return ColumnTransformer(parts)


def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, separators=(",", ":")))
    print("wrote", name)


def question_of(feature):
    """Map a transformed column name (e.g. 'cat__region_Maule') back to its raw variable."""
    body = feature.split("__", 1)[1]
    for v in NUM + HOURS + CAT:
        if body == v or body.startswith(v + "_"):
            return v
    raise ValueError(feature)


# --- 1. The LASSO path ------------------------------------------------------------------------
Cs = np.logspace(-3, 1, 40)
rows, coefs = [], []
for C in Cs:
    model = Pipeline([("pre", preprocessor(NUM, HOURS, CAT)), ("clf", penalised_logit(C, 1))])
    auc = cross_val_score(model, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=-1)
    model.fit(X_train, y_train)
    names = model.named_steps["pre"].get_feature_names_out()
    b = model.named_steps["clf"].coef_[0]
    used = sorted({question_of(n) for n, v in zip(names, b) if v != 0})
    rows.append({"C": float(C), "auc": float(auc.mean()), "auc_sd": float(auc.std()),
                 "auc_se": float(auc.std() / np.sqrt(cv.get_n_splits())),
                 "nonzero": int((b != 0).sum()), "questions": len(used)})
    coefs.append(b)
coefs = np.array(coefs)
best = int(np.argmax([r["auc"] for r in rows]))
# 1-SE rule (ISLR/ESL): the most penalised (smallest C) model whose CV AUC is within one standard
# error of the best, where SE = fold sd / sqrt(K).
one_se = min(i for i, r in enumerate(rows) if r["auc"] >= rows[best]["auc"] - rows[best]["auc_se"])
for tag, i in [("best", best), ("1-SE", one_se)]:
    r = rows[i]
    print(f"{tag}: C={r['C']:.4f} CV AUC={r['auc']:.4f} (SE {r['auc_se']:.4f}, sd {r['auc_sd']:.4f}) "
          f"non-zero={r['nonzero']}/{len(names)} questions={r['questions']}/19")

# Ridge and Elastic Net at their own CV-best C, for the comparison table.
for label, l1r in [("ridge", 0), ("elastic net (0.5)", 0.5)]:
    scores = []
    for C in np.logspace(-3, 1, 9):
        m = Pipeline([("pre", preprocessor(NUM, HOURS, CAT)), ("clf", penalised_logit(C, l1r))])
        scores.append((cross_val_score(m, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=-1).mean(), C))
    print(label, "best CV AUC %.3f at C=%.4f" % max(scores))

keep = np.abs(coefs).max(axis=0) > 0
dump("s07_path.json", {
    "C": [round(r["C"], 6) for r in rows],
    "auc": [round(r["auc"], 4) for r in rows],
    "auc_sd": [round(r["auc_sd"], 4) for r in rows],
    "auc_se": [round(r["auc_se"], 4) for r in rows],
    "nonzero": [r["nonzero"] for r in rows],
    "questions": [r["questions"] for r in rows],
    "best": best, "one_se": one_se, "n_columns": len(names), "n_questions": len(NUM + HOURS + CAT),
    "features": [n.split("__", 1)[1] for n, k in zip(names, keep) if k],
    "groups": [question_of(n) for n, k in zip(names, keep) if k],
    "coef": np.round(coefs[:, keep].T, 4).tolist(),   # one list per feature, across the C grid
})

# --- 2. Forward selection over the raw variables (the questions on the form) ------------------
RAW = NUM + HOURS + CAT
chosen, steps = [], []
while len(chosen) < len(RAW):
    trial = []
    for v in RAW:
        if v in chosen:
            continue
        cols = chosen + [v]
        model = Pipeline([
            ("pre", preprocessor([c for c in cols if c in NUM], [c for c in cols if c in HOURS],
                                 [c for c in cols if c in CAT])),
            ("clf", LogisticRegression(max_iter=3000)),
        ])
        s = cross_val_score(model, X_train[cols], y_train, cv=cv, scoring="roc_auc", n_jobs=-1)
        trial.append((s.mean(), s.std(), v))
    auc, sd, v = max(trial)
    chosen.append(v)
    steps.append({"add": v, "auc": round(float(auc), 4), "sd": round(float(sd), 4)})
    print(f"step {len(chosen):2d}: + {v:22s} CV AUC {auc:.3f}")
full = steps[-1]["auc"]
enough = next(i for i, s in enumerate(steps) if s["auc"] >= full - 0.01)
print(f"smallest set within 0.01 of the full model: {enough + 1} variables")
dump("s07_forward.json", {"steps": steps, "full": full, "enough": enough})
