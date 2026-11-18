"use strict";

const crypto = require("crypto");
const { google } = require("googleapis");

const STATE_COOKIE = "google_oauth_state";
const STATE_MAX_AGE = 10 * 60 * 1000;
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

const getRedirectUri = () => {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI) {
    return process.env.GOOGLE_OAUTH_REDIRECT_URI.trim();
  }

  const port = process.env.PORT || 8000;
  return `http://localhost:${port}/api/google/oauth/callback`;
};

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in backend/.env.",
    );
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    getRedirectUri(),
  );
};

exports.startGoogleOAuth = (req, res, next) => {
  try {
    const state = crypto.randomBytes(32).toString("hex");
    const oauthClient = getOAuthClient();
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: STATE_MAX_AGE,
    });

    return res.redirect(
      oauthClient.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [GMAIL_SEND_SCOPE],
        state,
      }),
    );
  } catch (error) {
    return next(error);
  }
};

exports.googleOAuthCallback = async (req, res, next) => {
  const expectedState = req.cookies?.[STATE_COOKIE];
  const receivedState = req.query.state;
  const expectedStateBuffer =
    typeof expectedState === "string" ? Buffer.from(expectedState) : null;
  const receivedStateBuffer =
    typeof receivedState === "string" ? Buffer.from(receivedState) : null;
  res.clearCookie(STATE_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  if (
    !expectedStateBuffer ||
    !receivedStateBuffer ||
    expectedStateBuffer.length !== receivedStateBuffer.length ||
    !crypto.timingSafeEqual(
      expectedStateBuffer,
      receivedStateBuffer,
    )
  ) {
    return res.status(400).json({ error: "Invalid Google OAuth state." });
  }

  if (req.query.error) {
    return res.status(400).json({
      error: "Google OAuth authorization was not completed.",
    });
  }

  if (typeof req.query.code !== "string" || !req.query.code) {
    return res.status(400).json({ error: "Google OAuth code is missing." });
  }

  try {
    const oauthClient = getOAuthClient();
    const { tokens } = await oauthClient.getToken(req.query.code);
    if (!tokens.refresh_token) {
      return res.status(400).set("Cache-Control", "no-store").json({
        error:
          "Google did not return a refresh token. Revoke this app's existing Google access and authorize again.",
      });
    }

    return res
      .set("Cache-Control", "no-store")
      .status(200)
      .json({
        message:
          "OAuth setup succeeded. Store this refresh token securely in backend/.env, then restart the backend.",
        refreshToken: tokens.refresh_token,
      });
  } catch (error) {
    return next(error);
  }
};
