const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

/* =========================
   GOOGLE LOGIN START
========================= */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/* =========================
   GOOGLE CALLBACK
========================= */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      const user = req.user;

      // 🔥 CREATE JWT
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // 🔥 FIXED COOKIE (PERSISTENT)
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // 👉 true in production (HTTPS)
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // ✅ 7 DAYS (THIS IS THE FIX)
      });

      // 🔥 REDIRECT
      res.redirect(process.env.FRONTEND_URL);
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).send("Authentication failed");
    }
  }
);

/* =========================
   CHECK LOGIN
========================= */
router.get("/me", (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.json({ user: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({ user: decoded });
  } catch (err) {
    res.json({ user: null });
  }
});

/* =========================
   LOGOUT
========================= */
router.get("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
});

module.exports = router;