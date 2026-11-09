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

function initials(name) {
  return String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join("");
}

function projectDetails(p) {
  const hasDetails = (p.details || "").trim() !== "";
  const hasLink = (p.link || "").trim() !== "";
  if (!hasDetails && !hasLink) return "";
  return `<details class="project-details"><summary>Project details</summary>
    ${hasDetails ? `<p>${esc(p.details)}</p>` : ""}
    ${hasLink ? `<p><a href="${esc(p.link)}" target="_blank" rel="noopener">Learn more →</a></p>` : ""}
  </details>`;
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
      ${projectDetails(p)}
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
  el.innerHTML = list.map((m) => {
    const photo = (m.photo || "").trim();
    const email = (m.email || "").trim();
    const linkedin = (m.linkedin || "").trim();
    const visual = photo
      ? `<img class="team-photo" src="${esc(photo)}" alt="Photo of ${esc(m.name)}" loading="lazy">`
      : `<span class="team-initials" aria-hidden="true">${esc(initials(m.name))}</span>`;
    const links = [
      email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : "",
      linkedin ? `<a href="${esc(linkedin)}" target="_blank" rel="noopener">LinkedIn →</a>` : "",
    ].filter(Boolean).join(" · ");
    return `
    <article class="card team-card">
      ${visual}
      <span class="tag">${esc(m.role || "Team member")}</span>
      <h3>${esc(m.name)}</h3>
      ${links ? `<p class="member-links">${links}</p>` : ""}
      <p class="meta">${esc(m.note || "")}</p>
    </article>`;
  }).join("");
}

function renderDevelopment(list) {
  const el = document.getElementById("development-list");
  if (!el) return;
  el.innerHTML = list.map((d) => `
    <article class="card">
      <span class="tag">${esc(d.tag || "Development")}</span>
      <h3>${esc(d.title)}</h3>
      <p>${esc(d.description || "")}</p>
      <p class="meta">Lead: ${esc(d.lead || "—")}</p>
      ${projectDetails(d)}
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
  loadJSON("data/development.json").then(renderDevelopment).catch(() => {
    const el = document.getElementById("development-list");
    if (el) el.innerHTML = "<p>Development work could not be loaded.</p>";
  });
});
