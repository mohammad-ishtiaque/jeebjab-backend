import { Schema, model } from "mongoose";

const coordinatesSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    coordinates: { type: coordinatesSchema, required: true },
  },
  { _id: false }
);

const placementDetailsSchema = new Schema(
  {
    placement: { type: String, enum: ["inside", "outside"], required: true },
    needToMeet: { type: Boolean, default: false },
    canHelpCarry: { type: Boolean, default: false },
    floor: { type: String, default: "" },
    doorCode: { type: String, default: "" },
    fitsInElevator: { type: Boolean, default: false },
    otherInfo: { type: String, default: "", maxlength: 500 },
  },
  { _id: false }
);

const locationSchema = new Schema(
  {
    address: { type: addressSchema, required: true },
    placement: { type: placementDetailsSchema, required: true },
  },
  { _id: false }
);

const dateTimeSlotSchema = new Schema(
  {
    slotType: {
      type: String,
      enum: ["regular", "priority", "scheduled"],
      required: true,
    },
    // Only populated when slotType === "scheduled"
    scheduledDate: {
      type: String,
      enum: ["today", "tomorrow", null],
      default: null,
    },
    scheduledTime: { type: String, default: null }, // "HH:MM-HH:MM"
  },
  { _id: false }
);

const postSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["move", "recycling", "buy_for_me", "give_away"],
      required: true,
    },
    photos: {
      type: [String],
      validate: {
        validator: (v) => v.length >= 1 && v.length <= 5,
        message: "Between 1 and 5 photos are required",
      },
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    size: {
      type: String,
      enum: ["small", "medium", "large", "extra_large"],
      required: true,
    },
    pickup: { type: locationSchema, required: true },
    dropoff: { type: locationSchema, required: true },
    dateTimeSlot: { type: dateTimeSlotSchema, required: true },
    price: { type: Number, required: true, min: 1 },
    campaignCode: { type: String, default: null, trim: true },
    acknowledged: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    assignedDriver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

postSchema.index({ user: 1, status: 1 });
postSchema.index({ status: 1, type: 1 });
postSchema.index({ createdAt: -1 });

const Post = model("Post", postSchema);

export default Post;
