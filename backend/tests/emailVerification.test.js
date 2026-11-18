"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { beforeEach, test } = require("node:test");

const backendPath = path.resolve(__dirname, "..");
const userPath = path.join(backendPath, "models", "userModel.js");
const emailPath = path.join(backendPath, "utils", "email.js");
const controllerPath = path.join(backendPath, "controllers", "authControllers.js");

// ── In-memory User mock ─────────────────────────────────────────────────────
let users;
let sentEmails;
let failEmail;

class FakeUser {
  constructor(data) {
    Object.assign(this, data);
    this._pw = data.password;
    this._id = String(users.length + 1);
  }
  set(data) {
    Object.assign(this, data);
  }
  async save() {
    if (!users.includes(this)) users.push(this);
    return this;
  }
  async comparePassword(pw) {
    return pw === this._pw;
  }
  async getJwtToken() {
    return "jwt";
  }
  static findOne(query) {
    const re = query.email;
    const found =
      users.find((u) => (re instanceof RegExp ? re.test(u.email) : u.email === re)) ||
      null;
    const p = Promise.resolve(found);
    p.select = () => p;
    return p;
  }
  static async create(data) {
    const u = new FakeUser(data);
    users.push(u);
    return u;
  }
}

require.cache[userPath] = { id: userPath, filename: userPath, loaded: true, exports: FakeUser };
require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: async (opts) => {
    if (failEmail) {
      const e = new Error("535 bad credentials");
      e.category = "AUTH_FAILURE";
      throw e;
    }
    sentEmails.push(opts);
    return { accepted: [opts.email] };
  },
};

const auth = require(controllerPath);

const call = (handler, body) =>
  new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      cookie() { return this; },
      json(payload) { resolve({ status: this.statusCode, body: payload }); },
    };
    handler({ body }, res, (err) =>
      resolve({ status: err?.codeStatus || 500, body: { error: err?.message } }),
    );
  });

const lastCode = () => sentEmails.at(-1).text.match(/code is: (\d{6})/)[1];

const signupBody = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "Alex@Example.com",
  password: "StrongPass1!",
  role: "1",
  profilePhoto: "/p.png",
  isEmailVerified: true, // must be ignored
};

beforeEach(() => {
  users = [];
  sentEmails = [];
  failEmail = false;
});

test("signup emails a 6-digit code and blocks login until verified", async () => {
  const signup = await call(auth.signup, signupBody);
  assert.equal(signup.status, 201);
  assert.equal(signup.body.emailSent, true);
  assert.equal(signup.body.user, undefined, "user (with password hash) is not returned");
  assert.equal(users[0].email, "alex@example.com");
  assert.equal(users[0].isEmailVerified, false);
  assert.equal(sentEmails[0].email, "alex@example.com");
  const code = lastCode();
  assert.notEqual(users[0].emailVerificationCode, code, "code is stored hashed");

  const blocked = await call(auth.signin, { email: "alex@example.com", password: "StrongPass1!" });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.needsEmailVerification, true);

  const wrong = await call(auth.verifyEmail, { email: "alex@example.com", code: code === "111111" ? "222222" : "111111" });
  assert.equal(wrong.status, 400);

  const ok = await call(auth.verifyEmail, { email: "ALEX@example.com", code });
  assert.equal(ok.status, 200);
  assert.equal(users[0].isEmailVerified, true);

  const login = await call(auth.signin, { email: "alex@example.com", password: "StrongPass1!" });
  assert.equal(login.status, 200);
});

test("existing accounts without the flag can still log in", async () => {
  users.push(Object.assign(new FakeUser({ email: "old@example.com", password: "x" })));
  const login = await call(auth.signin, { email: "old@example.com", password: "x" });
  assert.equal(login.status, 200);
});

test("verified email cannot be registered again", async () => {
  await call(auth.signup, signupBody);
  users[0].isEmailVerified = true;
  const again = await call(auth.signup, signupBody);
  assert.equal(again.status, 400);
});

test("expired code and too many attempts are rejected", async () => {
  await call(auth.signup, signupBody);
  const code = lastCode();
  users[0].emailVerificationAttempts = 5;
  assert.equal((await call(auth.verifyEmail, { email: "alex@example.com", code })).status, 429);
  users[0].emailVerificationAttempts = 0;
  users[0].emailVerificationExpires = new Date(Date.now() - 1000);
  assert.equal((await call(auth.verifyEmail, { email: "alex@example.com", code })).status, 400);
});

test("resend respects cooldown and issues a new code", async () => {
  await call(auth.signup, signupBody);
  assert.equal((await call(auth.resendVerificationCode, { email: "alex@example.com" })).status, 429);
  users[0].emailVerificationSentAt = new Date(Date.now() - 61 * 1000);
  const resend = await call(auth.resendVerificationCode, { email: "alex@example.com" });
  assert.equal(resend.status, 200);
  assert.equal(sentEmails.length, 2);
  const ok = await call(auth.verifyEmail, { email: "alex@example.com", code: lastCode() });
  assert.equal(ok.status, 200);
});

test("signup still succeeds when SMTP fails, and reports emailSent=false", async () => {
  failEmail = true;
  const signup = await call(auth.signup, signupBody);
  assert.equal(signup.status, 201);
  assert.equal(signup.body.emailSent, false);
});
