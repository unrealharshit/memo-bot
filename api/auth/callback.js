const crypto = require("crypto");

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).send("Method not allowed");
    }

    const {
      DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET,
      APP_URL,
      SESSION_SECRET
    } = process.env;

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET ||
        !APP_URL || !SESSION_SECRET || SESSION_SECRET.length < 32) {
      return res.status(500).send("OAuth configuration incomplete.");
    }

    const cookies = Object.fromEntries(
      (req.headers.cookie || "").split(";").map(cookie => {
        const index = cookie.indexOf("=");
        return index < 0
          ? [cookie.trim(), ""]
          : [
              cookie.slice(0, index).trim(),
              decodeURIComponent(cookie.slice(index + 1))
            ];
      })
    );

    const state = req.query.state;
    const savedState = cookies["__Host-oauth_state"];
    const code = req.query.code;

    if (!state || !savedState || !code ||
        typeof state !== "string" ||
        typeof savedState !== "string" ||
        state.length !== 64 ||
        !crypto.timingSafeEqual(
          Buffer.from(state),
          Buffer.from(savedState)
        )) {
      return res.status(400).send("Invalid login request. Please try again.");
    }

    const baseUrl = new URL(APP_URL);

    if (baseUrl.protocol !== "https:") {
      return res.status(500).send("HTTPS is required.");
    }

    const redirectUri = `${baseUrl.origin}/api/auth/callback`;

    const tokenResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID 
