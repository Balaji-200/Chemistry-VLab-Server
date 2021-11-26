const Users = require("./userModel");

const passport = require("passport");
const passportLocalStrategy = require("passport-local").Strategy;
const passportJwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");

require("dotenv").config("../.env");

passport.use(
  new passportLocalStrategy({ usernameField: "email" }, Users.authenticate())
);

passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

module.exports.getToken = (user) => {
  return jwt.sign(user, process.env.SECRET, {
    algorithm: "HS512",
    expiresIn: "3h",
  });
};

module.exports.generateResetPasswordLink = (user) => {
  const token = jwt.sign(user, process.env.FORGET_SECRET, {
    algorithm: "HS512",
    expiresIn: 300,
  });
  return `${process.env.URL}/auth/resetPassword.html?token=${token}`;
};

passport.use(
  "jwtHeader",
  new passportJwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET,
    },
    (jwt_payload, done) => {
      Users.findOne({ _id: jwt_payload._id }, (err, user) => {
        if (err) done(err, false);

        if (user) done(null, user);
        else done(null, false);
      });
    }
  )
);

passport.use(
  "resetPassword",
  new passportJwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter("token"),
      secretOrKey: process.env.FORGET_SECRET,
    },
    (jwt_payload, done) => {
      Users.findOne({ email: jwt_payload.email }, (err, user) => {
        if (err) done(err, false);

        if (user) done(null, user);
        else done(null, false);
      });
    }
  )
);

module.exports.verifyPasswordReset = passport.authenticate("resetPassword", {
  session: false,
});
exports.verifyUser = passport.authenticate("jwtHeader", { session: false });
