const crypto = require("crypto");

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).send("Method not allowed");
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const appUrl = process.env.APP_URL;

    if (!clientId || !appUrl) {
      return res.status(500).send("OAuth configuration missing.");
    }

    const baseUrl = new URL(appUrl);

    if (baseUrl.protocol !== "https:") {
      return res.status(500).send("HTTPS is required.");
    }

    const redirectUri =
      `${baseUrl.origin}/api/auth/callback`;

    const state = crypto.randomBytes(32).toString("hex");

    res.setHeader("Cache-Control", "no-store");

    res.setHeader(
      "Set-Cookie",
      `__Host-oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`
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
    console.error("OAuth login initialization failed");

    return res.status(500).send(
      "Unable to start Discord login."
    );
  }
};
