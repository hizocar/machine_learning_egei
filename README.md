# Machine Learning — EGEI

Course site, built with MkDocs Material and published on GitHub Pages:
https://hizocar.github.io/machine_learning_egei/

This year's course teaches machine learning **alongside AI coding assistants**: students learn the
statistical and modelling foundations while building the habit of delegating, reviewing and
verifying assistant-generated code. Assessment is one project in two deliveries (40% / 60%).

Every session works on the same case: predicting household poverty from observable characteristics
(a *proxy means test*) with a 15,000-household sample of Chile's CASEN 2022 survey. See `docs/case.md`.

## Course data and figures

- `scripts/build_casen_sample.py` rebuilds `docs/data/casen_households.csv` from the official CASEN
  2022 Stata file (download link in the script).
- `scripts/build_widget_data.py` rebuilds the JSON files in `docs/data/widgets/` that the interactive
  figures read, from the same models the session notebooks train.
- The interactive figures live in `docs/javascripts/ml-widgets.js` (SVG + Motion) and are embedded in a
  page with `<div class="ml-widget" data-widget="NAME"></div>`.

## Local development

```bash
poetry install
poetry run mkdocs serve
```

## Build

```bash
poetry run mkdocs build --site-dir public
```

Deployment to GitHub Pages runs automatically via GitHub Actions on every push to `main`.
