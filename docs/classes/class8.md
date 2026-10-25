# Session 8 · Unlabeled Data: What Types of Households Are There?

<div class="usm-session-meta">
<span>Friday 20 November 2026</span>
<span>13:00 – 16:00</span>
<a class="usm-tag-gold" href="../../program/#5-course-contents" title="Block F of the course contents in the Program">Syllabus block F · Unlabeled data</a>
<span>Checkpoint 1 feedback · project clinic</span>
</div>

<div class="usm-actions usm-session-actions">
<a class="usm-primary" href="../../notebooks/s08_unsupervised/">Notebook</a>
<a href="https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s08_unsupervised.ipynb" target="_blank" rel="noopener">Open in Colab</a>
<a href="#check-your-understanding">Check your understanding</a>
</div>

!!! info "Two halves today"
    The first two hours cover PCA and clustering. The last 50 minutes are the **project clinic**:
    you get your Checkpoint 1 feedback and work on the final delivery with the instructor
    going group by group. Bring your notebook.

## ❓ Today's question

> Social programmes are designed for *profiles*: older people living alone, young families with
> children, overcrowded households. Each needs a different offer. **What types of households are
> there, if we never tell the algorithm who is poor?** And once we have them, how different is
> poverty from one type to another?

## 🔁 What you already know

Everything so far was **supervised**: every model learned from an answer, either income
([Sessions 3–4](class4.md)) or the label `poor` ([Sessions 5–7](class5.md)). From
[Session 4](class4.md) you know why distances need `StandardScaler`. From Session 2 you know
`groupby`, which is all you need to describe a group.

## ✨ New today

| Tool | What it is for |
|---|---|
| **Unsupervised learning** | Find structure in the features when there is no target |
| `PCA` · `explained_variance_ratio_` · `components_` | Summarise many correlated variables in a few new axes, and see what each axis is made of |
| `KMeans` (`n_clusters`, `n_init`, `random_state`, `inertia_`) | Split households into k groups of similar profiles |
| The elbow · `silhouette_score` | Two imperfect guides for choosing k |
| `scipy` `linkage` · `dendrogram` · `fcluster` | Hierarchical clustering, a second opinion on the same data |
| **Cluster profiling** | Describe each cluster in the original units, and only then look at the label |

## 🗓️ Agenda (3 hours)

| Time | Block |
|---|---|
| 13:00 – 13:10 | Recap: from supervised to unsupervised |
| 13:10 – 14:10 | PCA · k-means · choosing k |
| 14:10 – 14:25 | Break |
| 14:25 – 15:10 | **Lab:** profile the clusters, then look at poverty |
| 15:10 – 16:00 | **Project clinic:** Checkpoint 1 feedback and questions on the final delivery |

## 📖 Contents

### 1. No target, only features

In supervised learning, the error tells you whether you are right. In unsupervised learning
there is no answer to check against, so the questions change:

| Supervised (Sessions 3–7) | Unsupervised (today) |
|---|---|
| "How well do we predict `poor`?" | "Which households resemble each other?" |
| Test error decides | No test error. Usefulness and stability decide |
| The target guides the model | The **variables you choose** guide the model |

That last row is the key to today. We describe a household with ten variables about who lives in
it and how: the head's age, schooling and weekly hours (0 if not working), female head, household
size, children under 18, people over 60, rural, owns the home, overcrowded. **Income and `poor` are
never inputs.** Poverty only enters at the end, to describe the groups.

!!! warning "One column, two meanings of *missing*"
    `head_weekly_hours` is missing for heads who do not work (those get **0**) and for 87 working
    heads who did not know their hours. In the raw survey CASEN codes that "doesn't know" as −88, a
    trap the course file already removes. For those 87 heads, 0 would be wrong, so the notebook gives
    them the median hours of the people who work.

### 2. PCA: the direction of most spread

Picture the cloud of households on two axes, age and schooling (both standardised). Older heads
had less schooling, so the cloud leans: it is long in one direction and narrow in the other.
**PCA rotates the axes** so that the first one, **PC1**, runs along the long side, and **PC2**
is perpendicular to it. Nothing about the households changes. We only describe them in better
coordinates.

<div class="ml-widget" data-widget="pca-rotate"></div>

Formally, PC1 is the unit vector $w$ that maximises the variance of the projections $z_i = w^\top x_i$.
In plain words: among all ways of reducing each household to one number, PC1 keeps the most of how
households differ. Each component has:

- **loadings** (`components_`): how much each original variable contributes;
- **explained variance ratio**: the share of total variance it captures;
- **scores**: each household's coordinate on it.

With all ten variables, PC1 explains **31%** of the variance and PC1 + PC2 together **45%**:

| Variable | PC1 loading | PC2 loading |
|---|---:|---:|
| `head_age` | **0.50** | 0.13 |
| `has_elderly` | **0.46** | 0.15 |
| `owns_home` | 0.24 | 0.20 |
| `household_size` | −0.26 | **0.60** |
| `has_children` | **−0.37** | **0.48** |
| `overcrowded` | −0.16 | 0.36 |
| `head_schooling_years` | −0.34 | −0.31 |
| `head_weekly_hours` | −0.35 | −0.23 |

**PC1 ≈ life stage:** older, retired homeowners versus working heads with children. **PC2 ≈ size and
crowding.** You need six components to pass 80%: household life does not collapse into a single
index.

!!! info "From econometrics to ML"
    - PCA is close to **factor analysis** and to the indices you have seen built from survey
      variables. The DHS *wealth index* is the first principal component of household assets
      (Filmer & Pritchett, 2001), and PCA-based welfare indices are themselves used for targeting.
    - PCs are **uncorrelated by construction**. Using the first few as regressors is
      *principal components regression* (ISLR §6.3), a remedy for multicollinearity.
    - A component has **no causal meaning**. "Life stage" is a name *we* give to a direction.
    - Clustering has **no ground truth**: unlike a regression, there is no residual or test error
      that says you got it right. You judge clusters by stability and by usefulness.

### 3. k-means: assign, update, repeat

k-means looks for k groups whose members are close to their group's centre, the **centroid**.
It alternates two steps until nobody switches:

1. **Assign** each household to its nearest centroid.
2. **Update** each centroid to the mean of its households.

Each step can only lower the **inertia**, the total squared distance from households to their
centroids: $\sum_i \lVert x_i - \mu_{c(i)} \rVert^2$. Press *Step* and watch both moves on real
households, drawn on the first two principal components:

<div class="ml-widget" data-widget="kmeans-steps"></div>

!!! example "Worked example by hand"
    Six households, two standardised variables: age of head ($z_\text{age}$, positive = older)
    and household size ($z_\text{size}$, positive = larger). k = 2, starting centroids at
    households A and D.

    | | A | B | C | D | E | F |
    |---|---:|---:|---:|---:|---:|---:|
    | $z_\text{age}$ | 1.0 | 1.2 | 0.8 | −1.0 | −0.6 | 0.2 |
    | $z_\text{size}$ | −0.5 | −1.0 | 0.0 | 1.0 | 0.4 | 0.6 |

    **Assign.** Squared distance to $c_1 = (1.0, -0.5)$ and to $c_2 = (-1.0, 1.0)$:

    - B: $(0.2^2 + 0.5^2) = 0.29$ vs $(2.2^2 + 2.0^2) = 8.84$ → cluster 1
    - C: $(0.2^2 + 0.5^2) = 0.29$ vs $(1.8^2 + 1.0^2) = 4.24$ → cluster 1
    - E: $(1.6^2 + 0.9^2) = 3.37$ vs $(0.4^2 + 0.6^2) = 0.52$ → cluster 2
    - F: $(0.8^2 + 1.1^2) = 1.85$ vs $(1.2^2 + 0.4^2) = 1.60$ → cluster 2 (a close call)

    **Update.** Cluster 1 = {A, B, C}: $c_1 = \big(\tfrac{1.0+1.2+0.8}{3}, \tfrac{-0.5-1.0+0.0}{3}\big) = (1.0, -0.5)$.
    Cluster 2 = {D, E, F}: $c_2 = \big(\tfrac{-1.0-0.6+0.2}{3}, \tfrac{1.0+0.4+0.6}{3}\big) = (-0.47, 0.67)$.

    **Assign again.** F is now at $0.45$ from $c_2$ and $1.85$ from $c_1$, so it stays. Nobody
    switches: **converged.** Inertia $= 0.58 + 0.93 = 1.51$.

    Reading: cluster 1 is *older, smaller households*; cluster 2 is *younger, larger households*.

### 4. Local minima: why `n_init` matters

k-means only ever moves "downhill" from where it starts, so a bad start can leave it stuck. With
k = 4 and one run per seed, five seeds give inertias from **87,198 to 95,803** and visibly
different clusters. `n_init=50` runs the algorithm 50 times and keeps the run with the lowest
inertia. On this data, `n_init=10` with `random_state=42` still ends in a worse solution (90,043),
so we use 50. Report `n_init` and `random_state` with every clustering result.

### 5. Choosing k

Inertia always falls as k grows: with k = 15,000, every household is its own cluster. So we look for
an **elbow**, where extra clusters stop paying off. The **silhouette** compares, for each
household, the mean distance to its own cluster ($a$) with the mean distance to the nearest
other cluster ($b$): $s = (b - a) / \max(a, b)$. It runs from −1 to 1, and higher means better
separated.

<div class="ml-widget" data-widget="cluster-profile"></div>

| k | Inertia | Silhouette |
|---:|---:|---:|
| 2 | 114,527 | 0.228 |
| 3 | 99,309 | **0.251** |
| 4 | 87,197 | 0.219 |
| 5 | 78,908 | 0.218 |
| 6 | 73,732 | 0.217 |

An honest reading: **there is no sharp elbow, and every silhouette is low.** Households form a
continuum, not islands. That is normal with social data, and you should say so. The silhouette
prefers k = 3, but k = 3 puts families with and without children in one group (57% with
children), which is exactly the distinction a family programme cares about. Going from 3 to 4
clusters still cuts inertia by 12,100, while from 4 to 5 the gain drops to 8,300. We take
**k = 4**, and we say why.

### 6. Profile first, then look at poverty

A cluster is a number until you describe it in the original units:

| | Older households | Families with children | Working adults, no children | Overcrowded families |
|---|---:|---:|---:|---:|
| Households | 5,888 | 4,599 | 3,934 | 579 |
| Age of head | 70 | 43 | 46 | 42 |
| Weekly hours worked | 9 | 33 | 37 | 31 |
| With children | 8% | 100% | 0% | 89% |
| With someone 60+ | 97% | 13% | 13% | 20% |
| Owns the home | 80% | 52% | 45% | 32% |
| Overcrowded | 0% | 0% | 0% | 100% |
| **Poverty rate** (revealed last) | 23.7% | 26.4% | **15.8%** | **40.2%** |

The algorithm never saw who is poor, yet poverty ranges from 16% to 40% across the clusters
(23.1% overall). Two cautions:

- This is **description, not explanation**. Clusters do not say *why* a household is poor.
- The overcrowded cluster has the highest rate but holds only **233 of 3,464** poor households
  (7%). A subsidy aimed at that cluster alone would miss 93% of the poor. Targeting is the job of
  the supervised models from Sessions 5–7. Clusters help design *what* to offer each group.

### 7. Hierarchical clustering: a second opinion

**Agglomerative clustering** starts with every household on its own and repeatedly merges the two
closest groups. With **Ward linkage**, "closest" means the merge that increases within-cluster
variance the least, the same objective as k-means. The **dendrogram** shows the whole merge history,
and cutting it at a height gives clusters. It needs every pairwise distance, so the notebook uses
500 households. Cut into four groups, **437 of 500 (87%)** fall into clusters that match the k-means
ones: two algorithms, same four profiles. The disagreements are households that sit between
profiles.

### Common mistakes

| Mistake | Why it hurts | How to avoid |
|---|---|---|
| Clustering unscaled variables | Age (sd 16.5) and hours (sd 22.7) decide everything; unscaled k = 4 just splits by age and hours worked | `StandardScaler` before PCA and k-means |
| Putting income or `poor` in the inputs | You "discover" poverty segments you built in | Keep the label out; attach it only after clustering |
| One run, default seed | Local minima: different clusters every time | `n_init=50`, fixed `random_state`, report both |
| Treating a silhouette of 0.2 as "clear types" | It signals a continuum, not separate groups | Say how weak the structure is; check stability |
| Ignoring rare 0/1 variables | After scaling, a 1 in `overcrowded` (4% of households) becomes z ≈ 5 and grabs a cluster | Decide deliberately whether that segment is what you want |
| Naming clusters as natural or causal types | "Life stage causes poverty" is not in the data | Names are labels for discussion, not findings |

## ✅ Check your understanding

??? question "1. Why must you standardise before PCA? What would PC1 be on the raw variables?"
    PCA looks for the direction of largest variance. On raw data, variance depends on units:
    `head_weekly_hours` has a standard deviation of about 23 and `head_age` about 16.5, while the
    0/1 variables are below 0.5. PC1 would essentially be "hours and age" because those numbers
    are bigger, not because they matter more. Standardising gives every variable variance 1, so
    PCA finds shared patterns rather than large units.

??? question "2. Two standardised variables have correlation r = −0.6. What share of the variance does PC1 keep?"
    With two standardised variables, PC1 keeps $(1 + |r|)/2 = (1 + 0.6)/2 = 0.80$, or 80%.
    The sign does not matter, only the strength. With r = 0 it would keep 50%: no direction is
    better than another. In our data r = −0.498, so PC1 keeps 74.9%.

??? question "3. Redo the worked example starting from centroids B and F. Where does it end?"
    First assignment: A goes to B (0.29 vs 1.85), C goes to **F** (1.16 vs 0.72), D and E go
    to F. So cluster 1 = {A, B}, cluster 2 = {C, D, E, F}. Update: $c_1 = (1.1, -0.75)$,
    $c_2 = (-0.15, 0.5)$. Assign again: C is now at 0.65 from $c_1$ and 1.15 from $c_2$, so it
    switches. One more update gives exactly the first solution, {A, B, C} and {D, E, F}, with
    inertia 1.51. Different starts can take different paths. On real data they can also *end* in
    different places, which is why we use `n_init`.

??? question "4. The silhouette is highest at k = 3. Isn't choosing k = 4 cheating?"
    No, as long as you say so. Neither criterion is a test: all silhouettes are low (0.21–0.25),
    and the elbow is soft. k = 4 separates families with and without children, a distinction
    with direct policy use, and the inertia gain from 3 to 4 (12,100) is still clearly larger than
    from 4 to 5 (8,300). Cheating would be reporting k = 4 as "what the data says" and hiding the
    silhouette.

??? question "5. A minister proposes paying the subsidy only to the 'overcrowded families' cluster, since 40% of them are poor. What do you answer?"
    That cluster contains 233 of the 3,464 poor households in the sample: about 7%. Used as a
    targeting rule, it would have a recall of 0.07, far below the Session 5 logit at any sensible
    threshold, and it would still pay 346 non-poor households. The clusters are useful to design
    the offer (overcrowded families may need housing support more than cash). Deciding *who* gets
    the subsidy is a prediction problem, and Sessions 5–7 handle it with the right metrics.

## 🧪 Lab

The notebook rebuilds every number on this page: the -88 fix, PCA, the local-minimum demo, the
choice of k, the profiles, poverty by cluster, the unscaled comparison and the dendrogram.

[📓 Session 8 — Unlabeled Data](../notebooks/s08_unsupervised.ipynb) ·
[![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s08_unsupervised.ipynb)

!!! example "Assistant skill: review the plot, not just the code"
    ```text
    I clustered 15,000 Chilean households into 4 groups with k-means on 10 standardised variables
    (paste the list). Write code for (1) a scatter of the first two PCA scores coloured by cluster,
    with the explained variance in each axis label, and (2) a bar chart of the cluster profiles in
    the original units. Then describe each cluster in one sentence.
    ```
    Then check, line by line:

    - Do the axis labels show the real explained variance (31% and 15%)?
    - Is the profile chart in original units or z-scores, and does it say which?
    - Is every claim in its descriptions backed by a number in your profile table?
    - Did it call the clusters "natural types", or suggest they *cause* poverty?

    Every correction goes into your assistant log.

!!! abstract "Key takeaways"
    - Unsupervised learning has no target and no test error. **The variables you choose define
      the answer**, so choose them deliberately and keep the label out.
    - **PCA** rotates standardised data onto directions of maximum variance. Read the loadings to
      name a component, and the explained variance to know how much it keeps.
    - **k-means** alternates *assign* and *update*. It finds a local minimum, so run it many times
      (`n_init`) with a fixed `random_state`.
    - Choose k with the elbow, the silhouette **and** the use you will give the segments, and
      report all three.
    - Profile clusters in the original units first, and attach the label only afterwards.
      Clusters describe; they do not target and do not explain.

    ```python
    Z = StandardScaler().fit_transform(F)                       # F: features, never the label
    pca = PCA().fit(Z); pca.explained_variance_ratio_
    km = KMeans(n_clusters=4, n_init=50, random_state=42).fit(Z)
    silhouette_score(Z[sample], km.labels_[sample])
    F.assign(cluster=km.labels_).groupby("cluster").mean()      # profile, then add df["poor"]
    ```

## ✍️ Before Session 9

- [ ] Finish the three notebook exercises (drop `overcrowded`, cluster on 3 PCs, try k = 6).
- [ ] Read ISLR (2nd ed.), sections 12.2 (PCA) and 12.4 (clustering). See the
      [Program](../program.md#7-readings).
- [ ] Apply the Checkpoint 1 feedback. If you use PCA or clustering as your third family of
      methods, say what you would do differently *because* of the segments.
- [ ] Final delivery due **Thursday 26 November, 23:59**. Rehearse your 12-minute presentation
      once, with a timer.

## 📚 Next session

[Session 9](class9.md) (Friday 27 November): **final presentations**. You present your own
model and defend every choice in it, from the target and the metric to the leakage checks and the
recommendation.
