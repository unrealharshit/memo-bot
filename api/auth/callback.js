const crypto = require("crypto");

module.exports = async (req, res) => {
  try {
    const {
      DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET,
      APP_URL,
      SESSION_SECRET
    } = process.env;

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !APP_URL || !SESSION_SECRET) {
      return res.status(500).send("OAuth configuration is incomplete.");
    }

    const cookies = Object.fromEntries(
      (req.headers.cookie || "")
        .split(";")
        .map(c => c.trim().split(/=(.*)/s).slice(0, 2))
    );

    const state = req.query.state;
    const savedState = cookies.oauth_state;

    if (!state || !savedState || state !== savedState) {
      return res.status(400).send("Invalid OAuth state. Please try again.");
    }

    const redirectUri = `${APP_URL.replace(/\/$/, "")}/api/auth/callback`;

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: req.query.code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      return res.status(400).send("Discord authentication failed.");
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const user = await userResponse.json();

    if (!userResponse.ok) {
      return res.status(400).send("Could not retrieve Discord profile.");
    }

    const payload = Buffer.from(JSON.stringify({
      id: user.id,
      username: user.username,
      global_name: user.global_name || user.username,
      avatar: user.avatar,
      exp: Math.floor(Date.now() / 1000) + 604800
    })).toString("base64url");

    const signature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    res.setHeader("Set-Cookie", [
      `session=${payload}.${signature}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
      "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/callback; Max-Age=0"
    ]);

    return res.redirect(`${APP_URL.replace(/\/$/, "")}/`);
  } catch (error) {
    return res.status(500).send("Something went wrong during Discord login.");
  }
};
