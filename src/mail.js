const nodeMailer = require("nodemailer");
const {generateResetPasswordLink} = require("./authenticate");
if (process.env.NODE_ENV === "development")
    require("dotenv").config({path: "../.env"});

const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

module.exports.sendConfirmationMail = (toAddr) => {
    const mailOptions = {
        from: `"Chemistry-Vlab"<noreply@${process.env.MAIL_USER}>`,
        to: toAddr,
        subject: "Confirmation of your account",
        html: `<div>
      <img src="cid:background" style="width: 100vh; height: auto">
      <h2>Successfully created Account!!</h2>
      <h4>You can now SignIn with this account and perform experiments.</h4>
      <br>
      <p>This is an auto generated email.</p>
      <p><b>Please do not reply to this email</b></p>
      </div>`,
        attachments: [{
            filename: 'logo.png',
            path: __dirname + '/Chemistry background.png',
            cid: 'background'
        }]
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else {
            console.log(`Email sent To ${toAddr}`);
        }
    });
};

module.exports.sendResetPasswordMail = (toAddr) => {
    const resetPasswordLink = generateResetPasswordLink({email: toAddr});
    const mailOptions = {
        from: `"Chemistry-Vlab"<noreply@${process.env.MAIL_USER}>`,
        to: toAddr,
        subject: "Reset Password for your account",
        html: `<div>
            <img src="cid:background" style="width: 100vh; height: auto">
            <p>Please click on the link to change your password.</p>
            <p><a href="${resetPasswordLink}">Click Here</a></p>
            <h1> OR </h1>
            <p>Copy paste this link in your browser</p>
            <p>${resetPasswordLink}</p>
            <br>
            <p>This is an auto generated email. </p>
            <p><b>Please Do not reply to this email</b></p>
            </div>`,
        attachments: [{
            filename: 'logo.png',
            path: __dirname + '/Chemistry background.png',
            cid: 'background'
        }]
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else {
            console.log(`Email sent To ${toAddr}`);
        }
    });
};
