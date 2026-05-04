import httpStatus from "http-status";
import Post from "./post.model.js";
import ApiError from "../../../error/ApiError.js";

const VALID_TYPES = ["move", "recycling", "buy_for_me", "give_away"];
const VALID_SIZES = ["small", "medium", "large", "extra_large"];
const VALID_STATUSES = ["pending", "active", "completed", "cancelled"];
const VALID_SLOT_TYPES = ["regular", "priority", "scheduled"];
const VALID_PLACEMENTS = ["inside", "outside"];
const TIME_SLOT_REGEX = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

// ─── Helpers ────────────────────────────────────────────────────────────────

const parseBody = (body) => {
  if (!body) throw new ApiError(httpStatus.BAD_REQUEST, "Request body is missing");
  // Frontend can send everything as a JSON string in a field called "data"
  if (typeof body.data === "string") {
    try {
      return JSON.parse(body.data);
    } catch {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON in 'data' field");
    }
  }
  return body;
};

const validateAddress = (addr, label) => {
  if (!addr?.text?.trim())
    throw new ApiError(httpStatus.BAD_REQUEST, `${label} address text is required`);
  if (addr.coordinates?.lat == null || addr.coordinates?.lng == null)
    throw new ApiError(httpStatus.BAD_REQUEST, `${label} address coordinates (lat, lng) are required`);
  if (typeof addr.coordinates.lat !== "number" || typeof addr.coordinates.lng !== "number")
    throw new ApiError(httpStatus.BAD_REQUEST, `${label} address coordinates must be numbers`);
};

const validatePlacement = (placement, label) => {
  if (!placement?.placement)
    throw new ApiError(httpStatus.BAD_REQUEST, `${label} placement is required`);
  if (!VALID_PLACEMENTS.includes(placement.placement))
    throw new ApiError(httpStatus.BAD_REQUEST, `${label} placement must be 'inside' or 'outside'`);
};

const validateDateTimeSlot = (slot) => {
  if (!slot?.slotType)
    throw new ApiError(httpStatus.BAD_REQUEST, "Date & time slot type is required");
  if (!VALID_SLOT_TYPES.includes(slot.slotType))
    throw new ApiError(httpStatus.BAD_REQUEST, `slotType must be one of: ${VALID_SLOT_TYPES.join(", ")}`);

  if (slot.slotType === "scheduled") {
    if (!slot.scheduledDate || !slot.scheduledTime)
      throw new ApiError(httpStatus.BAD_REQUEST, "scheduledDate and scheduledTime are required for scheduled slots");
    if (!["today", "tomorrow"].includes(slot.scheduledDate))
      throw new ApiError(httpStatus.BAD_REQUEST, "scheduledDate must be 'today' or 'tomorrow'");
    if (!TIME_SLOT_REGEX.test(slot.scheduledTime))
      throw new ApiError(httpStatus.BAD_REQUEST, "scheduledTime must be in HH:MM-HH:MM format (e.g. '09:00-10:00')");
  }
};

// ─── Create Post ─────────────────────────────────────────────────────────────

const createPost = async (userData, rawBody, files) => {
  const payload = parseBody(rawBody);

  const { type, title, description, size, pickup, dropoff, dateTimeSlot, price, campaignCode, acknowledged } = payload;

  // ── Field validation ──
  if (!type) throw new ApiError(httpStatus.BAD_REQUEST, "Post type is required");
  if (!VALID_TYPES.includes(type))
    throw new ApiError(httpStatus.BAD_REQUEST, `type must be one of: ${VALID_TYPES.join(", ")}`);

  if (!title?.trim())
    throw new ApiError(httpStatus.BAD_REQUEST, "Title is required");
  if (title.trim().length > 100)
    throw new ApiError(httpStatus.BAD_REQUEST, "Title must be 100 characters or less");

  if (description && description.length > 1000)
    throw new ApiError(httpStatus.BAD_REQUEST, "Description must be 1000 characters or less");

  if (!size) throw new ApiError(httpStatus.BAD_REQUEST, "Product size is required");
  if (!VALID_SIZES.includes(size))
    throw new ApiError(httpStatus.BAD_REQUEST, `size must be one of: ${VALID_SIZES.join(", ")}`);

  // ── Photo validation ──
  const uploadedPhotos = files?.post_image?.map((f) => f.path) ?? [];
  if (uploadedPhotos.length === 0)
    throw new ApiError(httpStatus.BAD_REQUEST, "At least one photo is required");
  if (uploadedPhotos.length > 5)
    throw new ApiError(httpStatus.BAD_REQUEST, "Maximum 5 photos allowed");

  // ── Pickup validation ──
  if (!pickup) throw new ApiError(httpStatus.BAD_REQUEST, "Pickup details are required");
  validateAddress(pickup.address, "Pickup");
  validatePlacement(pickup.placement, "Pickup");

  // ── Dropoff validation ──
  if (!dropoff) throw new ApiError(httpStatus.BAD_REQUEST, "Drop-off details are required");
  validateAddress(dropoff.address, "Drop-off");
  validatePlacement(dropoff.placement, "Drop-off");

  // ── Date & time validation ──
  validateDateTimeSlot(dateTimeSlot);

  // ── Price validation ──
  const parsedPrice = Number(price);
  if (!price || isNaN(parsedPrice) || parsedPrice < 1)
    throw new ApiError(httpStatus.BAD_REQUEST, "Price must be a positive number");

  // ── Acknowledgement required to publish ──
  if (!acknowledged)
    throw new ApiError(httpStatus.BAD_REQUEST, "You must acknowledge the terms before publishing");

  const post = await Post.create({
    user: userData.userId,
    type,
    photos: uploadedPhotos,
    title: title.trim(),
    description: description?.trim() ?? "",
    size,
    pickup: {
      address: {
        text: pickup.address.text.trim(),
        coordinates: pickup.address.coordinates,
      },
      placement: {
        placement: pickup.placement.placement,
        needToMeet: pickup.placement.needToMeet ?? false,
        canHelpCarry: pickup.placement.canHelpCarry ?? false,
        floor: pickup.placement.floor ?? "",
        doorCode: pickup.placement.doorCode ?? "",
        fitsInElevator: pickup.placement.fitsInElevator ?? false,
        otherInfo: pickup.placement.otherInfo ?? "",
      },
    },
    dropoff: {
      address: {
        text: dropoff.address.text.trim(),
        coordinates: dropoff.address.coordinates,
      },
      placement: {
        placement: dropoff.placement.placement,
        needToMeet: dropoff.placement.needToMeet ?? false,
        canHelpCarry: dropoff.placement.canHelpCarry ?? false,
        floor: dropoff.placement.floor ?? "",
        doorCode: dropoff.placement.doorCode ?? "",
        fitsInElevator: dropoff.placement.fitsInElevator ?? false,
        otherInfo: dropoff.placement.otherInfo ?? "",
      },
    },
    dateTimeSlot: {
      slotType: dateTimeSlot.slotType,
      scheduledDate: dateTimeSlot.slotType === "scheduled" ? dateTimeSlot.scheduledDate : null,
      scheduledTime: dateTimeSlot.slotType === "scheduled" ? dateTimeSlot.scheduledTime : null,
    },
    price: parsedPrice,
    campaignCode: campaignCode?.trim() || null,
    acknowledged: true,
    status: "pending",
    pickupGeo: {
      type: "Point",
      coordinates: [pickup.address.coordinates.lng, pickup.address.coordinates.lat],
    },
    dropoffGeo: {
      type: "Point",
      coordinates: [dropoff.address.coordinates.lng, dropoff.address.coordinates.lat],
    },
  });

  return post;
};

// ─── Get My Posts (user's own posts filtered by status) ──────────────────────

const getMyPosts = async (userData, query) => {
  const { status: statusFilter, page = 1, limit = 10 } = query;

  if (statusFilter && !VALID_STATUSES.includes(statusFilter))
    throw new ApiError(httpStatus.BAD_REQUEST, `status must be one of: ${VALID_STATUSES.join(", ")}`);

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = { user: userData.userId };
  if (statusFilter) filter.status = statusFilter;

  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit).lean(),
    Post.countDocuments(filter),
  ]);

  return {
    meta: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPage: Math.ceil(total / parsedLimit),
    },
    posts,
  };
};

// ─── Get Single Post ──────────────────────────────────────────────────────────

const getPostById = async (userData, postId) => {
  if (!postId) throw new ApiError(httpStatus.BAD_REQUEST, "Post ID is required");

  const post = await Post.findById(postId)
    .populate("user", "name avatar phoneNumber")
    .populate("assignedDriver", "name avatar phoneNumber")
    .lean();

  if (!post) throw new ApiError(httpStatus.NOT_FOUND, "Post not found");

  // Hide door codes from non-owner non-driver viewers
  const isOwner = post.user._id.toString() === userData.userId;
  const isAssignedDriver =
    post.assignedDriver && post.assignedDriver._id.toString() === userData.userId;

  if (!isOwner && !isAssignedDriver) {
    post.pickup.placement.doorCode = undefined;
    post.dropoff.placement.doorCode = undefined;
  }

  return post;
};

// ─── Get All Posts (Jobs feed — drivers + users browsing) ────────────────────
//
// Query params (all optional):
//   sort            "newest" (default) | "nearest"  — nearest requires lat+lng
//   lat, lng        Driver's current GPS coordinates (float) — enables geo features
//   maxDistance     km radius from lat/lng (1–120, maps to the filter slider)
//   type            Comma-separated ad types: "move,recycling,buy_for_me,give_away"
//   size            "small" | "medium" | "large" | "extra_large"
//   slotType        "regular" | "priority"
//   pickupPlacement "inside" | "outside"
//   pickupNoMeet    "true" — only posts where driver doesn't need to meet owner at pickup
//   pickupCanHelp   "true" — only posts where owner can help carry at pickup
//   dropoffPlacement "inside" | "outside"
//   dropoffNoMeet   "true" — only posts where driver doesn't need to meet anyone at dropoff
//   dropoffCanHelp  "true" — only posts where someone can help carry at dropoff
//   search          Free-text search in title + description
//   page, limit     Pagination

const getAllPosts = async (userData, query) => {
  const {
    sort = "newest",
    lat,
    lng,
    maxDistance,
    type,
    size,
    slotType,
    pickupPlacement,
    pickupNoMeet,
    pickupCanHelp,
    dropoffPlacement,
    dropoffNoMeet,
    dropoffCanHelp,
    search,
    page = 1,
    limit = 10,
  } = query;

  // ── Validate enum params ──
  const types = type
    ? type.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  if (types.some((t) => !VALID_TYPES.includes(t)))
    throw new ApiError(httpStatus.BAD_REQUEST, `type must be one of: ${VALID_TYPES.join(", ")}`);
  if (size && !VALID_SIZES.includes(size))
    throw new ApiError(httpStatus.BAD_REQUEST, `size must be one of: ${VALID_SIZES.join(", ")}`);
  if (slotType && !["regular", "priority"].includes(slotType))
    throw new ApiError(httpStatus.BAD_REQUEST, "slotType must be 'regular' or 'priority'");
  if (pickupPlacement && !VALID_PLACEMENTS.includes(pickupPlacement))
    throw new ApiError(httpStatus.BAD_REQUEST, "pickupPlacement must be 'inside' or 'outside'");
  if (dropoffPlacement && !VALID_PLACEMENTS.includes(dropoffPlacement))
    throw new ApiError(httpStatus.BAD_REQUEST, "dropoffPlacement must be 'inside' or 'outside'");

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  const parsedLat = lat != null ? parseFloat(lat) : null;
  const parsedLng = lng != null ? parseFloat(lng) : null;
  const parsedMaxDist = maxDistance
    ? Math.min(120, Math.max(1, parseFloat(maxDistance)))
    : null;
  const hasLocation = parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng);

  // ── Build filter ──
  const filter = { status: "pending" };

  // Ad type — supports single value or comma-separated multi-select
  if (types.length === 1) filter.type = types[0];
  else if (types.length > 1) filter.type = { $in: types };

  if (size) filter.size = size;
  if (slotType) filter["dateTimeSlot.slotType"] = slotType;

  if (pickupPlacement) filter["pickup.placement.placement"] = pickupPlacement;
  if (pickupNoMeet === "true") filter["pickup.placement.needToMeet"] = false;
  if (pickupCanHelp === "true") filter["pickup.placement.canHelpCarry"] = true;

  if (dropoffPlacement) filter["dropoff.placement.placement"] = dropoffPlacement;
  if (dropoffNoMeet === "true") filter["dropoff.placement.needToMeet"] = false;
  if (dropoffCanHelp === "true") filter["dropoff.placement.canHelpCarry"] = true;

  if (search?.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  // ── Geospatial ──
  // $near: sorts results by distance from driver's location (closest first).
  //   MongoDB handles the sort — do NOT add an additional .sort() or it overrides it.
  //   Accepts optional $maxDistance in metres.
  // $geoWithin $centerSphere: radius filter without forcing distance sort.
  //   Used when driver sets a maxDistance slider but keeps "newest" sort.
  let useNearSort = false;
  if (hasLocation) {
    if (sort === "nearest") {
      const geoNear = {
        $geometry: { type: "Point", coordinates: [parsedLng, parsedLat] },
      };
      if (parsedMaxDist) geoNear.$maxDistance = parsedMaxDist * 1000; // km → metres
      filter.pickupGeo = { $near: geoNear };
      useNearSort = true;
    } else if (parsedMaxDist) {
      // Radius filter only — sort remains "newest"
      // $centerSphere radius must be in radians: km / Earth's radius (6378.1 km)
      filter.pickupGeo = {
        $geoWithin: {
          $centerSphere: [[parsedLng, parsedLat], parsedMaxDist / 6378.1],
        },
      };
    }
  }

  // Hide door codes + GeoJSON shadow fields from API response
  const hiddenFields =
    "-pickup.placement.doorCode -pickup.placement.otherInfo " +
    "-dropoff.placement.doorCode -dropoff.placement.otherInfo " +
    "-pickupGeo -dropoffGeo";

  let q = Post.find(filter)
    .select(hiddenFields)
    .populate("user", "name avatar")
    .lean();

  // Only apply createdAt sort when NOT using $near (which sorts by distance implicitly)
  if (!useNearSort) q = q.sort({ createdAt: -1 });

  q = q.skip(skip).limit(parsedLimit);

  const [posts, total] = await Promise.all([q, Post.countDocuments(filter)]);

  return {
    meta: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPage: Math.ceil(total / parsedLimit),
    },
    posts,
  };
};

// ─── Update Post (only when pending) ─────────────────────────────────────────

const updatePost = async (userData, postId, rawBody, files) => {
  if (!postId) throw new ApiError(httpStatus.BAD_REQUEST, "Post ID is required");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(httpStatus.NOT_FOUND, "Post not found");

  if (post.user.toString() !== userData.userId)
    throw new ApiError(httpStatus.FORBIDDEN, "You can only edit your own posts");

  if (post.status !== "pending")
    throw new ApiError(httpStatus.BAD_REQUEST, "Only pending posts can be edited");

  const payload = parseBody(rawBody);
  const updates = {};

  // ── Title ──
  if (payload.title !== undefined) {
    if (!payload.title.trim())
      throw new ApiError(httpStatus.BAD_REQUEST, "Title cannot be empty");
    if (payload.title.trim().length > 100)
      throw new ApiError(httpStatus.BAD_REQUEST, "Title must be 100 characters or less");
    updates.title = payload.title.trim();
  }

  // ── Description ──
  if (payload.description !== undefined) {
    if (payload.description.length > 1000)
      throw new ApiError(httpStatus.BAD_REQUEST, "Description must be 1000 characters or less");
    updates.description = payload.description.trim();
  }

  // ── Size ──
  if (payload.size !== undefined) {
    if (!VALID_SIZES.includes(payload.size))
      throw new ApiError(httpStatus.BAD_REQUEST, `size must be one of: ${VALID_SIZES.join(", ")}`);
    updates.size = payload.size;
  }

  // ── Photos: merge kept existing + newly uploaded ──
  if (files?.post_image?.length || payload.keepPhotos !== undefined) {
    const newPhotos = files?.post_image?.map((f) => f.path) ?? [];
    const kept = payload.keepPhotos
      ? post.photos.filter((p) => payload.keepPhotos.includes(p))
      : post.photos;
    const merged = [...kept, ...newPhotos];
    if (merged.length === 0)
      throw new ApiError(httpStatus.BAD_REQUEST, "At least one photo is required");
    if (merged.length > 5)
      throw new ApiError(httpStatus.BAD_REQUEST, "Maximum 5 photos allowed");
    updates.photos = merged;
  }

  // ── Pickup ──
  if (payload.pickup !== undefined) {
    if (payload.pickup.address) validateAddress(payload.pickup.address, "Pickup");
    if (payload.pickup.placement) validatePlacement(payload.pickup.placement, "Pickup");
    updates.pickup = payload.pickup;
    if (payload.pickup.address?.coordinates) {
      updates.pickupGeo = {
        type: "Point",
        coordinates: [payload.pickup.address.coordinates.lng, payload.pickup.address.coordinates.lat],
      };
    }
  }

  // ── Dropoff ──
  if (payload.dropoff !== undefined) {
    if (payload.dropoff.address) validateAddress(payload.dropoff.address, "Drop-off");
    if (payload.dropoff.placement) validatePlacement(payload.dropoff.placement, "Drop-off");
    updates.dropoff = payload.dropoff;
    if (payload.dropoff.address?.coordinates) {
      updates.dropoffGeo = {
        type: "Point",
        coordinates: [payload.dropoff.address.coordinates.lng, payload.dropoff.address.coordinates.lat],
      };
    }
  }

  // ── Date & time slot ──
  if (payload.dateTimeSlot !== undefined) {
    validateDateTimeSlot(payload.dateTimeSlot);
    updates.dateTimeSlot = {
      slotType: payload.dateTimeSlot.slotType,
      scheduledDate: payload.dateTimeSlot.slotType === "scheduled" ? payload.dateTimeSlot.scheduledDate : null,
      scheduledTime: payload.dateTimeSlot.slotType === "scheduled" ? payload.dateTimeSlot.scheduledTime : null,
    };
  }

  // ── Price ──
  if (payload.price !== undefined) {
    const parsedPrice = Number(payload.price);
    if (isNaN(parsedPrice) || parsedPrice < 1)
      throw new ApiError(httpStatus.BAD_REQUEST, "Price must be a positive number");
    updates.price = parsedPrice;
  }

  // ── Campaign code ──
  if (payload.campaignCode !== undefined) {
    updates.campaignCode = payload.campaignCode?.trim() || null;
  }

  const updated = await Post.findByIdAndUpdate(postId, updates, {
    new: true,
    runValidators: true,
  });

  return updated;
};

// ─── Cancel Post ──────────────────────────────────────────────────────────────

const cancelPost = async (userData, postId) => {
  if (!postId) throw new ApiError(httpStatus.BAD_REQUEST, "Post ID is required");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(httpStatus.NOT_FOUND, "Post not found");

  if (post.user.toString() !== userData.userId)
    throw new ApiError(httpStatus.FORBIDDEN, "You can only cancel your own posts");

  if (!["pending", "active"].includes(post.status))
    throw new ApiError(httpStatus.BAD_REQUEST, "Only pending or active posts can be cancelled");

  post.status = "cancelled";
  await post.save();

  return post;
};

const PostService = {
  createPost,
  getMyPosts,
  getPostById,
  getAllPosts,
  updatePost,
  cancelPost,
};

export default PostService;
