// Vercel serverless function — step 2 of the Decap CMS GitHub login.
// GitHub returns with a code -> exchange it for a token and hand the token
// back to the Decap popup via postMessage (same protocol as the Worker version).

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    res.status(400).send("Missing code");
    return;
  }
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  if (!token) {
    res.status(401).send("Login failed");
    return;
  }
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
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}
