import bcrypt from "bcrypt";
import cron from "node-cron";
import { status } from "http-status";
import ApiError from "../../../error/ApiError.js";
import config from "../../../config/index.js";
import jwtHelpers from "../../../util/jwtHelpers.js";
import enums from "../../../util/enum.js";
const { EnumUserRole } = enums;
import { logger } from "../../../util/logger.js";
import Auth from "./Auth.js";
import codeGenerator from "../../../util/codeGenerator.js";
import User from "../user/User.js";
import validateFields from "../../../util/validateFields.js";
import EmailHelpers from "../../../util/emailHelpers.js";

const registrationAccount = async (payload) => {
    const { role = EnumUserRole.USER, name, password, confirmPassword, email } = payload;

    validateFields(payload, [
        "password",
        "confirmPassword",
        "email",
        "role",
        "name",
    ]);

    const { code: activationCode, expiredAt: activationCodeExpire } =
        codeGenerator(3);
    const authData = {
        role,
        name,
        email,
        password,
        activationCode,
        activationCodeExpire,
    };
    const data = {
        user: name,
        activationCode,
        activationCodeExpire: Math.round(
            (activationCodeExpire - Date.now()) / (60 * 1000)
        ),
    };

    if (!Object.values(EnumUserRole).includes(role))
        throw new ApiError(status.BAD_REQUEST, "Invalid role");
    if (password !== confirmPassword)
        throw new ApiError(
            status.BAD_REQUEST,
            "Password and Confirm Password didn't match"
        );

    const user = await Auth.findOne({ email });
    if (user) {
        const message = user.isActive
            ? "Account active. Please Login"
            : "Already have an account. Please activate";

        if (!user.isActive) {
            user.activationCode = activationCode;
            user.activationCodeExpire = activationCodeExpire;
            await user.save();

            EmailHelpers.sendOtpResendEmail(email, data);
        }

        return {
            isActive: user.isActive,
            message,
        };
    }

    if (role === EnumUserRole.USER || role === EnumUserRole.DRIVER)
        EmailHelpers.sendActivationEmail(email, data);

    const auth = await Auth.create(authData);

    const userData = {
        authId: auth._id,
        name,
        email,
        phoneNumber: payload.phoneNumber,
    };

    switch (role) {
        case EnumUserRole.SUPER_ADMIN:
            await SuperAdmin.create(userData);
            break;
        case EnumUserRole.ADMIN:
            await Admin.create(userData);
            break;
        case EnumUserRole.DRIVER:
            // Same User collection — driverProfile sub-document is
            // pre-initialised so the driver can fill it in later.
            await User.create({
                ...userData,
                driverProfile: { approvalStatus: "pending" },
            });
            break;
        case EnumUserRole.USER:
        default:
            // Regular customer — driverProfile stays null
            await User.create(userData);
            break;
    }

    return {
        isActive: false,
        message: "Account created successfully. Please check your email",
    };
};

const resendActivationCode = async (payload) => {
    const email = payload.email;

    const auth = await Auth.isAuthExist(email);
    if (!auth) throw new ApiError(status.BAD_REQUEST, "Email not found!");

    const { code: activationCode, expiredAt: activationCodeExpire } =
        codeGenerator(3);
    const data = {
        auth: auth.name,
        code: activationCode,
        expiresIn: Math.round((activationCodeExpire - Date.now()) / (60 * 1000)),
    };

    auth.activationCode = activationCode;
    auth.activationCodeExpire = activationCodeExpire;
    await auth.save();

    EmailHelpers.sendOtpResendEmail(email, data);
};

const activateAccount = async (payload) => {
    const { activationCode, email } = payload;
    console.log(activationCode, email, "Activate code ")

    const auth = await Auth.findOne({ email });
    console.log(auth.activationCode, "Activate code ")
    if (!auth) throw new ApiError(status.NOT_FOUND, "User not found");
    if (!auth.activationCode)
        throw new ApiError(
            status.NOT_FOUND,
            "Activation code not found. Get a new activation code"
        );
    if (auth.activationCode !== activationCode)
        throw new ApiError(status.BAD_REQUEST, "Code didn't match!");

    await Auth.updateOne(
        { email: email },
        { isActive: true },
        {
            new: true,
            runValidators: true,
        }
    );

    let result;

    switch (auth.role) {
        case EnumUserRole.SUPER_ADMIN:
            result = await SuperAdmin.findOne({ authId: auth._id }).lean();
            break;
        case EnumUserRole.ADMIN:
            result = await Admin.findOne({ authId: auth._id }).lean();
            break;
        default:
            // Both USER and DRIVER use the User collection
            result = await User.findOne({ authId: auth._id }).lean();
    }

    const tokenPayload = {
        authId: auth._id,
        userId: result._id,
        email,
        role: auth.role,
    };

    const accessToken = jwtHelpers.createToken(
        tokenPayload,
        config.jwt.secret,
        config.jwt.expires_in
    );
    const refreshToken = jwtHelpers.createToken(
        tokenPayload,
        config.jwt.refresh_secret,
        config.jwt.refresh_expires_in
    );

    return {
        accessToken,
        refreshToken,
    };
};

const loginAccount = async (payload) => {
    const { email, password } = payload;

    const auth = await Auth.isAuthExist(email);

    if (!auth) throw new ApiError(status.NOT_FOUND, "User does not exist");
    if (!auth.isActive)
        throw new ApiError(
            status.BAD_REQUEST,
            "Please activate your account then try to login"
        );
    if (auth.isBlocked)
        throw new ApiError(status.FORBIDDEN, "You are blocked. Contact support");

    if (
        auth.password &&
        !(await Auth.isPasswordMatched(password, auth.password))
    ) {
        throw new ApiError(status.BAD_REQUEST, "Password is incorrect");
    }

    let result;
    switch (auth.role) {
        case EnumUserRole.SUPER_ADMIN:
            result = await SuperAdmin.findOne({ authId: auth._id })
                .populate("authId")
                .lean();
            break;
        case EnumUserRole.ADMIN:
            result = await Admin.findOne({ authId: auth._id })
                .populate("authId")
                .lean();
            break;
        default:
            // Both USER and DRIVER resolve from the same User collection
            result = await User.findOne({ authId: auth._id })
                .populate("authId")
                .lean();
    }

    const tokenPayload = {
        authId: auth._id,
        userId: result._id,
        email,
        role: auth.role,
    };

    const accessToken = jwtHelpers.createToken(
        tokenPayload,
        config.jwt.secret,
        config.jwt.expires_in
    );

    return {
        user: result,
        accessToken,
    };
};

const forgotPass = async (payload) => {
    const { email } = payload;

    if (!email) throw new ApiError(status.BAD_REQUEST, "Missing email");

    const auth = await Auth.isAuthExist(email);
    if (!auth) throw new ApiError(status.BAD_REQUEST, "user not found!");

    const { code: verificationCode, expiredAt: verificationCodeExpire } =
        codeGenerator(3);

    auth.verificationCode = verificationCode;
    auth.verificationCodeExpire = verificationCodeExpire;
    await auth.save();

    const data = {
        name: auth.name,
        verificationCode,
        verificationCodeExpire: Math.round(
            (verificationCodeExpire - Date.now()) / (60 * 1000)
        ),
    };

    EmailHelpers.sendResetPasswordEmail(email, data);
};

const forgetPassOtpVerify = async (payload) => {
    const { email, code } = payload;

    if (!email) throw new ApiError(status.BAD_REQUEST, "Missing email");

    const auth = await Auth.findOne({ email: email });
    if (!auth) throw new ApiError(status.NOT_FOUND, "Account does not exist!");
    if (!auth.verificationCode)
        throw new ApiError(
            status.NOT_FOUND,
            "No verification code. Get a new verification code"
        );
    if (auth.verificationCode !== code)
        throw new ApiError(status.BAD_REQUEST, "Invalid verification code!");

    await Auth.updateOne(
        { email: auth.email },
        { isVerified: true, verificationCode: null }
    );
};

const resetPassword = async (payload) => {
    const { email, newPassword, confirmPassword } = payload;

    if (newPassword !== confirmPassword)
        throw new ApiError(status.BAD_REQUEST, "Passwords do not match");

    const auth = await Auth.isAuthExist(email);
    if (!auth) throw new ApiError(status.NOT_FOUND, "User not found!");
    if (!auth.isVerified)
        throw new ApiError(status.FORBIDDEN, "Please complete OTP verification");

    const hashedPassword = await hashPass(newPassword);

    await Auth.updateOne(
        { email },
        {
            $set: { password: hashedPassword },
            $unset: {
                isVerified: "",
                verificationCode: "",
                verificationCodeExpire: "",
            },
        }
    );
};

const changePassword = async (userData, payload) => {
    const { email } = userData;
    const { oldPassword, newPassword, confirmPassword } = payload;

    validateFields(payload, ["oldPassword", "newPassword", "confirmPassword"]);

    if (newPassword !== confirmPassword)
        throw new ApiError(
            status.BAD_REQUEST,
            "Password and confirm password do not match"
        );

    const isUserExist = await Auth.isAuthExist(email);

    if (!isUserExist)
        throw new ApiError(status.NOT_FOUND, "Account does not exist!");
    if (
        isUserExist.password &&
        !(await Auth.isPasswordMatched(oldPassword, isUserExist.password))
    ) {
        throw new ApiError(status.BAD_REQUEST, "Old password is incorrect");
    }

    isUserExist.password = newPassword;
    isUserExist.save();
};

const updateFieldsWithCron = async (check) => {
    const now = new Date();
    let result;

    if (check === "activation") {
        result = await Auth.updateMany(
            {
                activationCodeExpire: { $lte: now },
            },
            {
                $unset: {
                    activationCode: "",
                    activationCodeExpire: "",
                },
            }
        );
    }

    if (check === "verification") {
        result = await Auth.updateMany(
            {
                verificationCodeExpire: { $lte: now },
            },
            {
                $unset: {
                    isVerified: "",
                    verificationCode: "",
                    verificationCodeExpire: "",
                },
            }
        );
    }

    if (result.modifiedCount > 0)
        logger.info(
            `Removed ${result.modifiedCount} expired ${check === "activation" ? "activation" : "verification"
            } code`
        );
};

const hashPass = async (newPassword) => {
    return await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
};

// Unset activationCode activationCodeExpire field for expired activation code
// Unset isVerified, verificationCode, verificationCodeExpire field for expired verification code
cron.schedule("* * * * *", async () => {
    try {
        updateFieldsWithCron("activation");
        updateFieldsWithCron("verification");
    } catch (error) {
        logger.error("Error removing expired code:", error);
    }
});

const AuthService = {
    registrationAccount,
    loginAccount,
    changePassword,
    forgotPass,
    resetPassword,
    activateAccount,
    forgetPassOtpVerify,
    resendActivationCode,
};

export default AuthService;
