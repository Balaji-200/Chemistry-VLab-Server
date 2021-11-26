const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        nameOfInst: {
            type: String,
            required: true,
        },
        password: {
            type: String,
        },
        isAdmin: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

UserSchema.plugin(passportLocalMongoose, {usernameField: "email"});

module.exports = mongoose.model("User", UserSchema);
