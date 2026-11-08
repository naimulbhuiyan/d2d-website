// Data 2 Decision website — renders content from the JSON data files.
// The comms team edits these files through the admin panel (/admin, Decap CMS).
// No build step: the site is plain static files served by Cloudflare Pages.
// Each page only renders the sections it actually contains.

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Could not load " + path);
  return res.json();
}

function renderProjects(list) {
  const el = document.getElementById("project-list");
  if (!el) return;
  el.innerHTML = list.map((p) => `
    <article class="card">
      <span class="tag">${esc(p.type || "Research")}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description || "")}</p>
      <p class="meta">Lead: ${esc(p.lead || "—")} · Status: ${esc(p.status || "In sprint")}</p>
    </article>`).join("");
  const n = document.getElementById("stat-projects");
  if (n) n.textContent = list.length;
}

function renderPublications(list) {
  const el = document.getElementById("publication-list");
  if (!el) return;
  const underReview = list.filter((p) => (p.status || "").toLowerCase().includes("review"));
  el.innerHTML = list.map((p) => `
    <li><span class="pub-topic">${esc(p.topic)}</span>
    <span class="pub-note"> — ${esc(p.detail || "")} · ${esc(p.status || "")}</span></li>`).join("");
  const n = document.getElementById("stat-review");
  if (n) n.textContent = underReview.length;
}

function renderTeam(list) {
  const el = document.getElementById("team-list");
  if (!el) return;
  el.innerHTML = list.map((m) => `
    <article class="card">
      <span class="tag">${esc(m.role || "Team member")}</span>
      <h3>${esc(m.name)}</h3>
      <p class="meta">${esc(m.note || "")}</p>
    </article>`).join("");
}

function renderFeatures(list) {
  const el = document.getElementById("feature-list");
  if (!el) return;
  const sorted = [...list].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  el.innerHTML = sorted.map((f) => `
    <article class="card">
      <span class="tag">${esc(f.date || "")}</span>
      <h3>${esc(f.title)}</h3>
      <p>${esc(f.body || "")}</p>
    </article>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  loadJSON("data/projects.json").then(renderProjects).catch(() => {
    const el = document.getElementById("project-list");
    if (el) el.innerHTML = "<p>Projects could not be loaded.</p>";
  });
  loadJSON("data/publications.json").then(renderPublications).catch(() => {
    const el = document.getElementById("publication-list");
    if (el) el.innerHTML = "<li>Publications could not be loaded.</li>";
  });
  loadJSON("data/team.json").then(renderTeam).catch(() => {
    const el = document.getElementById("team-list");
    if (el) el.innerHTML = "<p>Team could not be loaded.</p>";
  });
  loadJSON("data/features.json").then(renderFeatures).catch(() => {
    const el = document.getElementById("feature-list");
    if (el) el.innerHTML = "<p>Features could not be loaded.</p>";
  });
});
