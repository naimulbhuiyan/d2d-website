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
  if (!hasDetails) return "";
  return `<details class="project-details"><summary>Project details</summary>
    <p>${esc(p.details)}</p>
  </details>`;
}

function cardLink(p, label) {
  const hasLink = (p.link || "").trim() !== "";
  if (!hasLink) return "";
  return `<p><a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(label)} →</a></p>`;
}

// Lead-person photos: small circular photos from the team data (the same
// files as the home page team cards), linked to the person's LinkedIn when
// known, otherwise to the home page Team section.
function normalizeName(s) {
  return String(s || "").toLowerCase()
    .replace(/\b(dr|md|mst|most|prof)\.?/g, "")
    .replace(/\b(apa|bhai|da)\b/g, "")
    .replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
}

function buildPhotoMap(team) {
  const byFull = {};
  const firstCount = {};
  (team || []).forEach((m) => {
    const full = normalizeName(m.name);
    if (!full) return;
    byFull[full] = m;
    const first = full.split(" ")[0];
    firstCount[first] = (firstCount[first] || 0) + 1;
  });
  const byFirst = {};
  (team || []).forEach((m) => {
    const full = normalizeName(m.name);
    const first = full.split(" ")[0];
    if (first && firstCount[first] === 1) byFirst[first] = m;
  });
  return { byFull, byFirst };
}

function findPerson(name, map) {
  if (!map) return null;
  const n = normalizeName(name);
  if (!n) return null;
  // Short forms the tracker uses: "Jannat" is Jannatul Ferdouse (DayCare
  // coordinator); the other Jannatul on the team is Jannatul Ferdous Maya.
  const aliases = { "jannat": "jannatul ferdouse" };
  if (aliases[n] && map.byFull[aliases[n]]) return map.byFull[aliases[n]];
  return map.byFull[n] || map.byFirst[n.split(" ")[0]] || null;
}

function leadHTML(lead, map) {
  const raw = String(lead || "").trim();
  if (!raw || raw === "—" || /^(unassigned|team-wide)$/i.test(raw)) return esc(raw || "—");
  return raw.split(/[/+,]/).map((s) => s.trim()).filter(Boolean).map((name) => {
    const person = findPerson(name, map);
    const photo = person && (person.photo || "").trim();
    const linkedin = person && (person.linkedin || "").trim();
    const href = linkedin || "index.html#team";
    const ext = href.startsWith("http");
    const target = ext ? ' target="_blank" rel="noopener"' : "";
    const img = photo
      ? `<a href="${esc(href)}"${target}><img class="lead-photo" src="${esc(photo)}" alt="Photo of ${esc(name)}" loading="lazy"></a> `
      : "";
    return `${img}<a href="${esc(href)}"${target}>${esc(name)}</a>`;
  }).join(" · ");
}

const PROJECT_THEMES = ["Mental Health", "TB", "Digital Health", "Infectious Disease", "Child Health", "Refugee & Humanitarian Health", "Tobacco", "General Research"];

function projectCard(p, photos) {
  const deadline = (p.deadline || "").trim();
  return `
    <article class="card">
      <span class="tag">${esc(p.type || "Research")}</span>${deadline ? `<span class="tag deadline-tag">Deadline: ${esc(deadline)}</span>` : ""}
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description || "")}</p>
      <p class="meta">Lead: ${leadHTML(p.lead, photos)} · Status: ${esc(p.status || "In sprint")}</p>
      ${cardLink(p, "Drive folder")}
      ${projectDetails(p)}
    </article>`;
}

function renderProjects(list, photos) {
  const running = list.filter((p) => (p.status || "") !== "Backlog");
  const other = list.filter((p) => (p.status || "") === "Backlog");
  const renderCards = (items) => PROJECT_THEMES.map((theme) => {
    const themed = items.filter((p) => (p.theme || "General Research") === theme);
    if (!themed.length) return "";
    return `<h3 class="team-group-title">${esc(theme)}</h3><div class="cards">${themed.map((p) => projectCard(p, photos)).join("")}</div>`;
  }).join("");
  const el = document.getElementById("project-list");
  if (el) el.innerHTML = renderCards(running);
  const otherEl = document.getElementById("project-list-other");
  if (otherEl) otherEl.innerHTML = renderCards(other);
  const n = document.getElementById("stat-projects");
  if (n) n.textContent = running.length;
}

function renderPublications(list, photos) {
  const el = document.getElementById("publication-list");
  if (!el) return;
  const underReview = list.filter((p) => (p.status || "").toLowerCase().includes("review"));
  el.innerHTML = list.map((p) => {
    const links = [
      (p.web || "").trim() ? `<a href="${esc(p.web)}" target="_blank" rel="noopener">Submitted to →</a>` : "",
      (p.drive || "").trim() ? `<a href="${esc(p.drive)}" target="_blank" rel="noopener">Drive folder →</a>` : "",
    ].filter(Boolean).join(" · ");
    const lead = (p.lead || "").trim();
    return `<li><span class="pub-topic">${esc(p.topic)}</span>
    <span class="pub-note"> — ${esc(p.detail || "")} · ${esc(p.status || "")}</span>
    ${lead ? `<span class="pub-note"> · Lead: ${leadHTML(lead, photos)}</span>` : ""}
    ${links ? `<br><span class="pub-note">${links}</span>` : ""}</li>`;
  }).join("");
  const n = document.getElementById("stat-review");
  if (n) n.textContent = underReview.length;
}

function teamCard(m) {
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
}

const TEAM_GROUPS = [
  { key: "Founder", title: "" },
  { key: "Coordinators", title: "Coordinators" },
  { key: "Comm. Focal", title: "Comm. Focal" },
  { key: "Research Assistant and Volunteer", title: "Research Assistant and Volunteer" },
];

function renderTeam(list) {
  const el = document.getElementById("team-list");
  if (!el) return;
  el.innerHTML = TEAM_GROUPS.map((g) => {
    const members = list.filter((m) => (m.group || "Research Assistant and Volunteer") === g.key);
    if (!members.length) return "";
    const heading = g.title ? `<h3 class="team-group-title">${esc(g.title)} (${members.length})</h3>` : "";
    return `${heading}<div class="cards team-cards">${members.map(teamCard).join("")}</div>`;
  }).join("");
}

function renderExperts(list) {
  const el = document.getElementById("expert-list");
  if (!el) return;
  el.innerHTML = list.map((m) => {
    const photo = (m.photo || "").trim();
    const link = (m.link || "").trim();
    const visual = photo
      ? `<img class="team-photo" src="${esc(photo)}" alt="Photo of ${esc(m.name)}" loading="lazy">`
      : `<span class="team-initials" aria-hidden="true">${esc(initials(m.name))}</span>`;
    const links = link ? `<p class="member-links"><a href="${esc(link)}" target="_blank" rel="noopener">Profile →</a></p>` : "";
    return `
    <article class="card team-card">
      ${visual}
      <span class="tag">${esc(m.role || "Expert")}</span>
      <h3>${esc(m.name)}</h3>
      ${links}
      <p class="meta">${esc(m.note || "")}</p>
    </article>`;
  }).join("");
}

function renderStudentLab(data) {
  const sections = [
    ["bph-list", data.bph_statistics_lab, "No Statistics Lab members listed yet — the team adds them through the admin panel."],
    ["mph-thesis-list", data.mph_thesis, "No theses listed yet — the team adds them through the admin panel."],
    ["mph-projects-list", data.mph_projects, "No projects listed yet — the team adds them through the admin panel."],
  ];
  for (const [id, list, emptyMsg] of sections) {
    const el = document.getElementById(id);
    if (!el) continue;
    const items = Array.isArray(list) ? list : [];
    el.innerHTML = items.length ? items.map((d) => `
      <article class="card">
        <span class="tag">${esc(d.tag || "")}</span>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.description || "")}</p>
        ${cardLink(d, "Learn more")}
        ${projectDetails(d)}
      </article>`).join("") : `<p class="small">${esc(emptyMsg)}</p>`;
  }
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
      ${cardLink(d, "Learn more")}
      ${projectDetails(d)}
    </article>`).join("");
}

function renderCollaborations(list) {
  const el = document.getElementById("collab-list");
  if (!el) return;
  el.innerHTML = list.map((c) => {
    const logo = (c.logo || "").trim();
    const link = (c.link || "").trim();
    const visual = logo ? `<img class="collab-logo" src="${esc(logo)}" alt="Logo of ${esc(c.name)}" loading="lazy">` : "";
    const name = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${esc(c.name)} →</a>` : esc(c.name);
    return `
    <article class="card collab-card">
      ${visual}
      <h3>${name}</h3>
      <p class="meta">${esc(c.note || "")}</p>
    </article>`;
  }).join("");
}

function renderAchievements(list) {
  const el = document.getElementById("achievement-list");
  if (!el) return;
  const sorted = [...list].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  el.innerHTML = sorted.map((a) => {
    const photo = (a.photo || "").trim();
    const link = (a.link || "").trim();
    const visual = photo ? `<img class="achievement-photo" src="${esc(photo)}" alt="Photo: ${esc(a.title)}" loading="lazy">` : "";
    return `
    <article class="card achievement-card">
      ${visual}
      <span class="tag">${esc(a.date || "")}</span>
      <h3>${esc(a.title)}</h3>
      <p>${esc(a.description || "")}</p>
      ${link ? `<p><a href="${esc(link)}" target="_blank" rel="noopener">View on Facebook →</a></p>` : ""}
    </article>`;
  }).join("");
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
  const teamData = loadJSON("data/team.json").then((t) => {
    renderTeam(t);
    return buildPhotoMap(t);
  }).catch(() => {
    const el = document.getElementById("team-list");
    if (el) el.innerHTML = "<p>Team could not be loaded.</p>";
    return null;
  });
  teamData.then((photos) => {
    loadJSON("data/projects.json").then((l) => renderProjects(l, photos)).catch(() => {
      const el = document.getElementById("project-list");
      if (el) el.innerHTML = "<p>Projects could not be loaded.</p>";
    });
    loadJSON("data/publications.json").then((l) => renderPublications(l, photos)).catch(() => {
      const el = document.getElementById("publication-list");
      if (el) el.innerHTML = "<li>Publications could not be loaded.</li>";
    });
  });
  loadJSON("data/achievements.json").then(renderAchievements).catch(() => {
    const el = document.getElementById("achievement-list");
    if (el) el.innerHTML = "<p>Achievements could not be loaded.</p>";
  });
  loadJSON("data/features.json").then(renderFeatures).catch(() => {
    const el = document.getElementById("feature-list");
    if (el) el.innerHTML = "<p>Features could not be loaded.</p>";
  });
  loadJSON("data/experts.json").then(renderExperts).catch(() => {
    const el = document.getElementById("expert-list");
    if (el) el.innerHTML = "<p>Experts could not be loaded.</p>";
  });
  loadJSON("data/collaborations.json").then(renderCollaborations).catch(() => {
    const el = document.getElementById("collab-list");
    if (el) el.innerHTML = "<p>Collaborations could not be loaded.</p>";
  });
  loadJSON("data/development.json").then(renderDevelopment).catch(() => {
    const el = document.getElementById("development-list");
    if (el) el.innerHTML = "<p>Development work could not be loaded.</p>";
  });
  loadJSON("data/student-lab.json").then(renderStudentLab).catch(() => {
    for (const id of ["bph-list", "mph-thesis-list", "mph-projects-list"]) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "<p>Student Lab entries could not be loaded.</p>";
    }
  });
});
