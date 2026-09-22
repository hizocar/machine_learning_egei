# Machine Learning — EGEI

Course site, built with MkDocs Material and published on GitHub Pages:
https://hizocar.github.io/machine_learning_egei/

This year's course teaches machine learning **alongside AI coding assistants**: students learn the
statistical and modelling foundations while building the habit of delegating, reviewing and
verifying assistant-generated code. Assessment is two projects.

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
