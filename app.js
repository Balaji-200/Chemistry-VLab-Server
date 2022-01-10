const express = require("express");
const app = express();
const logger = require("morgan");
const cors = require("cors");
const connectdb = require("./src/connectDB");
const path = require("path");
const http = require("http");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const helmet = require("helmet");
const MongoStore = require("connect-mongo");
const userRouter = require("./src/userRoute");

if (process.env.NODE_ENV === "development") {
  require("dotenv").config(".env");
  app.use(require("express-delay")(2000));
}
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      autoRemove: "interval",
      autoRemoveInterval: 1.5 * 3600 * 1000,
    }),
    cookie: {
      sameSite: "strict",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1.5 * 3600 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());
app.use(helmet());
// CORS Setup
const whitelist = [
  `http://localhost:5500`,
  `http://192.168.0.105:5500`,
  `https://balaji-200.github.io`,
];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

// Connect to database
connectdb();

app.use(cors(corsOptions));
app.use(logger("dev"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/users", userRouter);

if (process.env.NODE_ENV === "development")
  app.use((req, res, next) => setTimeout(next, 2000));
// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.error(err);
});

const server = http.createServer(app);
server.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`);
});
