module.exports = async (req, res) => {
  res.setHeader("Set-Cookie",
    "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
  );

  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};
