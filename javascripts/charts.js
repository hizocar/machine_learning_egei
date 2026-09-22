/* Gráficos interactivos del curso (Chart.js), compatibles con la
   navegación instantánea de Material for MkDocs: se vuelven a montar
   en cada cambio de página vía document$.subscribe. */

document$.subscribe(function () {
  if (typeof Chart === "undefined") return;

  const NAVY = "#1b2a5e";
  const BLUE = "#005f96";
  const GOLD = "#e5b300";
  const RED = "#b30828";
  const GREY = "#8a94ad";

  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  // Charts live in a fixed-height .usm-chart-canvas-wrap; disabling aspect-ratio lets Chart.js
  // fill that box directly instead of computing its own height, which is what caused charts to
  // shrink on repeated resize/re-render cycles.
  Chart.defaults.maintainAspectRatio = false;

  const isDark = () =>
    document.body.getAttribute("data-md-color-scheme") === "slate";
  const textColor = () => (isDark() ? "#e6e9f5" : "#1b2a5e");
  const gridColor = () => (isDark() ? "#ffffff22" : "#00000014");

  const charts = {};

  Object.keys(charts).forEach((id) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const previous = Chart.getChart(canvas);
    if (previous) previous.destroy();
    new Chart(canvas, charts[id]);
  });
});
