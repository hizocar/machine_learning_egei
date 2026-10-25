"""Build the course dataset: a household-level teaching sample of CASEN 2022.

Source: Ministerio de Desarrollo Social y Familia, Encuesta CASEN 2022 (Stata file, current version),
https://bid-ckan.ministeriodesarrollosocial.gob.cl/dataset/60a140be-8451-4f18-8946-dc08f3717527

Usage:  python scripts/build_casen_sample.py path/to/casen_2022.dta
Writes: docs/data/casen_households.csv
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pyreadstat

N_HOUSEHOLDS = 15_000
SEED = 2026
OUT = Path(__file__).resolve().parents[1] / "docs" / "data" / "casen_households.csv"

COLS = ["folio", "pco1", "region", "area", "sexo", "edad", "esc", "educc", "activ", "o15", "o10",
        "s13", "r1a", "r3", "numper", "men18c", "may60c", "tipohogar", "ind_hacina", "ten_viv", "v1",
        "ytotcorh", "ypchtotcor", "dau", "pobreza", "expr"]

REGION = {1: "Tarapacá", 2: "Antofagasta", 3: "Atacama", 4: "Coquimbo", 5: "Valparaíso",
          6: "O'Higgins", 7: "Maule", 8: "Biobío", 9: "La Araucanía", 10: "Los Lagos", 11: "Aysén",
          12: "Magallanes", 13: "Metropolitana", 14: "Los Ríos", 15: "Arica y Parinacota", 16: "Ñuble"}


def recode(s, mapping):
    """Map labelled codes to English categories; anything unmapped ("No sabe") becomes missing."""
    return s.map(mapping).astype("object")


def main(dta):
    raw, meta = pyreadstat.read_dta(dta, usecols=COLS)
    h = raw[raw["pco1"] == 1].copy()  # one row per household: the head of household's record

    lab = lambda c: meta.value_labels[meta.variable_to_label[c]]
    by_label = lambda c, m: {code: m[text] for code, text in lab(c).items() if text in m}

    df = pd.DataFrame({
        "region": h["region"].map(REGION),
        "area": recode(h["area"], {1: "urban", 2: "rural"}),
        "head_sex": recode(h["sexo"], {1: "male", 2: "female"}),
        "head_age": h["edad"].astype(int),
        "head_schooling_years": h["esc"],
        "head_education": recode(h["educc"], by_label("educc", {
            "Sin educación formal": "0_none", "Básica incompleta": "1_primary_incomplete",
            "Básica completa": "2_primary_complete", "Media incompleta": "3_secondary_incomplete",
            "Media completa": "4_secondary_complete", "Superior incompleta": "5_tertiary_incomplete",
            "Superior completa": "6_tertiary_complete"})),
        "head_activity": recode(h["activ"], by_label("activ", {
            "Ocupados": "employed", "Desocupados": "unemployed", "Inactivos": "inactive"})),
        "head_job_type": recode(h["o15"], {1: "employer", 2: "self_employed", 3: "public_sector",
                                           4: "public_sector", 5: "private_sector", 6: "domestic_service",
                                           7: "domestic_service", 8: "armed_forces", 9: "unpaid_family"}),
        # CASEN codes "doesn't know" as -88: a missing value, not -88 hours.
        "head_weekly_hours": h["o10"].where(h["o10"] >= 0),
        "health_insurance": recode(h["s13"], {1: "fonasa", 2: "isapre", 3: "armed_forces",
                                              4: "none", 5: "other"}),
        "head_nationality": recode(h["r1a"], {1: "chilean", 2: "dual", 3: "foreign"}),
        "head_indigenous": np.where(h["r3"] == 11, "no", np.where(h["r3"].between(1, 10), "yes", None)),
        "household_size": h["numper"].astype(int),
        "has_children": recode(h["men18c"], {0: "no", 1: "yes"}),
        "has_elderly": recode(h["may60c"], {0: "no", 1: "yes"}),
        "household_type": recode(h["tipohogar"], by_label("tipohogar", {
            "Unipersonal": "single_person", "Nuclear Monoparental": "nuclear_single_parent",
            "Nuclear Biparental": "nuclear_two_parents", "Extenso Monoparental": "extended_single_parent",
            "Extenso Biparental": "extended_two_parents", "Censal": "other"})),
        "overcrowding": recode(h["ind_hacina"], {1: "0_none", 2: "1_medium", 3: "2_high", 4: "3_critical"}),
        "housing_tenure": recode(h["ten_viv"], {1: "owned", 2: "rented", 3: "lent", 4: "irregular"}),
        "dwelling_type": recode(h["v1"], {1: "house", 2: "house", 3: "house", 4: "apartment",
                                          5: "apartment", 6: "precarious", 7: "precarious",
                                          8: "precarious", 9: "precarious", 10: "precarious"}),
        # Income columns: the outcome of the regression task and a leak in the classification task.
        "household_income": h["ytotcorh"].round(0),
        "income_per_capita": h["ypchtotcor"].round(0),
        "income_decile": h["dau"],
        "poor": (h["pobreza"].isin([1, 2])).astype(int),
        "survey_weight": h["expr"],
    })

    # Sanity checks against the codebook before sampling.
    assert df["region"].notna().all() and df["poor"].between(0, 1).all()
    assert (df.select_dtypes("number").fillna(0) >= 0).all().all(), "negative survey code left in data"
    for c in ["area", "head_sex", "household_type", "housing_tenure"]:
        assert df[c].notna().all(), c

    sample = df.sample(n=N_HOUSEHOLDS, random_state=SEED).reset_index(drop=True)
    sample.insert(0, "household_id", [f"H{i:05d}" for i in range(1, len(sample) + 1)])
    sample.to_csv(OUT, index=False)
    print(f"wrote {OUT} {sample.shape}; poor share {sample['poor'].mean():.3f}")


if __name__ == "__main__":
    main(sys.argv[1])
