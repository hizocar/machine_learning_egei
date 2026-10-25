---
hide:
  - navigation
---

# The Case: Who Should Get the Subsidy?

<div class="usm-session-meta">
<span>The thread that runs through every session</span>
<span class="usm-tag-gold">Data: CASEN 2022 · Chile</span>
</div>

Every session in this course works on **the same problem and the same data**. Each new method
answers the next question that problem raises, and nothing gets used before it has been taught.

## The problem

Governments in emerging economies spend a large share of their social budget on programmes
**targeted at poor households**. To target, you need to know who is poor, and that usually means
income. But income is hard to observe: much of it is informal, people have reasons to under-report
it, and verifying it household by household is expensive.

The standard answer is a **proxy means test**: predict a household's welfare from characteristics
that are easy to observe and hard to fake, such as schooling, household size, type of dwelling or
health insurance. Chile's *Registro Social de Hogares*, Mexico's *Progresa/Prospera* and many
World Bank–supported programmes use versions of this idea.

That is a machine learning problem, with all of its difficulties:

| Question | Where we meet it |
|---|---|
| What kind of data do we have about a household? | Session 1 · Data types |
| How do we build one clean row per household? | Session 2 · Data manipulation |
| Can we predict income from what we observe? How wrong are we? | Session 3 · ML models |
| Is the error we report honest, or did we fool ourselves? | Session 4 · The ML pipeline |
| Who is poor? Which mistakes matter more? | Session 5 · Classification |
| Can more flexible models do better, and at what cost? | Session 6 · Trees and ensembles |
| Which variables do we really need? | Session 7 · Selection and shrinkage |
| What types of households are there, without labels? | Session 8 · PCA and clustering |

## The data

[**CASEN**](https://observatorio.ministeriodesarrollosocial.gob.cl/) (*Encuesta de Caracterización
Socioeconómica Nacional*) is Chile's main household survey, run by the Ministry of Social
Development and Family. The 2022 round interviewed about 72,000 households. We use a **random
sample of 15,000 households**, one row each, built from the record of the head of household.

[⬇️ Download `casen_households.csv`](data/casen_households.csv){.usm-btn}

```python
import pandas as pd
url = "https://raw.githubusercontent.com/hizocar/machine_learning_egei/main/docs/data/casen_households.csv"
df = pd.read_csv(url)
```

### Data dictionary

| Column | Type | Description |
|---|---|---|
| `household_id` | id | Course identifier (not the CASEN folio) |
| `region` | nominal | Region of residence (16 regions) |
| `area` | nominal | `urban` / `rural` |
| `head_sex` | nominal | Sex of the head of household |
| `head_age` | continuous | Age of the head of household |
| `head_schooling_years` | discrete | Years of schooling of the head (*missing = doesn't know*) |
| `head_education` | **ordinal** | Highest level reached, `0_none` … `6_tertiary_complete` |
| `head_activity` | nominal | `employed` / `unemployed` / `inactive` |
| `head_job_type` | nominal | Type of job; **missing when the head does not work** |
| `head_weekly_hours` | continuous | Usual weekly hours; **missing when the head does not work**, and for 87 employed heads who did not know |
| `health_insurance` | nominal | `fonasa` (public), `isapre` (private), `armed_forces`, `none`, `other` |
| `head_nationality` | nominal | `chilean` / `dual` / `foreign` |
| `head_indigenous` | nominal | Belongs to an indigenous people (`yes` / `no`) |
| `household_size` | discrete | Number of people in the household |
| `has_children`, `has_elderly` | binary | Anyone under 18 / over 60 in the household |
| `household_type` | nominal | Single person, nuclear, extended, … |
| `overcrowding` | **ordinal** | People per bedroom, `0_none` … `3_critical` |
| `housing_tenure` | nominal | `owned` / `rented` / `lent` / `irregular` |
| `dwelling_type` | nominal | `house` / `apartment` / `precarious` |
| `household_income` | continuous | ⚠️ Total household income, CLP per month |
| `income_per_capita` | continuous | ⚠️ Total income per person, CLP per month |
| `income_decile` | ordinal | ⚠️ National income decile (1 = poorest) |
| `poor` | **target** | 1 if the household is in income poverty |
| `survey_weight` | weight | Expansion factor (how many households each row represents) |

!!! warning "The ⚠️ columns: target in one task, leak in another"
    Income is the *target* when we predict income (Sessions 3–4). When we predict poverty
    (Session 5 onwards), income is **off limits**: poverty is defined from income per capita, and
    the whole point of a proxy means test is that income is not observed. A model that uses it
    scores brilliantly and is useless. Learning to spot this is part of the course.

!!! info "Two things to know about the numbers"
    - **Poverty measure.** `poor` uses the *updated* poverty methodology published in the current
      CASEN 2022 database: 23% of households in our sample and about 20% of people (weighted)
      are poor. Under the old 2013 methodology the official 2022 figure was 6.5%.
    - **Weights.** CASEN is a complex survey. For official statistics you would use
      `survey_weight`. For our prediction exercises we treat each household as one example; when
      a result is meant to describe Chile as a whole, we say so and weight it.

**Source:** Ministerio de Desarrollo Social y Familia, *Encuesta CASEN 2022*, current Stata
database ([data catalogue](https://bid-ckan.ministeriodesarrollosocial.gob.cl/dataset/60a140be-8451-4f18-8946-dc08f3717527)).
The sample is rebuilt with `scripts/build_casen_sample.py` in the
[course repository](https://github.com/hizocar/machine_learning_egei).
