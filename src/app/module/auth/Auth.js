import mongoose from "mongoose";
import bcrypt from "bcrypt";
import config from "../../../config/index.js";
import validator from "validator";

const { Schema, model } = mongoose;

const AuthSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            validate: {
                validator: (value) => validator.isEmail(value),
                message: "Please provide a valid email address",
            },
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            select: false,
        },
        role: {
            type: String,
            enum: ["USER", "DRIVER", "ADMIN", "SUPER_ADMIN"],
            required: true,
        },
        isVerified: {
            type: Boolean,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        verificationCode: {
            type: String,
        },
        verificationCodeExpire: {
            type: Date,
        },
        activationCode: {
            type: String,
        },
        activationCodeExpire: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

AuthSchema.statics.isAuthExist = async function (email) {
    return await this.findOne(
        { email },
        {
            name: 1,
            email: 1,
            password: 1,
            role: 1,
            isActive: 1,
            isBlocked: 1,
            isVerified: 1,
        }
    );
};

AuthSchema.statics.isPasswordMatched = async function (
    givenPassword,
    savedPassword
) {
    const result = await bcrypt.compare(givenPassword, savedPassword);
    return result;
};

AuthSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(
        this.password,
        Number(config.bcrypt_salt_rounds)
    );
});

const Auth = model("Auth", AuthSchema);

export default Auth;
