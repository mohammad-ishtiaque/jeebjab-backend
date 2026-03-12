const EnumUserRole = {
    USER: "USER",
    DRIVER: "DRIVER",
    ADMIN: "ADMIN",
    SUPER_ADMIN: "SUPER_ADMIN",
};

const EnumUserAccountStatus = {
    VERIFIED: "verified",
    UNVERIFIED: "unverified",
};

const EnumDriverType = {
    INDEPENDENT: "independent",
    COMPANY: "company",
};

const EnumApprovalStatus = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
};

const EnumVehicleType = {
    BICYCLE: "bicycle",
    MOTORCYCLE: "motorcycle",
    CAR: "car",
    VAN: "van",
    TRUCK: "truck",
    OTHER: "other",
};

export default{
    EnumUserRole,
    EnumUserAccountStatus,
    EnumDriverType,
    EnumApprovalStatus,
    EnumVehicleType,
};