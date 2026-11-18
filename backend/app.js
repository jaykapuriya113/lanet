const path = require("path");
const dotenv = require("dotenv");

const backendEnvPath = path.join(__dirname, ".env");
const emailCredentialsAlreadyInProcess = {
  EMAIL_USERNAME: Object.prototype.hasOwnProperty.call(
    process.env,
    "EMAIL_USERNAME",
  ),
  EMAIL_PASSWORD: Object.prototype.hasOwnProperty.call(
    process.env,
    "EMAIL_PASSWORD",
  ),
};
const dotenvResult = dotenv.config({ path: backendEnvPath });

if (dotenvResult.error) {
  console.warn("[config] Unable to load backend .env file:", backendEnvPath);
} else {
  console.info("[config] backend .env loaded:", {
    path: backendEnvPath,
    EMAIL_USERNAME_defined_in_file: Boolean(
      dotenvResult.parsed && dotenvResult.parsed.EMAIL_USERNAME,
    ),
    EMAIL_PASSWORD_defined_in_file: Boolean(
      dotenvResult.parsed && dotenvResult.parsed.EMAIL_PASSWORD,
    ),
    EMAIL_USERNAME_already_in_process:
      emailCredentialsAlreadyInProcess.EMAIL_USERNAME,
    EMAIL_PASSWORD_already_in_process:
      emailCredentialsAlreadyInProcess.EMAIL_PASSWORD,
  });
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dns = require("dns");
const morgan = require("morgan");
const bodyParser = require("body-parser");
var cors = require("cors");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

//import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const jobTypeRoute = require("./routes/jobsTyperoutes");
const jobRoute = require("./routes/jobsRoutes");
const uploadRoute = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");

const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");
const {
  startApplicationDeadlineReminderService,
} = require("./services/applicationDeadlineReminderService");
//datbase connection
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connected");
    startApplicationDeadlineReminderService();
  })
  .catch((err) => console.log(err));

//middleware
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "5mb",
    extended: true,
  }),
);
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);
app.options(
  "*",
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//routes moddleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", jobTypeRoute);
app.use("/api", jobRoute);
app.use("/api", uploadRoute);
app.use("/api", adminRoutes);

//error middlewar
app.use(errorHandler);
//port
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
