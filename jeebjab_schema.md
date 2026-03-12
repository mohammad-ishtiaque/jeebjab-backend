# JeebJab — Comprehensive Database Schema

> **Stack**: MongoDB + Mongoose (Node.js/Express, ESM)
> **Strategy**: Break into 5 domain groups — build one group at a time.

---

## Domain Groups (Build Order)

| # | Group | Collections |
|---|-------|-------------|
| 1 | **Auth & User** | `users` |
| 2 | **Driver Profile** | `driver_profiles` |
| 3 | **Jobs & Delivery** | `jobs`, `job_applications`, `delivery_tracking` |
| 4 | **Payments** | `payment_methods`, `transactions` |
| 5 | **Chat & Realtime** | `chats`, `messages` |
| 6 | **Dashboard / Admin** | `companies`, `compound_zones` |

---

## Group 1 — Auth & User

### `users` collection

The single unified auth collection. Every person (customer, driver, app admin, company admin, compound admin) has exactly one `User` document.

```js
{
  // ── Identity ──────────────────────────────────────────────
  name:              { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true },
  phone:             { type: String, default: null },          // E.164 format e.g. +8801XXXXXXXXX
  password:          { type: String, required: true },          // bcrypt hash
  authId:            { type: String, unique: true },            // auto-generated UUID

  // ── Roles ────────────────────────────────────────────────
  // A user can hold multiple roles simultaneously
  roles: [{
    type: String,
    enum: ['customer', 'driver', 'app_admin', 'company_admin', 'compound_admin'],
    default: 'customer'
  }],

  // ── Profile ───────────────────────────────────────────────
  avatar:            { type: String, default: null },           // image URL
  isActive:          { type: Boolean, default: true },
  isDeleted:         { type: Boolean, default: false },

  // ── Verification flags ────────────────────────────────────
  isEmailVerified:   { type: Boolean, default: false },
  isPhoneVerified:   { type: Boolean, default: false },

  // ── OTP / Code fields (short-lived, cleared after use) ────
  emailVerifyCode:       { type: String, default: null },
  emailVerifyExpiry:     { type: Date,   default: null },

  phoneVerifyCode:       { type: String, default: null },
  phoneVerifyExpiry:     { type: Date,   default: null },

  forgotPassCode:        { type: String, default: null },
  forgotPassExpiry:      { type: Date,   default: null },
  forgotPassCodeUsed:    { type: Boolean, default: false },

  // ── Relationships ─────────────────────────────────────────
  companyId:         { type: ObjectId, ref: 'Company', default: null },   // if company_admin
  compoundId:        { type: ObjectId, ref: 'CompoundZone', default: null }, // if compound_admin

  timestamps: true   // createdAt, updatedAt
}
```

**Indexes:**
- `email` — unique
- `authId` — unique
- `phone` — sparse unique (only when not null)
- `roles` — for query by role
- `companyId` — for company lookups
- `compoundId` — for compound admin lookups

---

## Group 2 — Driver Profile

### `driver_profiles` collection

Extends a user who chooses to become a driver. Created only after admin/company approval.

```js
{
  // ── Owner ──────────────────────────────────────────────────
  userId:          { type: ObjectId, ref: 'User', required: true, unique: true },

  // ── Driver Type ────────────────────────────────────────────
  driverType:      { type: String, enum: ['independent', 'company'], required: true },

  // ── Common Fields (both types) ─────────────────────────────
  vehicleType: {
    type: String,
    enum: ['bicycle', 'motorcycle', 'car', 'van', 'truck', 'other'],
    required: true
  },
  vehicleBrand:    { type: String, required: true },
  vehicleModel:    { type: String, required: true },
  vehicleYear:     { type: Number, default: null },
  licenseNumber:   { type: String, required: true },

  // Uploaded documents URLs (stored in S3 / cloud)
  documents: [{
    docType: {
      type: String,
      enum: ['driving_license', 'vehicle_registration', 'insurance', 'id_proof', 'other']
    },
    url:       String,
    uploadedAt: Date
  }],

  // ── Company Driver — extra fields ──────────────────────────
  companyId:       { type: ObjectId, ref: 'Company', default: null },
  companyDriverId: { type: String, default: null },   // company-issued employee id

  // ── Approval ───────────────────────────────────────────────
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy:     { type: ObjectId, ref: 'User', default: null },  // admin/company_admin userId
  approvedAt:     { type: Date, default: null },
  rejectionNote:  { type: String, default: null },

  // ── Availability & Rating ──────────────────────────────────
  isAvailable:    { type: Boolean, default: false },
  averageRating:  { type: Number, default: 0, min: 0, max: 5 },
  totalRatings:   { type: Number, default: 0 },
  totalDeliveries:{ type: Number, default: 0 },

  // ── Current Location (for live tracking) ──────────────────
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }  // [lng, lat]
  },
  lastLocationUpdatedAt: { type: Date, default: null },

  timestamps: true
}
```

**Indexes:**
- `userId` — unique
- `companyId` — compound driver lookup
- `approvalStatus` — filter pending drivers
- `currentLocation` — `2dsphere` (for geospatial queries / live tracking)

---

## Group 3 — Jobs & Delivery

### `jobs` collection

The core entity — a delivery job posted by any user (customer or driver).

```js
{
  // ── Author ─────────────────────────────────────────────────
  postedBy:        { type: ObjectId, ref: 'User', required: true },

  // ── Status ────────────────────────────────────────────────
  status: {
    type: String,
    enum: [
      'draft',          // saved but not published
      'published',      // live, accepting applications
      'assigned',       // driver assigned, not yet picked up
      'picked_up',      // driver confirmed pick-up
      'in_transit',     // en-route to drop-off
      'delivered',      // driver marked delivered
      'completed',      // advertiser confirmed
      'cancelled',
      'expired'
    ],
    default: 'draft'
  },

  // ── Product Info ───────────────────────────────────────────
  category: {
    type: String,
    enum: ['furniture', 'electronics', 'fragile', 'clothing', 'food', 'documents', 'other'],
    required: true
  },
  productSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra_large'],
    required: true
  },
  productName:       { type: String, required: true },
  productDescription:{ type: String, default: null },
  images:            [{ type: String }],                // array of image URLs

  // ── Pickup ─────────────────────────────────────────────────
  pickupAddress:     { type: String, required: true },
  pickupLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }  // [lng, lat]
  },
  pickupDateTime:    { type: Date, required: true },

  // ── Drop-off ───────────────────────────────────────────────
  dropoffAddress:    { type: String, required: true },
  dropoffLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }  // [lng, lat]
  },

  // Drop-off placement details
  dropoffPlacement: {
    type: String,
    enum: ['front_door', 'mailroom', 'reception', 'specific_floor', 'other'],
    default: 'front_door'
  },
  dropoffFloor:      { type: String, default: null },   // e.g. "3rd floor"
  dropoffDoorCode:   { type: String, default: null },   // building access code

  // ── Pricing ────────────────────────────────────────────────
  distanceKm:          { type: Number, default: null },           // auto-calculated
  systemRecommendedPrice: { type: Number, default: null },        // $ system suggestion
  offeredPrice:        { type: Number, required: true },          // what user is willing to pay
  finalPrice:          { type: Number, default: null },           // agreed price after assignment
  currency:            { type: String, default: 'USD' },

  // ── Conditions Checklist ───────────────────────────────────
  // User must check all before publishing
  conditionsAccepted: {
    matchesAd:          { type: Boolean, default: false },  // Corresponds with pictures & description
    nonHazardous:       { type: Boolean, default: false },  // Does not contain harmful items
    availableForPickup: { type: Boolean, default: false },  // Will be available at pickup time
  },
  conditionsAcceptedAt: { type: Date, default: null },

  // ── Assignment ─────────────────────────────────────────────
  assignedDriverId:    { type: ObjectId, ref: 'DriverProfile', default: null },
  assignedBy:          { type: ObjectId, ref: 'User', default: null }, // null = driver applied; userId = company assigned
  assignedAt:          { type: Date, default: null },

  // ── Delivery Proof (submitted by driver on delivery) ───────
  deliveryProof: {
    photoUrl:     { type: String, default: null },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    submittedAt:  { type: Date, default: null }
  },

  // ── Compound Zone (if job is in a restricted compound) ─────
  compoundZoneId: { type: ObjectId, ref: 'CompoundZone', default: null },

  // ── Expiry ─────────────────────────────────────────────────
  expiresAt: { type: Date, default: null },

  timestamps: true
}
```

**Indexes:**
- `postedBy` — user's own jobs
- `status` — filter by job status
- `pickupLocation` — `2dsphere`
- `dropoffLocation` — `2dsphere`
- `assignedDriverId` — driver's active jobs
- `compoundZoneId` — compound-restricted jobs
- `pickupDateTime` — sort/filter by time

---

### `job_applications` collection

When a driver applies for a published job (or a company assigns a driver).

```js
{
  jobId:          { type: ObjectId, ref: 'Job', required: true },
  driverId:       { type: ObjectId, ref: 'DriverProfile', required: true },
  appliedBy:      { type: ObjectId, ref: 'User', required: true },  // driver's userId

  applicationType: {
    type: String,
    enum: ['driver_applied', 'company_assigned'],
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },

  offeredPrice:   { type: Number, default: null },   // driver may counter-offer
  note:           { type: String, default: null },

  respondedAt:    { type: Date, default: null },
  respondedBy:    { type: ObjectId, ref: 'User', default: null }, // advertiser

  timestamps: true
}
```

**Indexes:**
- `{ jobId, driverId }` — unique compound (one application per driver per job)
- `jobId` — all applications for a job
- `driverId` — all applications by a driver
- `status` — filter active applications

---

### `delivery_tracking` collection

Real-time location snapshots + status events during an active delivery.

```js
{
  jobId:          { type: ObjectId, ref: 'Job', required: true },
  driverId:       { type: ObjectId, ref: 'DriverProfile', required: true },

  event: {
    type: String,
    enum: ['location_update', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    required: true
  },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }  // [lng, lat]
  },

  note:           { type: String, default: null },
  photoUrl:       { type: String, default: null },  // delivery proof photo
  recordedAt:     { type: Date, required: true, default: Date.now }
}
```

**Indexes:**
- `jobId` — all tracking events for a job
- `driverId` — all events by driver
- `recordedAt` — time-series sort
- `location` — `2dsphere`

> **Note:** For live location updates pushed via Socket.io, only **`location_update`** events are stored. Major status events (picked_up, delivered, etc.) are the important permanent records.

---

## Group 4 — Payments

### `payment_methods` collection

Payment instruments saved by users (required before publishing a job).

```js
{
  userId:         { type: ObjectId, ref: 'User', required: true },
  isDefault:      { type: Boolean, default: false },
  isActive:       { type: Boolean, default: true },

  methodType: {
    type: String,
    enum: ['card', 'bank_account', 'mobile_wallet', 'paypal'],
    required: true
  },

  // Tokenized — never store raw card numbers
  providerToken:  { type: String, required: true },  // Stripe / payment gateway token
  provider:       { type: String, default: 'stripe' },

  // Display info only (last 4, brand)
  displayLabel:   { type: String },  // e.g. "Visa •••• 4242"
  expiryMonth:    { type: Number, default: null },
  expiryYear:     { type: Number, default: null },

  timestamps: true
}
```

---

### `transactions` collection

Financial record for every payment related to a job.

```js
{
  jobId:          { type: ObjectId, ref: 'Job', required: true },
  payerId:        { type: ObjectId, ref: 'User', required: true },   // advertiser
  payeeId:        { type: ObjectId, ref: 'User', default: null },    // driver (after delivery)
  paymentMethodId:{ type: ObjectId, ref: 'PaymentMethod', required: true },

  amount:         { type: Number, required: true },
  currency:       { type: String, default: 'USD' },
  platformFee:    { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded', 'failed'],
    default: 'pending'
  },

  // Payment gateway reference
  gatewayTxnId:   { type: String, default: null },
  gatewayResponse:{ type: Schema.Types.Mixed, default: null },

  paidAt:         { type: Date, default: null },
  releasedAt:     { type: Date, default: null },

  timestamps: true
}
```

---

## Group 5 — Chat & Realtime

### `chats` collection

One-to-one chat session between an advertiser and a driver, tied to a specific job.

```js
{
  jobId:          { type: ObjectId, ref: 'Job', required: true },
  participants: [{
    type: ObjectId,
    ref: 'User',
    required: true
  }],                                           // exactly 2 participants [advertiser, driver]
  lastMessage:    { type: ObjectId, ref: 'Message', default: null },
  lastActivity:   { type: Date, default: Date.now },

  timestamps: true
}
```

**Indexes:**
- `{ jobId, participants }` — unique chat per job-pair
- `participants` — find all chats for a user

---

### `messages` collection

```js
{
  chatId:         { type: ObjectId, ref: 'Chat', required: true },
  sender:         { type: ObjectId, ref: 'User', required: true },
  receiver:       { type: ObjectId, ref: 'User', required: true },

  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'location'],
    default: 'text'
  },

  message:        { type: String, default: '' },
  fileUrl:        { type: String, default: null },

  // If messageType === 'location'
  locationData: {
    lat:  Number,
    lng:  Number,
    label: String
  },

  isRead:         { type: Boolean, default: false },
  readAt:         { type: Date, default: null },

  timestamps: true
}
```

**Indexes:**
- `chatId` — fetch all messages in a chat
- `{ chatId, createdAt }` — paginated message fetch
- `sender` — messages sent by user

---

## Group 6 — Dashboard / Admin

### `companies` collection

A logistics company that can register drivers under their umbrella.

```js
{
  name:           { type: String, required: true },
  registrationNo: { type: String, unique: true },
  adminUserId:    { type: ObjectId, ref: 'User', required: true }, // company_admin

  logo:           { type: String, default: null },
  email:          { type: String, required: true },
  phone:          { type: String, default: null },
  address:        { type: String, default: null },

  isVerified:     { type: Boolean, default: false },
  verifiedBy:     { type: ObjectId, ref: 'User', default: null },  // app_admin
  verifiedAt:     { type: Date,   default: null },

  isActive:       { type: Boolean, default: true },
  isDeleted:      { type: Boolean, default: false },

  timestamps: true
}
```

---

### `compound_zones` collection

A restricted geographic zone (apartment block, gated community) managed by a compound admin.

```js
{
  name:            { type: String, required: true },
  adminUserId:     { type: ObjectId, ref: 'User', required: true }, // compound_admin

  description:     { type: String, default: null },
  address:         { type: String, default: null },

  // GeoJSON Polygon — defines the geofence boundary
  boundary: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: { type: [[[Number]]], required: true }  // array of [lng,lat] rings
  },

  // Access rules
  requiresPreApproval: { type: Boolean, default: true },
  allowedDriverTypes: [{
    type: String,
    enum: ['independent', 'company']
  }],

  isActive:        { type: Boolean, default: true },

  timestamps: true
}
```

**Indexes:**
- `boundary` — `2dsphere` (for geofence checks — is a job's location inside a compound?)
- `adminUserId` — compound admin lookup

---

## Entity Relationship Summary

```
User (1) ──────────────────── (1) DriverProfile
User (1) ──────────────────── (N) Job              [postedBy]
User (1) ──────────────────── (N) PaymentMethod
User (1) ──────────────────── (1) Company          [company_admin]
User (1) ──────────────────── (1) CompoundZone     [compound_admin]

Job  (1) ──────────────────── (N) JobApplication
Job  (1) ──────────────────── (N) DeliveryTracking
Job  (1) ──────────────────── (1) Transaction
Job  (1) ──────────────────── (1) Chat

Chat (1) ──────────────────── (N) Message

DriverProfile (N) ─────────── (1) Company          [company drivers]
Job (N) ──────────────────── (1) CompoundZone      [if in restricted zone]
```

---

## Price Recommendation Logic (not a schema — service note)

The system recommends a price based on:

| Factor | Weight |
|--------|--------|
| Distance (km between pickup ↔ dropoff) | Primary |
| Product size (small/medium/large/xl) | Multiplier |
| Category (fragile, large furniture etc.) | Surcharge |
| Time of day / demand | Optional future |

Formula sketch:
```
recommendedPrice = BASE_RATE + (distanceKm × RATE_PER_KM × sizeMultiplier) + categorySurcharge
```

---

## Build Plan — Next Steps

| Phase | What to build |
|-------|--------------|
| **Phase 1** | Auth & User module (model, service, controller, routes, middleware) |
| **Phase 2** | Driver Profile module + admin approval flow |
| **Phase 3** | Job module (post, publish, payment gate check) |
| **Phase 4** | Job Application + Assignment flow |
| **Phase 5** | Delivery Tracking + Socket.io live location |
| **Phase 6** | Payment / Transaction module |
| **Phase 7** | Chat module (upgrade existing) |
| **Phase 8** | Dashboard: Company + CompoundZone admin panels |
