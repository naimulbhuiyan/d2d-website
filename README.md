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
| `research.html` | **Research**: 13 running projects + manuscripts under review |
| `development.html` | **Development**: data systems, dashboards, tools, training |
| `student-lab.html` | **Student Lab**: learn-by-doing space for BPH students |
| `styles.css` | Teal theme matching the logo |
| `app.js` | Loads the content files and renders each page (no build step) |
| `data/projects.json` | The 13 running projects |
| `data/publications.json` | Manuscripts under review |
| `data/team.json` | Team members and roles |
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
2. They see only four sections: **Features & News, Projects, Publications, Team**.
3. They add or edit entries and upload images. Nothing else is visible to them.
4. They press **Submit for review**. The change becomes a review request — it does
   **not** go live immediately.
5. The admin (Naimul) approves it in GitHub. Then Cloudflare rebuilds the site
   automatically (about a minute).

## Permissions — comms team can only upload content

This is enforced in three layers:

1. **Admin panel shows content only.** Decap CMS is configured with just the four
   content collections. There is no way to edit pages, design, settings or the
   login setup from the panel.
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
