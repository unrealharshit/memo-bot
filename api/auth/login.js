const crypto = require("crypto");

module.exports = async (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const appUrl = process.env.APP_URL;

  if (!clientId || !appUrl) {
    return res.status(500).send("Discord login is not configured.");
  }

  const state = crypto.randomBytes(32).toString("hex");

  res.setHeader("Set-Cookie", `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/callback; Max-Age=300`);

  const redirectUri = `${appUrl}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state
  });

  res.writeHead(302, {
    Location: `https://discord.com/oauth2/authorize?${params}`
  });

  res.end();
};
