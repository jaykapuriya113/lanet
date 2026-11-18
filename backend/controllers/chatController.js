/**
 * chatController.js
 *
 * Server-side CometChat user provisioning.
 * The REST API Key must never reach the browser — this controller calls the
 * CometChat REST API and returns only a short-lived Auth Token to the client.
 *
 * Recruiter tagging:
 *   Users with role=1 are tagged ["recruiter"] in CometChat so the User chat
 *   page can filter the contacts list to show only recruiter accounts.
 *   On every provision call we also PUT the tag onto existing accounts so
 *   recruiters created before this feature was added are included.
 */

const https = require("https");

const APP_ID       = process.env.COMETCHAT_APP_ID;
const REGION       = (process.env.COMETCHAT_REGION || "in").toLowerCase();
const REST_API_KEY = process.env.COMETCHAT_REST_API_KEY;

// Thin HTTPS wrapper — no extra npm deps needed.
const cometFetch = (method, path, body) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: `${APP_ID}.api-${REGION}.cometchat.io`,
      path: `/v3/${path}`,
      method,
      headers: {
        "Content-Type":  "application/json",
        Accept:          "application/json",
        apiKey:          REST_API_KEY,
        appId:           APP_ID,
      },
    };
    if (payload) options.headers["Content-Length"] = Buffer.byteLength(payload);

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });

// POST /api/chat/provision
// Protected by isAuthenticated — req.user is the verified DB user.
exports.provisionChatUser = async (req, res, next) => {
  try {
    if (!APP_ID || !REST_API_KEY) {
      return res.status(503).json({
        error:
          "Chat service is not configured on the server. " +
          "Set COMETCHAT_APP_ID and COMETCHAT_REST_API_KEY in backend/.env.",
      });
    }

    // Use MongoDB _id as the CometChat UID — stable, unique, no PII.
    const uid  = String(req.user._id);
    const name = `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim()
                 || req.user.email
                 || uid;

    // Recruiters (role=1) get the "recruiter" tag so the User chat page can
    // filter to show only recruiter contacts.
    const isRecruiter = Number(req.user.role) === 1;
    const userPayload = isRecruiter
      ? { uid, name, tags: ["recruiter"] }
      : { uid, name };

    // 1. Try to create the CometChat user.
    //    201/200 = created.  400 ERR_UID_ALREADY_EXISTS = already there.
    const createResp = await cometFetch("POST", "users", userPayload);

    if (
      createResp.status === 400 &&
      createResp.body?.error?.code === "ERR_UID_ALREADY_EXISTS"
    ) {
      // User already exists.  For recruiters, PUT to ensure the tag is set —
      // this covers accounts provisioned before tagging was introduced.
      if (isRecruiter) {
        await cometFetch("PUT", `users/${uid}`, userPayload);
        // Ignore PUT errors — a tag update failure should not block login.
      }
    } else if (createResp.status !== 200 && createResp.status !== 201) {
      const detail =
        createResp.body?.error?.message || JSON.stringify(createResp.body);
      return res
        .status(502)
        .json({ error: `CometChat user creation failed: ${detail}` });
    }

    // 2. Request a fresh Auth Token for this UID.
    const tokenResp = await cometFetch("POST", `users/${uid}/auth_tokens`, {});
    if (tokenResp.status !== 200 && tokenResp.status !== 201) {
      const detail =
        tokenResp.body?.error?.message || JSON.stringify(tokenResp.body);
      return res
        .status(502)
        .json({ error: `CometChat auth token failed: ${detail}` });
    }

    const authToken = tokenResp.body?.data?.authToken;
    if (!authToken) {
      return res
        .status(502)
        .json({ error: "CometChat returned no auth token." });
    }

    // Return only uid + authToken — REST key stays on the server.
    return res.status(200).json({ uid, authToken });
  } catch (err) {
    return next(err);
  }
};
