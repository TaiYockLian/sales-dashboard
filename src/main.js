import "./style.css";
import { supabase } from "./supabaseClient.js";

// ---- Single data-loading function, backed by Supabase. ----
function showLoadError(message) {
  const sub = document.getElementById("subLine");
  if (sub) {
    sub.textContent = "⚠ " + message;
    sub.style.color = "var(--bad)";
  }
}

async function loadData() {
  const { data, error } = await supabase
    .from("outlet_weekly")
    .select("outlet, week, sales, target, orders, returns")
    .order("outlet", { ascending: true })
    .order("week", { ascending: true });

  if (error) {
    console.error("Failed to load outlet_weekly from Supabase:", error);
    showLoadError("Couldn't load data from Supabase: " + error.message);
    return [];
  }

  if (!data || data.length === 0) {
    showLoadError("Connected to Supabase, but outlet_weekly returned 0 rows.");
    return [];
  }

  return data.map(row => ({
    outlet: row.outlet,
    week: row.week,
    sales: Number(row.sales),
    target: Number(row.target),
    orders: Number(row.orders),
    returns: Number(row.returns),
  }));
}

function fmtMoney(n) {
  return "S$" + Math.round(n).toLocaleString();
}
function fmtPct(n) {
  return n.toFixed(1) + "%";
}
function fmtWeekLabel(w) {
  const d = new Date(w + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

let allRows = [];

function render(outlet) {
  const rows = outlet === "All" ? allRows : allRows.filter(r => r.outlet === outlet);

  document.getElementById("subLine").textContent =
    (outlet === "All" ? "All outlets" : outlet) + " · weeks of 7 Sept – 21 Sept";

  // KPIs
  const totalSales = rows.reduce((s, r) => s + r.sales, 0);
  const totalTarget = rows.reduce((s, r) => s + r.target, 0);
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  const totalReturns = rows.reduce((s, r) => s + r.returns, 0);
  const pctTarget = totalTarget ? (totalSales / totalTarget) * 100 : 0;
  const returnsPct = totalOrders ? (totalReturns / totalOrders) * 100 : 0;
  const delta = totalSales - totalTarget;
  const avgPerOrder = totalOrders ? totalSales / totalOrders : 0;

  document.getElementById("kpiSales").textContent = fmtMoney(totalSales);
  document.getElementById("kpiSalesSub").textContent =
    (delta >= 0 ? "+" : "−") + fmtMoney(Math.abs(delta)) + " vs target";

  document.getElementById("kpiTarget").textContent = fmtPct(pctTarget);
  document.getElementById("kpiTargetSub").textContent = "Target " + fmtMoney(totalTarget);

  document.getElementById("kpiOrders").textContent = totalOrders.toLocaleString();
  document.getElementById("kpiOrdersSub").textContent = "Avg " + fmtMoney(avgPerOrder) + " per order";

  document.getElementById("kpiReturns").textContent = fmtPct(returnsPct);
  document.getElementById("kpiReturnsSub").textContent =
    totalReturns.toLocaleString() + " of " + totalOrders.toLocaleString() + " orders";

  // Chart
  const sorted = rows.slice().sort((a, b) => a.outlet.localeCompare(b.outlet) || a.week.localeCompare(b.week));
  const chart = document.getElementById("chart");
  chart.innerHTML = "";

  const maxPct = Math.max(100, ...sorted.map(r => (r.sales / r.target) * 100)) * 1.08;

  const gridWrap = document.createElement("div");
  gridWrap.className = "gridlines";
  const tickVals = [0, 50, 100];
  tickVals.forEach(v => {
    const gl = document.createElement("div");
    gl.className = "gridline";
    gl.style.order = v;
    const pctFromBottom = (v / maxPct) * 100;
    gl.style.position = "absolute";
    gl.style.left = "0";
    gl.style.right = "0";
    gl.style.bottom = pctFromBottom + "%";
    const label = document.createElement("span");
    label.className = "gl-label";
    label.textContent = v + "%";
    gl.appendChild(label);
    gridWrap.appendChild(gl);
  });
  gridWrap.style.position = "absolute";
  gridWrap.style.left = "34px";
  gridWrap.style.right = "0";
  gridWrap.style.top = "10px";
  gridWrap.style.bottom = "28px";
  chart.appendChild(gridWrap);

  const targetLine = document.createElement("div");
  targetLine.className = "target-line";
  targetLine.style.borderTop = "1.5px dashed var(--bad)";
  targetLine.style.opacity = "0.55";
  targetLine.style.bottom = (90 / maxPct) * 100 + "%";
  targetLine.style.left = "34px";
  gridWrap.appendChild(targetLine);

  const barsWrap = document.createElement("div");
  barsWrap.style.display = "flex";
  barsWrap.style.alignItems = "flex-end";
  barsWrap.style.gap = "14px";
  barsWrap.style.marginLeft = "34px";
  barsWrap.style.flex = "1";
  barsWrap.style.height = "100%";
  barsWrap.style.position = "relative";
  barsWrap.style.zIndex = "1";

  sorted.forEach(r => {
    const pct = (r.sales / r.target) * 100;
    const bad = pct < 90;
    const heightPct = (pct / maxPct) * 100;

    const col = document.createElement("div");
    col.className = "bar-col";

    const label = document.createElement("div");
    label.className = "bar-pct-label";
    label.style.color = bad ? "var(--bad)" : "var(--text)";
    label.textContent = Math.round(pct) + "%";

    const bar = document.createElement("div");
    bar.className = "bar" + (bad ? " bad" : "");
    bar.style.height = heightPct + "%";

    const colLabel = document.createElement("div");
    colLabel.className = "bar-col-label";
    colLabel.innerHTML = r.outlet + `<span class="wk">${fmtWeekLabel(r.week)}</span>`;

    col.appendChild(label);
    col.appendChild(bar);
    col.appendChild(colLabel);
    barsWrap.appendChild(col);
  });

  chart.appendChild(barsWrap);

  // Needs attention
  const attentionList = document.getElementById("attentionList");
  attentionList.innerHTML = "";
  const attention = rows
    .map(r => ({ ...r, pct: (r.sales / r.target) * 100 }))
    .filter(r => r.pct < 90)
    .sort((a, b) => a.pct - b.pct);

  if (attention.length === 0) {
    attentionList.innerHTML = `<div class="empty">No outlet-weeks below 90% of target.</div>`;
  } else {
    attention.forEach(r => {
      const shortBy = r.target - r.sales;
      const item = document.createElement("div");
      item.className = "attention-item";
      item.innerHTML = `
        <div>
          <div class="name">${r.outlet} · ${fmtWeekLabel(r.week)}</div>
          <div class="meta">${fmtMoney(shortBy)} short of ${fmtMoney(r.target)}</div>
        </div>
        <div class="pct-pill">${fmtPct(r.pct)}</div>
      `;
      attentionList.appendChild(item);
    });
  }
}

document.getElementById("tabs").addEventListener("click", e => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  render(btn.dataset.outlet);
});

loadData().then(rows => {
  allRows = rows;
  render("All");
});
