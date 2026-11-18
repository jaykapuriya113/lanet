"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { afterEach, test } = require("node:test");
const { applicationStatusEmail: renderStatusEmail } = require("../utils/emailTemplates");

const backendPath = path.resolve(__dirname, "..");
const modulePaths = {
  controller: path.join(
    backendPath,
    "controllers",
    "applicationStatusController.js",
  ),
  job: path.join(backendPath, "models", "jobModel.js"),
  user: path.join(backendPath, "models", "userModel.js"),
  history: path.join(backendPath, "models", "jobHistory.js"),
  email: path.join(backendPath, "utils", "email.js"),
  templates: path.join(backendPath, "utils", "emailTemplates.js"),
  jobsController: path.join(
    backendPath,
    "controllers",
    "jobsController.js",
  ),
};

let originalModules = new Map();
let activeMocks;

const mockModule = (filePath, exports) => {
  originalModules.set(filePath, require.cache[filePath]);
  require.cache[filePath] = {
    id: filePath,
    filename: filePath,
    loaded: true,
    exports,
  };
};

const createStatusFlow = ({
  initialStatus = "pending",
  emailError,
  smtpAccepted = true,
  candidateEmail = "candidate.registered@example.com",
} = {}) => {
  const calls = { emails: [], errors: [], infos: [], notifications: [] };
  const application = {
    _id: "application-123",
    user: "candidate-user-456",
    jobId: "job-789",
    title: "Application title",
    applicationStatus: initialStatus,
    interview:
      initialStatus === "shortlisted" || initialStatus === "interview"
        ? { date: "2030-01-02" }
        : undefined,
    statusHistory: [],
  };
  const job = {
    _id: "job-789",
    user: "recruiter-321",
    title: "Software Engineer",
    companyName: "Example Company",
  };
  const candidate = {
    email: candidateEmail,
    firstName: "Candidate",
    lastName: "Person",
  };

  const UserHistory = {
    findById: async () => application,
    findOneAndUpdate: async (filter, update) => {
      if (
        filter.applicationStatus &&
        typeof filter.applicationStatus === "object" &&
        filter.applicationStatus.$in
      ) {
        assert(
          filter.applicationStatus.$in.includes(application.applicationStatus),
        );
      } else {
        assert.equal(filter.applicationStatus, application.applicationStatus);
      }
      application.applicationStatus = update.$set.applicationStatus;
      if (update.$push) application.statusHistory.push(update.$push.statusHistory);
      return application;
    },
  };
  const User = {
    findById: (userId) => {
      assert.equal(userId, application.user);
      return {
        select: async (fields) => {
          assert.equal(fields, "email firstName lastName");
          return candidate;
        },
      };
    },
    findByIdAndUpdate: async () => candidate,
  };
  const jobsController = {
    normalizeApplicationStatus: (status) => status || "pending",
    addStatusHistoryEntry: async (record, status) => {
      record.statusHistory.push({ rawStatus: status, status });
      return true;
    },
    createApplicationStatusNotification: async (...args) => {
      calls.notifications.push(args);
    },
  };
  const sendEmail = async (message) => {
    calls.emails.push(message);
    if (emailError) throw emailError;
    return {
      accepted: smtpAccepted ? [message.email] : [],
      rejected: smtpAccepted ? [] : [message.email],
      messageId: "smtp-message-123",
    };
  };
  mockModule(modulePaths.job, { findById: async () => job });
  mockModule(modulePaths.user, User);
  mockModule(modulePaths.history, UserHistory);
  mockModule(modulePaths.email, sendEmail);
  mockModule(modulePaths.templates, {
    applicationStatusEmail: (options) => {
      const labels = {
        pending: "Applied",
        under_review: "Under Review",
        shortlisted: "Shortlisted",
        interview: "Interview",
        selected: "Selected",
        rejected: "Rejected",
      };
      return {
        subject: `Application ${labels[options.applicationStatus]}`,
        html: `<p>${options.candidateName} ${options.jobTitle} ${options.companyName} ${labels[options.applicationStatus]}</p>`,
        text: `${options.candidateName} ${options.jobTitle} ${options.companyName} ${labels[options.applicationStatus]}`,
      };
    },
  });
  mockModule(modulePaths.jobsController, jobsController);

  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;
  console.error = (...args) => calls.errors.push(args);
  console.info = (...args) => calls.infos.push(args);
  originalModules.set(
    modulePaths.controller,
    require.cache[modulePaths.controller],
  );
  delete require.cache[modulePaths.controller];
  const controller = require(modulePaths.controller);

  activeMocks = {
    application,
    calls,
    candidate,
    controller,
    job,
    originalConsoleError,
    originalConsoleInfo,
  };
  return activeMocks;
};

const invokeRecruiterStatusUpdate = async (flow, status) => {
  let responseStatus;
  let responseBody;
  let nextError;
  const response = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await flow.controller.updateRecruiterApplicationStatus(
    {
      body: { applicationStatus: status },
      params: { applicationId: flow.application._id },
      user: { _id: "recruiter-321" },
    },
    response,
    (error) => {
      nextError = error;
    },
  );

  assert.equal(nextError, undefined);
  assert.equal(responseStatus, 200);
  assert.equal(responseBody.applicationStatus, status);
  return responseBody;
};

afterEach(() => {
  if (activeMocks) {
    console.error = activeMocks.originalConsoleError;
    console.info = activeMocks.originalConsoleInfo;
  }
  for (const [filePath, originalModule] of originalModules) {
    delete require.cache[filePath];
    if (originalModule) require.cache[filePath] = originalModule;
  }
  originalModules = new Map();
  activeMocks = undefined;
});

test("sends each supported status only to the candidate email stored on the related user", async () => {
  const statuses = [
    "pending",
    "under_review",
    "shortlisted",
    "interview",
    "selected",
    "rejected",
  ];

  for (const status of statuses) {
    const flow = createStatusFlow({
      initialStatus: status === "pending" ? "under_review" : "pending",
    });
    if (status === "interview") {
      flow.application.interview = { date: "2030-01-02" };
    }

    const response = await invokeRecruiterStatusUpdate(flow, status);

    assert.equal(flow.calls.emails.length, 1);
    assert.equal(response.emailNotification.status, "accepted");
    assert(
      flow.calls.infos.some(
        ([message]) => message === "[email] applicationStatusEmail attempted:",
      ),
    );
    assert(
      flow.calls.infos.some(
        ([message]) =>
          message ===
          "[email] applicationStatusEmail accepted by SMTP provider:",
      ),
    );
    assert.equal(
      flow.calls.emails[0].email,
      "candidate.registered@example.com",
    );
    assert.equal(flow.calls.emails[0].email, flow.candidate.email);
    assert.match(flow.calls.emails[0].html, /Candidate Person/);
    assert.match(flow.calls.emails[0].html, /Software Engineer/);
    assert.match(flow.calls.emails[0].html, /Example Company/);
    const labels = {
      pending: "Applied",
      under_review: "Under Review",
      shortlisted: "Shortlisted",
      interview: "Interview",
      selected: "Selected",
      rejected: "Rejected",
    };
    assert.match(flow.calls.emails[0].html, new RegExp(labels[status]));

    const renderedEmail = renderStatusEmail({
      candidateName: "Candidate Person",
      jobTitle: "Software Engineer",
      companyName: "Example Company",
      applicationStatus: status,
      applicationId: "application-123",
    });
    assert.match(renderedEmail.subject, new RegExp(labels[status]));
    assert.match(renderedEmail.html, /Candidate Person/);
    assert.match(renderedEmail.html, /Software Engineer/);
    assert.match(renderedEmail.html, /Example Company/);
    assert.match(renderedEmail.html, new RegExp(labels[status]));
    assert.match(renderedEmail.text, new RegExp(labels[status]));
  }
});

test("does not send an email when the application status is unchanged", async () => {
  const flow = createStatusFlow({ initialStatus: "shortlisted" });

  const response = await invokeRecruiterStatusUpdate(flow, "shortlisted");

  assert.equal(flow.calls.emails.length, 0);
  assert.equal(flow.calls.notifications.length, 0);
  assert.equal(response.emailNotification.status, "not_attempted");
});

test("logs SMTP delivery errors and keeps the saved status", async () => {
  const smtpError = Object.assign(new Error("SMTP authentication failed"), {
    category: "AUTH_FAILURE",
    responseCode: 535,
    response: "535 5.7.8 Authentication rejected",
  });
  const flow = createStatusFlow({ emailError: smtpError });

  const response = await invokeRecruiterStatusUpdate(flow, "shortlisted");

  assert.equal(flow.application.applicationStatus, "shortlisted");
  assert.equal(response.emailNotification.status, "failed");
  assert.equal(flow.calls.emails.length, 1);
  assert.equal(flow.calls.errors.length, 1);
  assert.equal(flow.calls.errors[0][0], "[email] applicationStatusEmail failed:");
  assert.equal(flow.calls.errors[0][1].responseCode, 535);
  assert.equal(
    flow.calls.errors[0][1].response,
    "535 5.7.8 Authentication rejected",
  );
});

test("reports an SMTP-rejected recipient without claiming notification success", async () => {
  const flow = createStatusFlow({ smtpAccepted: false });

  const response = await invokeRecruiterStatusUpdate(flow, "shortlisted");

  assert.equal(flow.application.applicationStatus, "shortlisted");
  assert.equal(response.emailNotification.status, "failed");
  assert.equal(flow.calls.errors.length, 1);
  assert.equal(flow.calls.errors[0][1].category, "RECIPIENT_REJECTED");
});

test("strips whitespace from Gmail app password values before SMTP auth", async () => {
  const emailModulePath = require.resolve("../utils/email");
  const nodemailer = require("nodemailer");
  const originalCreateTransport = nodemailer.createTransport;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalEmailUsername = process.env.EMAIL_USERNAME;
  const originalEmailPassword = process.env.EMAIL_PASSWORD;

  process.env.NODE_ENV = "test";
  process.env.EMAIL_USERNAME = "  test.user@gmail.com  ";
  process.env.EMAIL_PASSWORD = " abcd efgh ijkl mnop ";

  let capturedAuth;
  nodemailer.createTransport = (config) => {
    capturedAuth = config.auth;
    return {
      verify: (callback) => callback(null),
      sendMail: async () => ({
        accepted: ["candidate@example.com"],
        messageId: "smtp-message-123",
      }),
    };
  };

  delete require.cache[emailModulePath];
  const sendEmail = require("../utils/email");
  await sendEmail({
    email: "candidate@example.com",
    subject: "Status update",
    text: "Hello",
  });

  assert.equal(capturedAuth.user, "test.user@gmail.com");
  assert.equal(capturedAuth.pass, "abcdefghijklmnop");

  nodemailer.createTransport = originalCreateTransport;
  process.env.NODE_ENV = originalNodeEnv;
  process.env.EMAIL_USERNAME = originalEmailUsername;
  process.env.EMAIL_PASSWORD = originalEmailPassword;
  delete require.cache[emailModulePath];
});
