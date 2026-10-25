"""Export the JSON files the Session 8 widgets read (docs/data/widgets/s08_*.json).

Same household features, scaling and seeds as docs/notebooks/s08_unsupervised.ipynb, so the
interactive figures show the numbers students reproduce in Colab. Income and `poor` are never
clustering inputs: `poor` is only attached afterwards, to describe the clusters.
Usage:  python scripts/build_widget_data_s08.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, kmeans_plusplus
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "data" / "widgets"
OUT.mkdir(parents=True, exist_ok=True)
df = pd.read_csv(ROOT / "docs" / "data" / "casen_households.csv")


def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, separators=(",", ":")))
    print("wrote", name)


def weekly_hours(df):
    """Hours worked by the head: 0 if not working; employed but "doesn't know" -> workers' median."""
    h = df["head_weekly_hours"]
    h = h.fillna(h.median()).where(df["head_activity"] == "employed", 0)
    return h


def household_features(df):
    """The ten clustering inputs: who lives in the household and how, never income or poverty."""
    return pd.DataFrame({
        "head_age": df["head_age"],
        "head_schooling_years": df["head_schooling_years"].fillna(df["head_schooling_years"].median()),
        "household_size": df["household_size"],
        "head_weekly_hours": weekly_hours(df),
        "has_children": (df["has_children"] == "yes").astype(int),
        "has_elderly": (df["has_elderly"] == "yes").astype(int),
        "rural": (df["area"] == "rural").astype(int),
        "head_female": (df["head_sex"] == "female").astype(int),
        "owns_home": (df["housing_tenure"] == "owned").astype(int),
        "overcrowded": (df["overcrowding"].fillna("0_none") != "0_none").astype(int),
    })


F = household_features(df)
Z = StandardScaler().fit_transform(F)
pca = PCA().fit(Z)
scores = pca.transform(Z)

# --- Widget 1: PCA on two standardised variables, plus the full 10-variable PCA ----------------
two = df[["head_age", "head_schooling_years"]].dropna()
z2 = StandardScaler().fit_transform(two)
p2 = PCA().fit(z2)
idx = np.random.default_rng(8).choice(len(z2), 300, replace=False)
pc1 = p2.components_[0]
if pc1[0] < 0:          # orient PC1 so that it points towards older heads
    pc1 = -pc1
dump("s08_pca2.json", {
    "x": z2[idx, 0].round(3).tolist(),
    "y": z2[idx, 1].round(3).tolist(),
    "names": ["head_age", "head_schooling_years"],
    "r": round(float(np.corrcoef(z2.T)[0, 1]), 3),
    "pc1": pc1.round(4).tolist(),
    "evr2": p2.explained_variance_ratio_.round(3).tolist(),
    "evr_full": pca.explained_variance_ratio_.round(3).tolist(),
    "features": list(F.columns),
})

# --- Widget 2: k-means steps on the first two PCA scores of 400 households -------------------
pts = scores[np.random.default_rng(42).choice(len(scores), 400, replace=False), :2]
inits, final_inertia = {}, {}
for k in range(2, 7):
    c0, _ = kmeans_plusplus(pts, n_clusters=k, random_state=k)
    inits[str(k)] = c0.round(3).tolist()
    final_inertia[str(k)] = round(float(KMeans(k, init=c0, n_init=1).fit(pts).inertia_), 1)
dump("s08_kmeans.json", {
    "x": pts[:, 0].round(3).tolist(),
    "y": pts[:, 1].round(3).tolist(),
    "init": inits,
    "final_inertia": final_inertia,   # what Lloyd's algorithm converges to from these starts
})

# --- Widget 3: elbow, silhouette and cluster profiles ----------------------------------------
sample = np.random.default_rng(0).choice(len(Z), 3000, replace=False)
curve, profiles = [], {}
SHOW = ["head_age", "head_schooling_years", "household_size", "head_weekly_hours",
        "has_children", "has_elderly", "owns_home", "overcrowded", "rural"]
for k in range(2, 9):
    km = KMeans(k, n_init=50, random_state=42).fit(Z)
    curve.append({"k": k, "inertia": round(float(km.inertia_)),
                  "silhouette": round(float(silhouette_score(Z[sample], km.labels_[sample])), 3)})
    if k <= 6:
        g = F.assign(cluster=km.labels_, poor=df["poor"]).groupby("cluster")
        prof = g[SHOW + ["poor"]].mean()
        prof["n"] = g.size()
        prof = prof.sort_values("n", ascending=False)   # clusters ordered by size, largest first
        profiles[str(k)] = [
            {"n": int(r["n"]), "poor": round(float(r["poor"]), 3),
             **{c: round(float(r[c]), 2) for c in SHOW}}
            for _, r in prof.iterrows()
        ]
dump("s08_clusters.json", {
    "curve": curve,
    "profiles": profiles,
    "overall_poor": round(float(df["poor"].mean()), 3),
    "n": len(df),
})
