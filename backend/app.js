const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dns = require("dns");
const morgan = require("morgan");
const bodyParser = require("body-parser");
require("dotenv").config();
var cors = require("cors");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
//import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const jobTypeRoute = require("./routes/jobsTyperoutes");
const jobRoute = require("./routes/jobsRoutes");
const uploadRoute = require("./routes/uploadRoutes");

const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");
//datbase connection
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connected"))
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
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//routes moddleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", jobTypeRoute);
app.use("/api", jobRoute);
app.use("/api", uploadRoute);

//error middlewar
app.use(errorHandler);
//port
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
