import config from "../../config/index.js";
import ApiError from "../../error/ApiError.js";
import httpStatus from "http-status";
import jwtHelpers from "../../util/jwtHelpers.js";
import enums from "../../util/enum.js";
const { EnumUserRole } = enums;
import Auth from "../module/auth/Auth.js";

const auth =
    (roles, isAccessible = true) =>
        async (req, res, next) => {
            try {
                const tokenWithBearer = req.headers.authorization;

                if (!tokenWithBearer && !isAccessible) return next();

                if (!tokenWithBearer)
                    throw new ApiError(
                        httpStatus.UNAUTHORIZED,
                        "You are not authorized for this role"
                    );

                if (tokenWithBearer.startsWith("Bearer")) {
                    const token = tokenWithBearer.split(" ")[1];

                    const verifyUser = jwtHelpers.verifyToken(token, config.jwt.secret);

                    req.user = verifyUser;

                    const isExist = await Auth.findById(verifyUser?.authId);
                    if (
                        !Object.values(EnumUserRole).includes(verifyUser.role) ||
                        !isExist
                    ) {
                        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
                    }

                    if (roles.length && !roles.includes(verifyUser.role))
                        throw new ApiError(
                            httpStatus.FORBIDDEN,
                            "Access Forbidden: You do not have permission to perform this action"
                        );

                    next();
                }
            } catch (error) {
                next(error);
            }
        };

export default auth;
