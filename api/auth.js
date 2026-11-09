// Vercel serverless function — step 1 of the Decap CMS GitHub login.
// Decap opens /api/auth -> redirect the user to GitHub to log in.
// Env vars (set in the Vercel project dashboard):
//   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET (secret also used by api/callback.js)

export default function handler(req, res) {
  const origin = `https://${req.headers.host}`;
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: "repo",
    redirect_uri: `${origin}/api/callback`,
  });
  res.writeHead(302, {
    Location: `https://github.com/login/oauth/authorize?${params.toString()}`,
  });
  res.end();
}
