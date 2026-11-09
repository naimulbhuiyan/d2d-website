// Cloudflare Worker — login helper for Decap CMS (GitHub backend).
// Free on Cloudflare's Workers free tier. BACKUP ONLY: the live login runs
// on Vercel (api/auth.js, api/callback.js) because the Cloudflare account
// is locked. Setup:
//   1. Create a GitHub OAuth App (Settings > Developer settings > OAuth Apps):
//        Homepage URL:  https://YOUR-SITE.pages.dev
//        Callback URL:  https://YOUR-WORKER.workers.dev/callback
//   2. Set the secrets on this Worker:
//        wrangler secret put GITHUB_CLIENT_ID
//        wrangler secret put GITHUB_CLIENT_SECRET
//   3. Deploy: wrangler deploy
//   4. In admin/config.yml, set base_url to the Worker host (no path) and
//      auth_endpoint to `auth` (path only) — Decap opens
//      base_url + "/" + auth_endpoint. A full URL in auth_endpoint breaks it.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Step 1: Decap opens /auth -> send the user to GitHub to log in.
    if (url.pathname === "/auth") {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        scope: "repo",
        redirect_uri: `${url.origin}/callback`,
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params.toString()}`,
        302
      );
    }

    // Step 2: GitHub returns with a code -> exchange it for a token and
    // hand the token back to the Decap popup.
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing code", { status: 400 });
      }
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = await tokenRes.json();
      const token = tokenData.access_token;
      if (!token) {
        return new Response("Login failed", { status: 401 });
      }
      // Decap expects the token posted back to the opener window.
      const html = `<!DOCTYPE html><html><body><script>
        (function() {
          function receiveMessage(e) {
            if (e.data === "authorizing:github") {
              window.opener.postMessage(
                "authorization:github:success:" + JSON.stringify({ token: ${JSON.stringify(token)} }),
                e.origin
              );
            }
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        })();
      </script></body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("D2D login worker is running. Use /auth to log in.", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
