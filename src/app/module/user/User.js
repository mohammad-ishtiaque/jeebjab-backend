import { Schema, model } from "mongoose";

const { ObjectId } = Schema.Types;

// ─────────────────────────────────────────────────────────────────────────────
// Driver Profile Sub-document Schema
// Embedded inside UserSchema — null by default (user is a regular customer).
// Populated only when the user activates their driver account.
// ─────────────────────────────────────────────────────────────────────────────
const driverProfileSchema = new Schema(
    {
        // "independent" = solo driver | "company" = under a logistics company
        driverType: {
            type: String,
            enum: ["independent", "company"],
            default: null,
        },

        // ── Company info (company drivers only) ──────────────────
        companyId: {
            type: ObjectId,
            ref: "Company",
            default: null,
        },
        companyDriverId: {
            type: String,       // badge / employee ID issued by the company
            default: null,
        },

        // ── Vehicle info (filled during profile completion) ──────
        vehicleType: {
            type: String,
            enum: ["bicycle", "motorcycle", "car", "van", "truck", "other", null],
            default: null,
        },
        vehicleBrand: {
            type: String,
            trim: true,
            default: null,
        },
        vehicleModel: {
            type: String,
            trim: true,
            default: null,
        },
        vehicleYear: {
            type: Number,
            default: null,
        },
        licenseNumber: {
            type: String,
            trim: true,
            default: null,
        },

        // ── Documents (driving license, insurance, registration…) ─
        documents: [
            {
                docType: {
                    type: String,
                    enum: [
                        "driving_license",
                        "vehicle_registration",
                        "insurance",
                        "id_proof",
                        "company_id",
                        "other",
                    ],
                    required: true,
                },
                url: {
                    type: String,           // S3 / cloud storage URL
                    required: true,
                },
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // ── Approval ──────────────────────────────────────────────
        approvalStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        approvedBy: {
            type: ObjectId,
            ref: "Auth",        // app_admin or company_admin
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        rejectionNote: {
            type: String,
            default: null,
        },

        // ── Operational ───────────────────────────────────────────
        isAvailable: {
            type: Boolean,      // true = driver is online & accepting jobs
            default: false,
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalRatings: {
            type: Number,
            default: 0,
        },
        totalDeliveries: {
            type: Number,
            default: 0,
        },

        // ── Live location (updated via Socket.io during active delivery) ─
        currentLocation: {
            type: {
                type: String,
                enum: ["Point"],
                // Removed default: "Point" so it doesn't create half-complete objects
            },
            coordinates: {
                type: [Number],     // [longitude, latitude]
            },
        },
        lastLocationUpdatedAt: {
            type: Date,
            default: null,
        },
    },
    { _id: false }  // no separate _id for the sub-document
);

// ─────────────────────────────────────────────────────────────────────────────
// User Profile Schema  (customer + optional driver, under one authId)
// ─────────────────────────────────────────────────────────────────────────────
const userSchema = new Schema(
    {
        // ── Link to centralised Auth ──────────────────────────────
        authId: {
            type: ObjectId,
            ref: "Auth",
            required: true,
            unique: true,
        },

        // ── Basic profile (denormalised from Auth for fast reads) ─
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            default: null,      // E.164 format  e.g. +8801XXXXXXXXX
        },
        avatar: {
            type: String,
            default: null,      // image URL
        },

        // ── Verification ──────────────────────────────────────────
        isPhoneVerified: {
            type: Boolean,
            default: false,
        },

        // ── Address / default location ────────────────────────────
        defaultAddress: {
            type: String,
            default: null,
        },
        defaultLocation: {
            // GeoJSON Point — user's saved home / default location
            type: {
                type: String,
                enum: ["Point"],
                // Removed default: "Point"
            },
            coordinates: {
                type: [Number],     // [longitude, latitude]
            },
        },

        // ── Driver section ────────────────────────────────────────
        // null  → this user is a regular customer only
        // {...} → this user also has a driver profile
        // A user becomes a driver by activating this section;
        // they do NOT need a second account or a second Auth record.
        driverProfile: {
            type: driverProfileSchema,
            default: null,
        },

        // ── Soft-delete ───────────────────────────────────────────
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// ── Indexes ────────────────────────────────────────────────────────────────
// Geospatial — user's saved location
userSchema.index({ defaultLocation: "2dsphere" }, { sparse: true });

// Geospatial — driver's live location (sparse: only when driverProfile exists)
userSchema.index(
    { "driverProfile.currentLocation": "2dsphere" },
    { sparse: true }
);

// Driver availability + approval lookup
userSchema.index({
    "driverProfile.isAvailable": 1,
    "driverProfile.approvalStatus": 1,
});

// Company driver lookup
userSchema.index({ "driverProfile.companyId": 1 }, { sparse: true });

const User = model("User", userSchema);

export default User;