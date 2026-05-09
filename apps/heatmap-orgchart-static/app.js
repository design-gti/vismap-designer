// Heatmap Org Chart (static) - no dependencies

const qs = (sel, root = document) => root.querySelector(sel);
let icons;

const state = {
  activeTab: "all", // all | need-successors-copy | need-develop
  viewMode: "chart", // chart | table
  employees: [],
  selectedEmployeeId: null,
  showRightPanel: false,
  zoom: 100,
  position: { x: 0, y: 0 },
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  searchQuery: "",
  highlightedEmployeeId: null,
  route: { name: "home", params: {} }, // home | employee | idp
};

function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  qs("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function renderTabFilter() {
  const root = qs("#tabFilter");
  const tabs = [
    { id: "all", label: "Default" },
    { id: "need-successors-copy", label: "Succession Risk" },
    { id: "need-develop", label: "Need Develop" },
  ];

  root.innerHTML = "";
  root.style.display = "flex";
  root.style.gap = "12px";
  root.style.alignItems = "center";

  for (const t of tabs) {
    const btn = document.createElement("button");
    btn.className = "btn btn-ghost";
    btn.textContent = t.label;
    btn.dataset.action = "tab";
    btn.dataset.tab = t.id;
    btn.style.border = "0";
    btn.style.padding = "6px 10px";
    btn.style.borderRadius = "28px";
    btn.style.background = state.activeTab === t.id ? "var(--brand)" : "transparent";
    btn.style.color = state.activeTab === t.id ? "#fff" : "var(--brand)";
    root.appendChild(btn);
  }
}

function renderViewToggle() {
  const root = qs("#viewToggle");
  root.innerHTML = "";

  const mk = (id, label) => {
    const b = document.createElement("button");
    b.className = "icon-btn";
    b.dataset.action = "view";
    b.dataset.view = id;
    b.title = label;
    b.innerHTML = icons?.icon(id === "chart" ? "network" : "table") || (id === "chart" ? "🧩" : "▦");
    b.style.background = state.viewMode === id ? "var(--brand)" : "#fff";
    b.style.color = state.viewMode === id ? "#fff" : "var(--brand)";
    b.style.border = "1px solid rgba(0,0,0,0.08)";
    return b;
  };

  root.appendChild(mk("chart", "Chart View"));
  root.appendChild(mk("table", "Table View"));
}

function renderCanvas() {
  const root = qs("#canvasRoot");
  root.innerHTML = "";

  if (state.route.name === "employee") {
    renderEmployeeDetailPage(root, state.route.params.employeeId);
    return;
  }
  if (state.route.name === "idp") {
    renderIDPCreationPage(root, state.route.params.employeeId);
    return;
  }

  if (state.viewMode === "table") {
    const wrap = document.createElement("div");
    wrap.style.padding = "16px";
    wrap.innerHTML = `
      <div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;overflow:auto;max-height:calc(100vh - 120px)">
        <div style="padding:12px 12px;border-bottom:1px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:space-between">
          <div style="font-weight:700;color:var(--text)">Table View</div>
          <div style="font-size:12px;color:var(--text-muted)">${state.employees.length} employees</div>
        </div>
        <div style="padding:12px">
          <div style="font-size:12px;color:var(--text-muted)">Implementasi detail TableView akan dipindah ke vanilla JS pada todo berikutnya.</div>
        </div>
      </div>
    `;
    root.appendChild(wrap);
    return;
  }

  // Org chart rendering (DOM) + zoom/pan + expand/collapse + search
  const chart = document.createElement("div");
  chart.style.position = "absolute";
  chart.style.inset = "0";
  chart.style.overflow = "hidden";
  chart.style.background = "#f3f4f6";

  // Search (top-left)
  const searchWrap = document.createElement("div");
  searchWrap.className = "floating";
  searchWrap.style.top = "80px";
  searchWrap.style.left = "16px";
  searchWrap.style.display = "flex";
  searchWrap.style.flexDirection = "column";
  searchWrap.style.gap = "8px";
  searchWrap.style.width = "300px";
  searchWrap.innerHTML = `
    <div style="position:relative">
      <input class="input" style="padding-right:36px" placeholder="Search employee..." value="${escapeHtml(
        state.searchQuery,
      )}" data-action="search-input" />
      <span aria-hidden="true" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#58595B">${icons?.icon(
        "search",
      ) || "⌕"}</span>
    </div>
    <div id="searchDropdown" style="display:none;background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.12)"></div>
  `;
  chart.appendChild(searchWrap);

  // Zoom controls (bottom-right)
  const zoomWrap = document.createElement("div");
  zoomWrap.className = "floating";
  zoomWrap.style.bottom = "16px";
  zoomWrap.style.right = state.showRightPanel ? "440px" : "16px";
  zoomWrap.style.background = "#fff";
  zoomWrap.style.border = "1px solid rgba(0,0,0,0.08)";
  zoomWrap.style.borderRadius = "12px";
  zoomWrap.style.padding = "10px";
  zoomWrap.style.display = "flex";
  zoomWrap.style.flexDirection = "column";
  zoomWrap.style.alignItems = "center";
  zoomWrap.style.gap = "8px";
  zoomWrap.innerHTML = `
    <button class="icon-btn" data-action="zoom-in" title="Zoom In">${icons?.icon("plus") || "＋"}</button>
    <div style="font-size:12px;color:var(--text)">${state.zoom}%</div>
    <button class="icon-btn" data-action="zoom-out" title="Zoom Out">${icons?.icon("minus") || "－"}</button>
    <div style="width:100%;height:1px;background:rgba(0,0,0,0.08)"></div>
    <button class="icon-btn" data-action="reset-view" title="Reset View">${icons?.icon("reset") || "⤾"}</button>
  `;
  chart.appendChild(zoomWrap);

  // Pan/zoom surface
  const surface = document.createElement("div");
  surface.style.position = "absolute";
  surface.style.inset = "0";
  surface.style.cursor = state.isDragging ? "grabbing" : "grab";
  surface.dataset.action = "surface";
  chart.appendChild(surface);

  const content = document.createElement("div");
  content.style.position = "absolute";
  content.style.left = "50%";
  content.style.top = "0";
  content.style.padding = "48px";
  content.style.transformOrigin = "0 0";
  content.style.willChange = "transform";
  content.style.transform = `translate(${state.position.x}px, ${state.position.y}px) scale(${state.zoom / 100})`;
  surface.appendChild(content);

  const contentInner = document.createElement("div");
  contentInner.style.transform = "translateX(-50%)";
  content.appendChild(contentInner);

  // Build hierarchy
  // Note: keep it simple first (no pan/zoom yet); those come next iterations.
  const { buildOrgChart } = window.__heatmapData || {};
  const roots = buildOrgChart ? buildOrgChart(state.employees) : [];
  const expandedById = state.__expandedById || {};

  const applyExpandedFlags = (node) => {
    node.__expanded = expandedById[node.id] ?? true;
    if (node.reports) node.reports.forEach(applyExpandedFlags);
  };
  roots.forEach(applyExpandedFlags);

  const renderNode = (node, level = 0) => {
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.alignItems = "center";
    wrap.style.marginBottom = "18px";

    const expanded = node.__expanded ?? true;
    wrap.dataset.employeeId = node.id;

    const card = document.createElement("button");
    card.type = "button";
    card.dataset.action = "open-employee";
    card.dataset.employeeId = node.id;
    card.style.border = "1px solid rgba(0,0,0,0.08)";
    card.style.borderRadius = "12px";
    card.style.background = "#fff";
    card.style.padding = "10px 12px";
    card.style.minWidth = "220px";
    card.style.textAlign = "left";
    card.style.boxShadow = "0 10px 24px rgba(0,0,0,0.06)";
    const isHighlighted = state.highlightedEmployeeId === node.id;
    if (isHighlighted) card.classList.add("card-highlight");
    card.innerHTML = `
      <div style="font-weight:800;color:var(--brand);font-size:12px;line-height:1.2">${escapeHtml(
        node.name,
      )}</div>
      <div style="font-size:11px;color:var(--text);margin-top:2px">${escapeHtml(node.position)}</div>
      <div style="font-size:10px;color:var(--text-subtle);margin-top:2px">Score: ${node.competencyScore}%</div>
    `;
    wrap.appendChild(card);

    if (node.reports && node.reports.length) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.dataset.action = "toggle-expand";
      toggle.dataset.employeeId = node.id;
      toggle.className = "icon-btn";
      toggle.style.marginTop = "6px";
      toggle.style.width = "28px";
      toggle.style.height = "28px";
      toggle.title = expanded ? "Collapse" : "Expand";
      toggle.textContent = expanded ? "˅" : "›";
      wrap.appendChild(toggle);

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "18px";
      row.style.marginTop = "12px";
      row.style.flexWrap = "wrap";
      row.style.justifyContent = "center";
      if (expanded) {
        node.reports.forEach((c) => row.appendChild(renderNode(c, level + 1)));
        wrap.appendChild(row);
      }
    }

    return wrap;
  };

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.gap = "28px";
  container.style.alignItems = "flex-start";
  container.style.justifyContent = "center";
  container.style.flexWrap = "wrap";

  if (!roots.length) {
    const empty = document.createElement("div");
    empty.style.background = "#fff";
    empty.style.border = "1px solid rgba(0,0,0,0.08)";
    empty.style.borderRadius = "12px";
    empty.style.padding = "14px 16px";
    empty.textContent = "No org chart data available";
    chart.appendChild(empty);
  } else {
    roots.forEach((r) => container.appendChild(renderNode(r, 0)));
    contentInner.appendChild(container);
  }

  root.appendChild(chart);

  // Search dropdown render (after chart is built)
  renderSearchDropdown();
}

function renderSearchDropdown() {
  const dd = qs("#searchDropdown");
  if (!dd) return;
  const q = state.searchQuery.trim().toLowerCase();
  if (!q) {
    dd.style.display = "none";
    dd.innerHTML = "";
    return;
  }

  const matches = state.employees
    .filter((e) => e.name.toLowerCase().includes(q) || e.position.toLowerCase().includes(q))
    .slice(0, 10);

  if (!matches.length) {
    dd.style.display = "block";
    dd.innerHTML = `<div style="padding:10px 12px;font-size:12px;color:var(--text-muted)">No results</div>`;
    return;
  }

  dd.style.display = "block";
  dd.innerHTML = matches
    .map(
      (e) => `
      <button type="button" data-action="search-pick" data-employee-id="${escapeHtml(
        e.id,
      )}" style="width:100%;display:flex;gap:10px;align-items:center;padding:10px 12px;border:0;background:#fff;text-align:left">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;color:var(--text);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(
            e.name,
          )}</div>
          <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(
            e.position,
          )}</div>
        </div>
        <div style="font-size:10px;color:var(--text-subtle)">Score ${e.competencyScore}%</div>
      </button>
    `,
    )
    .join("");
}

function navigate(route) {
  state.route = route;
  state.showRightPanel = false;
  state.selectedEmployeeId = null;
  render();
}

function renderEmployeeDetailPage(root, employeeId) {
  const employee = state.employees.find((e) => e.id === employeeId);
  const radar = employee?.competencyDetails?.length
    ? buildRadarSvg(employee.competencyDetails)
    : "";
  const page = document.createElement("div");
  page.style.position = "absolute";
  page.style.inset = "0";
  page.style.overflow = "auto";
  page.style.background = "#f3f4f6";
  page.style.padding = "16px";
  page.innerHTML = `
    <div style="max-width:980px;margin:0 auto">
      <button class="btn btn-ghost" data-action="nav-home" style="border:0">← Back</button>
      <div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:16px;margin-top:10px">
        <div style="font-weight:900;color:var(--brand);font-size:18px">${employee ? escapeHtml(employee.name) : "Employee"}</div>
        ${employee ? `<div style="color:var(--text);margin-top:4px"><b>${escapeHtml(employee.position)}</b> · ${escapeHtml(employee.jobTitle || "")}</div>` : ""}
        <div style="color:var(--text-muted);font-size:12px;margin-top:8px">
          Competency: <b>${employee?.competencyScore ?? "-"}</b>% · Readiness: <b>${employee?.readinessScore ?? "-"}</b>%
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-top:12px">
        ${
          radar
            ? `<div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:16px">
                 <div style="font-weight:800;color:var(--text);margin-bottom:10px">Spider Chart (SVG)</div>
                 <div style="display:flex;justify-content:center">${radar}</div>
               </div>`
            : ""
        }
        <div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:16px">
          <div style="font-weight:800;color:var(--text);margin-bottom:10px">Competency Details</div>
          ${
            employee?.competencyDetails?.length
              ? `<div style="display:grid;grid-template-columns:1fr 64px;gap:8px">
                  ${employee.competencyDetails
                    .map(
                      (c) => `
                    <div style="font-size:12px;color:var(--text)">${escapeHtml(c.name)}</div>
                    <div style="font-size:12px;color:var(--brand);font-weight:800;text-align:right">${c.score}/5</div>
                  `,
                    )
                    .join("")}
                </div>`
              : `<div style="font-size:12px;color:var(--text-muted)">No competency data.</div>`
          }
        </div>
      </div>
    </div>
  `;
  root.appendChild(page);
}

function buildRadarSvg(details) {
  // Render up to 8 axes for readability in static version
  const points = details.slice(0, 8);
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 110;
  const n = points.length;

  const toXY = (i, t) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r * t, cy + Math.sin(a) * r * t];
  };

  const polygon = points
    .map((p, i) => {
      const t = Math.max(0, Math.min(1, (p.score || 0) / 5));
      const [x, y] = toXY(i, t);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const grid = [0.25, 0.5, 0.75, 1]
    .map((t) => {
      const g = points
        .map((_, i) => {
          const [x, y] = toXY(i, t);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
      return `<polygon points="${g}" fill="none" stroke="rgba(0,0,0,0.10)" stroke-width="1"/>`;
    })
    .join("");

  const axes = points
    .map((_, i) => {
      const [x, y] = toXY(i, 1);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.10)" stroke-width="1"/>`;
    })
    .join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Spider chart">
    ${grid}
    ${axes}
    <polygon points="${polygon}" fill="rgba(1,102,153,0.18)" stroke="rgba(1,102,153,0.85)" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="2" fill="rgba(1,102,153,0.85)"/>
  </svg>`;
}

function renderIDPCreationPage(root, employeeId) {
  const employee = state.employees.find((e) => e.id === employeeId);
  const page = document.createElement("div");
  page.style.position = "absolute";
  page.style.inset = "0";
  page.style.overflow = "auto";
  page.style.background = "#f3f4f6";
  page.style.padding = "16px";
  page.innerHTML = `
    <div style="max-width:980px;margin:0 auto">
      <button class="btn btn-ghost" data-action="nav-home" style="border:0">← Back</button>
      <div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:16px;margin-top:10px">
        <div style="font-weight:900;color:var(--text);font-size:16px">Create IDP</div>
        ${employee ? `<div style="color:var(--brand);font-weight:900;margin-top:6px">${escapeHtml(employee.name)}</div>` : ""}
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px">
          Versi statis: form IDP lengkap akan dipoles di iterasi berikutnya. Untuk sekarang, kamu bisa simpan “placeholder IDP” agar flow halaman terpenuhi.
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" data-action="save-idp" ${employee ? "" : "disabled"}>Save IDP (placeholder)</button>
          <button class="btn" data-action="nav-employee" data-employee-id="${escapeHtml(employeeId)}" ${employee ? "" : "disabled"}>Open Employee Detail</button>
        </div>
      </div>
    </div>
  `;
  root.appendChild(page);
}

function renderRightPanel() {
  const panel = qs("#rightPanel");
  if (!state.showRightPanel || !state.selectedEmployeeId) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }
  panel.classList.remove("hidden");
  const employee = state.employees.find((e) => e.id === state.selectedEmployeeId);
  panel.innerHTML = `
    <div style="padding:20px 16px;border-bottom:1px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:space-between">
      <div style="font-weight:800;color:var(--text)">${employee ? escapeHtml(employee.name) : "Detail"}</div>
      <button class="icon-btn" data-action="close-panel" title="Close">→</button>
    </div>
    <div style="padding:16px;color:var(--text-muted);font-size:12px">
      ${employee ? `<div style="margin-bottom:10px"><b>${escapeHtml(employee.position)}</b><br/>${escapeHtml(employee.jobTitle || "")}</div>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
        <button class="btn btn-primary" data-action="nav-employee" data-employee-id="${employee ? escapeHtml(employee.id) : ""}">Open Detail</button>
        <button class="btn" data-action="nav-idp" data-employee-id="${employee ? escapeHtml(employee.id) : ""}">Create IDP</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted)">
        Succession panel + compare overlay akan dipoles di todo ini.
      </div>
    </div>
  `;
}

function openModal(html) {
  qs("#overlay").classList.add("open");
  const modal = qs("#modalRoot");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  qs("#modalCard").innerHTML = html;
}

function closeModal() {
  qs("#overlay").classList.remove("open");
  const modal = qs("#modalRoot");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  qs("#modalCard").innerHTML = "";
}

function openSettingsMenu() {
  openModal(`
    <div style="padding:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-weight:900;color:var(--text)">Settings</div>
        <button class="icon-btn" data-action="close-modal" title="Close">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn" data-action="open-data-editor">Setting Employee Data</button>
        <button class="btn" data-action="open-heatmap-settings">Setting Heatmap Condition</button>
      </div>
    </div>
  `);
}

function openDataEditorModal() {
  const rows = state.employees
    .slice(0, 50)
    .map(
      (e) => `
    <tr>
      <td style="padding:6px;border-bottom:1px solid rgba(0,0,0,0.06)">${escapeHtml(e.id)}</td>
      <td style="padding:6px;border-bottom:1px solid rgba(0,0,0,0.06)"><input class="input" style="border-radius:10px;padding:6px 8px" data-action="edit-emp" data-field="name" data-id="${escapeHtml(
        e.id,
      )}" value="${escapeHtml(e.name)}" /></td>
      <td style="padding:6px;border-bottom:1px solid rgba(0,0,0,0.06)"><input class="input" style="border-radius:10px;padding:6px 8px" data-action="edit-emp" data-field="position" data-id="${escapeHtml(
        e.id,
      )}" value="${escapeHtml(e.position)}" /></td>
      <td style="padding:6px;border-bottom:1px solid rgba(0,0,0,0.06)"><input class="input" style="border-radius:10px;padding:6px 8px" data-action="edit-emp" data-field="jobTitle" data-id="${escapeHtml(
        e.id,
      )}" value="${escapeHtml(e.jobTitle || "")}" /></td>
    </tr>`,
    )
    .join("");

  openModal(`
    <div style="padding:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div style="font-weight:900;color:var(--text)">Employee Data Editor (lite)</div>
        <button class="icon-btn" data-action="close-modal" title="Close">✕</button>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" data-action="export-json">Export JSON</button>
        <button class="btn" data-action="export-csv">Export CSV</button>
        <label class="btn" style="cursor:pointer">
          Import JSON
          <input type="file" accept="application/json" data-action="import-json" style="display:none" />
        </label>
        <button class="btn btn-primary" data-action="save-employees">Save Changes</button>
      </div>
      <div style="margin-top:12px;font-size:12px;color:var(--text-muted)">
        Catatan: versi statis tanpa package. Editor ini fokus field inti; fitur Excel/IndexedDB image upload akan dipoles di todo import/export.
      </div>
      <div style="margin-top:12px;max-height:60vh;overflow:auto;border:1px solid rgba(0,0,0,0.08);border-radius:12px;background:#fff">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8fafc">
              <th style="text-align:left;padding:8px;font-size:11px;color:var(--text-muted)">ID</th>
              <th style="text-align:left;padding:8px;font-size:11px;color:var(--text-muted)">Name</th>
              <th style="text-align:left;padding:8px;font-size:11px;color:var(--text-muted)">Position</th>
              <th style="text-align:left;padding:8px;font-size:11px;color:var(--text-muted)">Department</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `);
}

async function openHeatmapSettingsModal() {
  const { getHeatmapConfig } = await import("./data/heatmapConfig.js");
  const cfg = getHeatmapConfig();

  const renderRanges = (key, title) => {
    const rs = cfg[key];
    const items = rs
      .map(
        (r, idx) => `
      <div style="display:flex;gap:10px;align-items:center;margin-top:8px">
        <div style="width:28px;height:28px;border-radius:6px;background:${r.color};border:1px solid rgba(0,0,0,0.12)"></div>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="font-size:12px;color:var(--text-muted)">Min</div>
          <input class="input" style="width:90px;border-radius:10px;padding:6px 8px" value="${r.min}" disabled />
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="font-size:12px;color:var(--text-muted)">Max</div>
          <input class="input" style="width:90px;border-radius:10px;padding:6px 8px" data-action="heatmap-max" data-key="${key}" data-idx="${idx}" value="${r.max}" />
        </div>
      </div>`,
      )
      .join("");

    return `
      <div style="margin-top:14px">
        <div style="font-weight:900;color:var(--text)">${title}</div>
        ${items}
      </div>
    `;
  };

  openModal(`
    <div style="padding:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div style="font-weight:900;color:var(--text)">Heatmap Settings (lite)</div>
        <button class="icon-btn" data-action="close-modal" title="Close">✕</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:10px">
        Ubah nilai maksimum per range. Nilai minimum range berikutnya akan auto mengikuti (max + 1).
      </div>
      ${renderRanges("needDevelop", "Need Develop (Competency Score)")}
      ${renderRanges("readinessScore", "Readiness Score")}
      <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:8px">
        <button class="btn" data-action="close-modal">Cancel</button>
        <button class="btn btn-primary" data-action="save-heatmap">Save</button>
      </div>
    </div>
  `);

  // stash config draft
  state.__heatmapDraft = structuredClone(cfg);
}

function render() {
  renderTabFilter();
  renderViewToggle();
  renderCanvas();
  renderRightPanel();
}

async function loadData() {
  icons = await import("./icons.js");
  const { dataManager } = await import("./data/dataManager.js");
  const { buildOrgChart } = await import("./data/orgChartData.js");
  window.__heatmapData = { buildOrgChart };
  state.employees = dataManager.getEmployees();
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;

  const action = el.dataset.action;
  if (action === "tab") {
    state.activeTab = el.dataset.tab;
    toast(`Tab: ${state.activeTab}`);
    render();
  } else if (action === "view") {
    state.viewMode = el.dataset.view;
    render();
  } else if (action === "close-panel") {
    state.showRightPanel = false;
    state.selectedEmployeeId = null;
    renderRightPanel();
  } else if (action === "close-modal") {
    closeModal();
  } else if (action === "open-data-editor") {
    openDataEditorModal();
  } else if (action === "open-heatmap-settings") {
    openHeatmapSettingsModal();
  } else if (action === "open-employee") {
    state.selectedEmployeeId = el.dataset.employeeId;
    state.showRightPanel = true;
    state.highlightedEmployeeId = el.dataset.employeeId;
    setTimeout(() => {
      if (state.highlightedEmployeeId === el.dataset.employeeId) {
        state.highlightedEmployeeId = null;
        renderCanvas();
      }
    }, 2500);
    renderRightPanel();
    renderCanvas();
  } else if (action === "toggle-expand") {
    const id = el.dataset.employeeId;
    // mutate the built hierarchy stored in window for simplicity
    // Toggle by mirroring into employees array nodes in buildOrgChart output at next render
    // Easiest: store expanded flags by id
    state.__expandedById = state.__expandedById || {};
    state.__expandedById[id] = !(state.__expandedById[id] ?? true);
    // Inject flags into employees on next build
    renderCanvas();
  } else if (action === "zoom-in") {
    state.zoom = Math.min(200, state.zoom + 10);
    renderCanvas();
  } else if (action === "zoom-out") {
    state.zoom = Math.max(25, state.zoom - 10);
    renderCanvas();
  } else if (action === "reset-view") {
    state.zoom = 100;
    state.position = { x: 0, y: 0 };
    renderCanvas();
  } else if (action === "search-pick") {
    const id = el.dataset.employeeId;
    state.searchQuery = "";
    state.selectedEmployeeId = id;
    state.showRightPanel = true;
    state.highlightedEmployeeId = id;
    render();
    // scroll into view
    const node = document.querySelector(`[data-employee-id="${CSS.escape(id)}"]`);
    if (node) node.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  } else if (action === "nav-employee") {
    navigate({ name: "employee", params: { employeeId: el.dataset.employeeId } });
  } else if (action === "nav-idp") {
    navigate({ name: "idp", params: { employeeId: el.dataset.employeeId } });
  } else if (action === "nav-home") {
    navigate({ name: "home", params: {} });
  } else if (action === "save-idp") {
    const id = state.route.params.employeeId;
    const empIdx = state.employees.findIndex((x) => x.id === id);
    if (empIdx >= 0) {
      state.employees[empIdx] = {
        ...state.employees[empIdx],
        activeIDP: {
          startDate: new Date().toISOString().slice(0, 10),
          programs: [],
        },
      };
      import("./data/dataManager.js").then(({ dataManager }) => {
        dataManager.saveEmployees(state.employees);
        toast("IDP saved");
      });
    }
  } else if (action === "save-employees") {
    import("./data/dataManager.js").then(({ dataManager }) => {
      dataManager.saveEmployees(state.employees);
      toast("Saved");
      closeModal();
      render();
    });
  } else if (action === "export-json") {
    import("./data/dataManager.js").then(({ dataManager }) => {
      const blob = new Blob([dataManager.exportData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `org-chart-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Exported");
    });
  } else if (action === "export-csv") {
    const header = [
      "ID",
      "Name",
      "Department",
      "Position",
      "Manager ID",
      "Score",
      "Readiness",
      "Critical Position",
      "Gender",
      "City",
      "Marital Status",
      "Performance",
      "IQ",
      "Image URL",
    ];
    const esc = (v) => {
      const s = v === undefined || v === null ? "" : String(v);
      // CSV escape
      if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
      return s;
    };
    const lines = [header.join(",")];
    for (const emp of state.employees) {
      lines.push(
        [
          emp.id,
          emp.name,
          emp.jobTitle,
          emp.position,
          emp.managerId || "",
          emp.competencyScore,
          emp.readinessScore ?? "",
          emp.criticalPosition ? "Yes" : "No",
          emp.gender || "",
          emp.city || "",
          emp.maritalStatus || "",
          emp.performance ?? "",
          emp.iq ?? "",
          emp.imageUrl && !String(emp.imageUrl).startsWith("indexeddb:") ? emp.imageUrl : "",
        ]
          .map(esc)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `org-chart-data-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  } else if (action === "save-heatmap") {
    import("./data/heatmapConfig.js").then(({ setHeatmapConfig }) => {
      if (state.__heatmapDraft) setHeatmapConfig(state.__heatmapDraft);
      toast("Heatmap saved");
      closeModal();
    });
  }
});

document.addEventListener("input", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.dataset.action === "edit-emp") {
    const id = t.dataset.id;
    const field = t.dataset.field;
    const idx = state.employees.findIndex((x) => x.id === id);
    if (idx >= 0) state.employees[idx] = { ...state.employees[idx], [field]: t.value };
    return;
  }
  if (t.dataset.action === "heatmap-max") {
    const key = t.dataset.key;
    const idx = Number(t.dataset.idx);
    const v = Number.parseInt(t.value || "0", 10) || 0;
    const draft = state.__heatmapDraft;
    if (!draft || !draft[key] || !draft[key][idx]) return;
    draft[key][idx].max = v;
    if (idx < draft[key].length - 1) draft[key][idx + 1].min = v + 1;
    return;
  }
  if (t.dataset.action !== "search-input") return;
  state.searchQuery = t.value;
  renderSearchDropdown();
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.dataset.action === "import-json" && t.files?.[0]) {
    const file = t.files[0];
    file.text().then((txt) => {
      import("./data/dataManager.js").then(({ dataManager }) => {
        const ok = dataManager.importData(txt);
        if (ok) {
          state.employees = dataManager.getEmployees();
          toast("Imported");
          closeModal();
          render();
        } else {
          toast("Import failed");
        }
      });
    });
  }
});

// Wheel zoom (cursor anchored, simplified)
document.addEventListener(
  "wheel",
  (e) => {
    const canvas = qs("#canvasRoot");
    if (!canvas || state.viewMode !== "chart") return;
    if (!canvas.contains(e.target)) return;
    e.preventDefault();
    const delta = -e.deltaY;
    const change = delta > 0 ? 10 : -10;
    state.zoom = Math.max(25, Math.min(200, state.zoom + change));
    renderCanvas();
  },
  { passive: false },
);

// Drag to pan (mouse)
document.addEventListener("mousedown", (e) => {
  const surface = e.target.closest('[data-action="surface"]');
  if (!surface) return;
  if (state.viewMode !== "chart") return;
  // avoid dragging when clicking on buttons/inputs
  const interactive = e.target.closest("button,input,select,textarea");
  if (interactive) return;
  state.isDragging = true;
  state.dragStart = { x: e.clientX - state.position.x, y: e.clientY - state.position.y };
  renderCanvas();
});

document.addEventListener("mousemove", (e) => {
  if (!state.isDragging) return;
  state.position = { x: e.clientX - state.dragStart.x, y: e.clientY - state.dragStart.y };
  // lightweight update without full render: update transform only if present
  const surface = qs("#canvasRoot [data-action=\"surface\"] > div");
  if (surface) {
    surface.style.transform = `translate(${state.position.x}px, ${state.position.y}px) scale(${state.zoom / 100})`;
  }
});

document.addEventListener("mouseup", () => {
  if (!state.isDragging) return;
  state.isDragging = false;
  renderCanvas();
});

qs("#overlay").addEventListener("click", closeModal);
qs("#settingsBtn").addEventListener("click", openSettingsMenu);

await loadData();
// Set settings icon (inline SVG)
qs("#settingsBtn").innerHTML = icons?.icon("settings") || "⚙";
render();

