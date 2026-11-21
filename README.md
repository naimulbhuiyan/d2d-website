# Data 2 Decision (D2D) — Team Website

A free, professional website for the D2D research team. Static site, teal theme,
team logo, real content from the Agile Tracker. Hosted free on Cloudflare Pages,
with a login admin panel for the comms team.

**Cost: $0.** Cloudflare Pages (free) + Vercel free tier (login helper) + GitHub (free).
The login helper runs on Vercel because the Cloudflare account got locked out
(see step 3); the Cloudflare Worker version in `worker/` is kept as a backup.

## What is inside

| File | What it is |
|---|---|
| `index.html` | **Home**: hero, about, team, features, contact |
| `research.html` | **Research**: 13 running projects + 3 backlog projects + 26 submitted publications (24 under review, 1 rejected, 1 published). Each project card links to its project folder in the team's Drive (journal folder); each publication shows its lead person and links to the journal and its Drive folder where available. |
| `development.html` | **Development**: data systems, dashboards, tools, training |
| `student-lab.html` | **Student Lab**: learn-by-doing space for BPH students |
| `styles.css` | Teal theme matching the logo |
| `app.js` | Loads the content files and renders each page (no build step) |
| `data/projects.json` | The 16 projects: 13 in sprint + 3 backlog (Cumilla Research, University Student, Tobacco). Each entry's `link` is its Drive folder URL. |
| `data/publications.json` | Manuscripts under review |
| `data/team.json` | Team members — PUBLIC fields only (name, role, group, photo), shown on the home page Team section. No email, LinkedIn or note here. |
| `data/members-private.json` | Team members — member-only fields (email, LinkedIn, note, CV, suggestions). Loaded only by `dashboard.html` after a member logs in; no public page fetches it. Phone numbers are never stored here (see "Member login" below). |
| `data/development.json` | Development work shown on the Development page: 4 team items + 13 dashboards/tools from Naimul's personal site (sites.google.com/view/naimulislam2024/project). |
| `data/student-lab.json` | Student Lab: BPH Statistics Lab, MPH Thesis, MPH Projects |
| `data/features.json` | News / features posts |
| `assets/logo.png` | Team logo (transparent, 1728px) |
| `admin/` | Login panel for the comms team (Decap CMS, free) |
| `api/auth.js`, `api/callback.js` | Login helper for the admin panel (Vercel serverless functions) |
| `worker/auth.js` | Same login helper, Cloudflare Worker version (backup — Cloudflare account is locked) |
| `CODEOWNERS` | Protects structure files — only the owner can approve them |

## Deploy — step by step (all free)

### 1. GitHub repo (free)
1. Create a new repository named `d2d-website` (Public) under `naimulbhuiyan`.
   Leave it empty — no README, no .gitignore, no license.
2. Upload all files from this folder into the repo.
3. `admin/config.yml` is already set to `naimulbhuiyan/d2d-website`.

### 2. Cloudflare Pages (free)
1. Create a free Cloudflare account.
2. Workers & Pages → Create → Pages → Connect to Git.
3. Pick the `d2d-website` repo. Build command: **leave empty**. Output directory: `/`.
4. Deploy. Your site is live at `https://d2d-website-XXX.pages.dev`.
   (A custom domain can be added later, also free on Cloudflare.)

### 3. Login helper on Vercel (free)
The admin login needs a small helper so the comms team can sign in with GitHub.
It runs on Vercel (free hobby tier) because the Cloudflare account is locked.
1. Create a free Vercel account (sign up with GitHub).
2. Add New Project → Import the `naimulbhuiyan/d2d-website` repo.
   Framework preset: **Other**. Build command: **leave empty**. Output directory: `/`.
   Deploy. Note the project URL, e.g. `https://d2d-website-XXX.vercel.app`.
3. In GitHub: Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: `https://d2d-7k4.pages.dev`
   - Authorization callback URL: `https://d2d-website-five.vercel.app/api/callback`
   - Note the Client ID and generate a Client Secret.
4. In Vercel: Project → Settings → Environment Variables. Add:
   `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (Production), then redeploy
   (Deployments → ⋯ → Redeploy).
5. In `admin/config.yml`, the login is already wired to Vercel the Decap way:
   `base_url: https://d2d-website-five.vercel.app` (host only, no path) and
   `auth_endpoint: api/auth` (path only). Decap opens
   `base_url + "/" + auth_endpoint` for login — a full URL in `auth_endpoint`
   breaks it (Decap sticks it after its default api.netlify.com host).
   (Vercel project: `d2d-website`, team `Naimul` — dashboard at
   https://vercel.com/naimul4/d2d-website.)
6. Alternative, if the Cloudflare account is ever recovered: the same helper
   exists as a Cloudflare Worker in `worker/auth.js` (see its header comments).

### 4. Done
Open the site, click **Team Login**, sign in with GitHub. Every content change
rebuilds and republishes the site automatically.

## How the comms team updates the site

1. Go to `https://YOUR-SITE.pages.dev/admin/` and log in with GitHub.
2. They see only six sections: **Features & News, Projects, Publications, Team, Development, Student Lab**.
3. They add or edit entries and upload images — including team photos and project details. Nothing else is visible to them.
4. They press **Submit for review**. The change becomes a review request — it does
   **not** go live immediately.
5. The admin (Naimul) approves it in GitHub. Then Cloudflare rebuilds the site
   automatically (about a minute).

## Member login

Team members have their own login, separate from the comms team's GitHub
login (`Team Login` → `/admin/`).

**Flow:** a member clicks **Member Login** in the nav (or opens
`https://d2d-7k4.pages.dev/login.html`), enters the shared member password,
and is taken to their private dashboard (`dashboard.html`). There they pick
their name and see their details, CV and the PI's suggestions for them, and
can send updates to their own email, LinkedIn, note and CV.

**Password:** the same password works for every member. It is checked in
`login.html` as a SHA-256 hash only — the plaintext password is never stored
in the repo, in any file, or in this README. The PI gives the password to
members directly (in person or by message). A successful login sets a
`sessionStorage` flag that lasts only until the browser tab is closed; logging
out clears it, and `dashboard.html` redirects to `login.html` without it.

**Privacy:** the home page Team section shows only photo, name, role and
group. Email, LinkedIn, note, CV and suggestions are never shown publicly —
they live in `data/members-private.json`, which no public page fetches.
Honest limit: this is a static site, so the private file is still a file on
the server — anyone who guesses its URL could open it. It is hidden from the
site's pages, not locked by a server. Phone numbers are never collected at
all, for the same reason. If real access control is ever needed, that takes a
backend — which this free static setup does not have.

**Profile edits:** a member's Save sends an email to
`data2decision20@gmail.com` (subject "D2D profile update — <name>") with the
updated fields, and the member can also download their updated details as a
`.json` file. Nothing goes live from the dashboard — the PI approves each
update first, then updates the data files (through the admin panel or GitHub).

**Admin panel:** the Decap CMS team collection is split the same way —
"Team — public" edits `data/team.json`, "Team — member details (login only)"
edits `data/members-private.json` (including the new `cv` and `suggestions`
fields; only the PI writes suggestions). Keep both lists in the same order
with the same names.

This is enforced in three layers:

1. **Admin panel shows content only.** Decap CMS is configured with just the six
   content collections. There is no way to edit pages, design, settings or the
   login setup from the panel. Phone numbers are not collected at all: the
   content files are public, so a phone number stored there would not be hidden.
2. **Editorial workflow.** Every edit — and every delete request — becomes a pull
   request that the admin must approve. Nothing is deleted or published without
   that approval.
3. **GitHub branch protection + CODEOWNERS.** Protect the `main` branch
   (Settings → Branches → require a pull request + 1 approval before merging),
   and keep `CODEOWNERS` as shipped: changes to `*.html`, `*.css`, `*.js`,
   `admin/config.yml`, `worker/` and `wrangler.toml` need the owner's review.
   Give comms members **Write** access to the repo, never Admin.

So the comms team can upload features, projects, publications and team updates
every day — and cannot change the site's structure or delete anything on their own.

## Updating content without the admin panel

Any team member with repo access can also edit the `data/*.json` files directly
in GitHub — same review rule applies: changes go through a pull request.
