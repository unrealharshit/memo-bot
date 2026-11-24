const crypto = require("crypto");

module.exports = async (req, res) => {
  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const cookies = Object.fromEntries(
      (req.headers.cookie || "")
        .split(";")
        .map(c => c.trim().split(/=(.*)/s).slice(0, 2))
    );

    const session = cookies.session;

    if (!session) {
      return res.status(401).json({ loggedIn: false });
    }

    const parts = session.split(".");
    if (parts.length !== 2) {
      return res.status(401).json({ loggedIn: false });
    }

    const [payload, signature] = parts;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ loggedIn: false });
    }

    const user = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    if (!user.exp || user.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ loggedIn: false });
    }

    return res.status(200).json({
      loggedIn: true,
      user
    });
  } catch {
    return res.status(401).json({ loggedIn: false });
  }
};
