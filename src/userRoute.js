const express = require("express");
const {verifyUser, verifyPasswordReset, getToken} = require("./authenticate");
const router = express.Router();
const Users = require("./userModel");
const passport = require("passport");
const {sendConfirmationMail, sendResetPasswordMail} = require("./mail");
const {json2csvAsync} = require("json-2-csv")
const {writeFileSync} = require('fs')

router.use(express.json());

router.get("/", verifyUser, (req, res, next) => {
    if (req.user.isAdmin) {
        Users.find().then(users => {
            json2csvAsync(users, {
                excelBOM: true,
                keys: ["username", "email", "nameOfInst"],
                checkSchemaDifferences: true
            }).then(csv => {
                writeFileSync("./result.csv", csv, (err) => {
                    if (err)
                        console.error()
                })
                res.statusCode = 200;
                res.sendfile("./result.csv")
            })
        }).catch(err => next(err))

    } else {
        res.statusCode = 401;
        res.setHeader("Content-Type", "Application/json");
        res.json({
            message: "Not Autorized",
        });
    }
});

router.post("/signup", (req, res, next) => {
    Users.findOne({email: req.body.email})
        .then(
            (user) => {
                if (user) {
                    res.statusCode = 409;
                    res.setHeader("Content-Type", "application/json");
                    res.json({
                        success: true,
                        message: `An account with email address ${user.email} already exists. Please SignIn.`,
                    });
                } else {
                    Users.register(
                        {
                            username: req.body.username,
                            email: req.body.email,
                            nameOfInst: req.body.nameOfInst,
                        },
                        req.body.password,
                        (err, user) => {
                            if (err) {
                                res.statusCode = 500;
                                res.setHeader("Content-Type", "application/json");
                                res.json({err: err});
                            } else {
                                sendConfirmationMail(user.email);
                                console.log(req.isAuthenticated());
                                passport.authenticate("local")(req, res, () => {
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json({
                                        success: true,
                                        message: `Account with username ${user.username} has been created. \n You can now SignIn.`,
                                    });
                                });
                            }
                        }
                    );
                }
            },
            (err) => next(err)
        )
        .catch((err) => next(err));
});

router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            res.json({
                success: false,
                message: `Email or password is incorrect.`,
            });
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            const token = getToken({_id: user._id});
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
                success: true,
                message: "Successfully Logged in.",
                token: token,
            });
        });
    })(req, res, next);
});

router.get("/logout", verifyUser, (req, res, next) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        else {
            req.logOut();
            res.clearCookie("connect.sid");
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
                success: true,
                message: "Successfully logged out",
            });
        }
    });
});

router
    .route("/resetPassword")
    .get(verifyPasswordReset, (req, res, next) => {
        if (req.user) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
                success: true, user: {
                    email: req.user.email,
                    username: req.user.username
                }
            });
        }
    })
    .post((req, res, next) => {
        Users.findOne({email: req.body.email})
            .then(
                (user) => {
                    if (user) {
                        sendResetPasswordMail(user.email);
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json({
                            success: true,
                            message:
                                "An email has been sent with the reset link to your email. \n Please check your inbox or spam folder.",
                        });
                    } else {
                        res.statusCode = 401;
                        res.setHeader("Content-Type", "application/json");
                        res.json({
                            success: false,
                            message:
                                "Email is invalid or User with this email address doesn't exist. ",
                        });
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    });

router.post("/resetPassword/reset", (req, res, next) => {
    Users.findOne({email: req.body.email, username: req.body.username}).then(async (user) => {
        if (user) {
            await user.setPassword(req.body.password);
            await user.save().then((info) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json({
                    success: true,
                    message:
                        "Successfully Changed password, Please Login with your new password.",
                });
            });
        } else {
            res.statusCode = 501;
            res.setHeader("Content-Type", "application/json");
            res.json({
                success: false,
                message: "Something went Wrong, Please try again.",
            });
        }
    });
});

router.get("/verify", verifyUser, (req, res, next) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({username: req.user.username, email: req.user.email, isAdmin: req.user.isAdmin});
});

module.exports = router;
