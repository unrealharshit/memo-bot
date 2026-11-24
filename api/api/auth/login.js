const crypto = require("crypto");

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method not allowed");
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const appUrl = process.env.APP_URL;

    if (!clientId || !appUrl) {
      return res.status(500).send("Missing Discord configuration.");
    }

    const baseUrl = appUrl.replace(/\/+$/, "");
    const redirectUri = `${baseUrl}/api/auth/callback`;

    const state = crypto.randomBytes(32).toString("hex");

    res.setHeader("Cache-Control", "no-store");

    res.setHeader("Set-Cookie",
      `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/callback; Max-Age=300`
    );

    const discordUrl = new URL(
      "https://discord.com/oauth2/authorize"
    );

    discordUrl.searchParams.set("client_id", clientId);
    discordUrl.searchParams.set("redirect_uri", redirectUri);
    discordUrl.searchParams.set("response_type", "code");
    discordUrl.searchParams.set("scope", "identify");
    discordUrl.searchParams.set("state", state);

    return res.redirect(302, discordUrl.toString());

  } catch (error) {
    console.error("Discord login error:", error);
    return res.status(500).send("Unable to start Discord login.");
  }
};
