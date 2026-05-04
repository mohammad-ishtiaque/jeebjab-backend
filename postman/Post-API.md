# Post API — Postman Testing Guide

**Base URL:** `http://localhost:5000`  
**Auth:** All routes require `Authorization: Bearer <token>` header.  
Get your token from `POST /auth/login` first.

---

## Routes Overview

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/post` | Create a new post |
| GET | `/post` | Jobs feed (all pending posts, with filters) |
| GET | `/post/my-posts` | My Post tab (your own posts) |
| GET | `/post/:id` | Single post detail |
| PATCH | `/post/:id` | Edit a post |
| PATCH | `/post/:id/cancel` | Cancel a post |

---

## 1. Create Post

**POST** `/post`

> Body type: `form-data`  
> Send post data as a JSON string in a field called **`data`**.  
> Send images in a field called **`post_image`** (1–5 files).

**`data` field value:**
```json
{
  "type": "move",
  "title": "Move Bike To Another City",
  "description": "Lightweight road bike, handle with care.",
  "size": "medium",
  "pickup": {
    "address": {
      "text": "Dubai Downtown, Burj Khalifa Blvd",
      "coordinates": { "lat": 25.1972, "lng": 55.2744 }
    },
    "placement": {
      "placement": "inside",
      "needToMeet": true,
      "canHelpCarry": true,
      "floor": "6",
      "doorCode": "A95",
      "fitsInElevator": true,
      "otherInfo": "Ring bell twice"
    }
  },
  "dropoff": {
    "address": {
      "text": "Abu Dhabi, Corniche Road",
      "coordinates": { "lat": 24.4539, "lng": 54.3773 }
    },
    "placement": {
      "placement": "outside",
      "needToMeet": false,
      "canHelpCarry": false,
      "floor": "5",
      "doorCode": "B12",
      "fitsInElevator": false,
      "otherInfo": ""
    }
  },
  "dateTimeSlot": {
    "slotType": "regular"
  },
  "price": 120,
  "campaignCode": null,
  "acknowledged": true
}
```

**Allowed values:**
- `type`: `move` | `recycling` | `buy_for_me` | `give_away`
- `size`: `small` | `medium` | `large` | `extra_large`
- `placement`: `inside` | `outside`
- `slotType`: `regular` | `priority` | `scheduled`
- If `slotType` is `scheduled`, also send `scheduledDate` (`today`/`tomorrow`) and `scheduledTime` (`HH:MM-HH:MM`)

**Example for scheduled slot:**
```json
"dateTimeSlot": {
  "slotType": "scheduled",
  "scheduledDate": "today",
  "scheduledTime": "09:00-10:00"
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Post created successfully",
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "user": "664e1a2b3c4d5e6f7a8b9c00",
    "type": "move",
    "title": "Move Bike To Another City",
    "description": "Lightweight road bike, handle with care.",
    "size": "medium",
    "photos": ["uploads/post_image/1710000000000-bike.jpg"],
    "pickup": {
      "address": { "text": "Dubai Downtown, Burj Khalifa Blvd", "coordinates": { "lat": 25.1972, "lng": 55.2744 } },
      "placement": { "placement": "inside", "needToMeet": true, "canHelpCarry": true, "floor": "6", "doorCode": "A95", "fitsInElevator": true, "otherInfo": "Ring bell twice" }
    },
    "dropoff": {
      "address": { "text": "Abu Dhabi, Corniche Road", "coordinates": { "lat": 24.4539, "lng": 54.3773 } },
      "placement": { "placement": "outside", "needToMeet": false, "canHelpCarry": false, "floor": "5", "doorCode": "B12", "fitsInElevator": false, "otherInfo": "" }
    },
    "dateTimeSlot": { "slotType": "regular", "scheduledDate": null, "scheduledTime": null },
    "price": 120,
    "campaignCode": null,
    "acknowledged": true,
    "status": "pending",
    "assignedDriver": null,
    "createdAt": "2024-01-10T09:00:00.000Z"
  }
}
```

---

## 2. Get All Posts (Jobs Feed)

**GET** `/post`

> Returns all `pending` posts. Used by both the general feed and the driver Jobs tab with filters.  
> Door codes and internal geo fields are always hidden from this feed.  
> All query params are optional — omitting them returns unfiltered results (newest first).

### Query Params

#### Sorting & Location
| Param | Example | Description |
|-------|---------|-------------|
| `sort` | `nearest` | `newest` (default) or `nearest`. `nearest` requires `lat` + `lng`. |
| `lat` | `25.1972` | Driver's current latitude. Enables geo sorting and distance filter. |
| `lng` | `55.2744` | Driver's current longitude. |
| `maxDistance` | `90` | Radius in km (1–120). Filters posts whose pickup is within this range from `lat/lng`. |

#### Ad Type (multi-select)
| Param | Example | Description |
|-------|---------|-------------|
| `type` | `move,recycling` | Comma-separated list. Any of: `move`, `recycling`, `buy_for_me`, `give_away`. |

#### Time Slot
| Param | Example | Description |
|-------|---------|-------------|
| `slotType` | `priority` | `regular` or `priority`. Filters by how urgently the user needs the delivery. |

#### Pick-Up Placement
| Param | Example | Description |
|-------|---------|-------------|
| `pickupPlacement` | `inside` | `inside` or `outside`. Where the item is located at pickup. |
| `pickupNoMeet` | `true` | Pass `true` to only show posts where the owner does NOT need to meet the driver. |
| `pickupCanHelp` | `true` | Pass `true` to only show posts where the owner CAN help carry at pickup. |

#### Drop-Off Placement
| Param | Example | Description |
|-------|---------|-------------|
| `dropoffPlacement` | `outside` | `inside` or `outside`. Where to leave the item at dropoff. |
| `dropoffNoMeet` | `true` | Pass `true` to only show posts where no one needs to meet the driver at dropoff. |
| `dropoffCanHelp` | `true` | Pass `true` to only show posts where someone can help carry at dropoff. |

#### Search & Pagination
| Param | Example | Description |
|-------|---------|-------------|
| `search` | `bike` | Free-text search in title and description. |
| `size` | `large` | Filter by item size. |
| `page` | `1` | Page number (default 1). |
| `limit` | `10` | Results per page (max 50, default 10). |

### Example Requests

**Driver opens filter screen and applies all options shown in the UI:**
```
GET /post?sort=nearest&lat=25.1972&lng=55.2744&maxDistance=90&type=move,recycling&slotType=regular&pickupPlacement=inside&dropoffPlacement=inside&page=1&limit=10
```

**Newest feed, no filters (default):**
```
GET /post
```

**Filter by ad type + time slot only:**
```
GET /post?type=give_away,buy_for_me&slotType=priority
```

**Nearest jobs within 30 km:**
```
GET /post?sort=nearest&lat=25.1972&lng=55.2744&maxDistance=30
```

**Newest jobs within 90 km radius:**
```
GET /post?lat=25.1972&lng=55.2744&maxDistance=90
```

### Success Response `200`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Posts retrieved successfully",
  "data": {
    "meta": { "page": 1, "limit": 10, "total": 24, "totalPage": 3 },
    "posts": [
      {
        "_id": "664f1a2b3c4d5e6f7a8b9c0d",
        "type": "move",
        "title": "Move Bike To Another City",
        "size": "medium",
        "photos": ["uploads/post_image/1710000000000-bike.jpg"],
        "price": 120,
        "status": "pending",
        "dateTimeSlot": { "slotType": "regular", "scheduledDate": null, "scheduledTime": null },
        "pickup": {
          "address": { "text": "Dubai Downtown, Burj Khalifa Blvd", "coordinates": { "lat": 25.1972, "lng": 55.2744 } },
          "placement": { "placement": "inside", "needToMeet": true, "canHelpCarry": true, "floor": "6", "fitsInElevator": true }
        },
        "dropoff": {
          "address": { "text": "Abu Dhabi, Corniche Road", "coordinates": { "lat": 24.4539, "lng": 54.3773 } },
          "placement": { "placement": "outside", "needToMeet": false, "canHelpCarry": false }
        },
        "user": { "_id": "...", "name": "Ahmed", "avatar": "" },
        "createdAt": "2024-01-10T09:00:00.000Z"
      }
    ]
  }
}
```

> **Note:** `doorCode`, `otherInfo`, `pickupGeo`, and `dropoffGeo` are always excluded from this feed. They are only visible in the single post detail endpoint (`GET /post/:id`) to the post owner or assigned driver.

---

## 3. Get My Posts

**GET** `/post/my-posts`

> Returns the logged-in user's own posts. Use the `status` param to switch between tabs.

**Query Params:**

| Param | Example | Description |
|-------|---------|-------------|
| `status` | `pending` | `pending` / `active` / `completed` / `cancelled` |
| `page` | `1` | Page number |
| `limit` | `10` | Results per page |

**Example:** `GET /post/my-posts?status=pending`

**Success Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "My posts retrieved successfully",
  "data": {
    "meta": { "page": 1, "limit": 10, "total": 2, "totalPage": 1 },
    "posts": [
      {
        "_id": "664f1a2b3c4d5e6f7a8b9c0d",
        "type": "move",
        "title": "Move Bike To Another City",
        "size": "medium",
        "photos": ["uploads/post_image/1710000000000-bike.jpg"],
        "price": 120,
        "status": "pending",
        "createdAt": "2024-01-10T09:00:00.000Z"
      }
    ]
  }
}
```

---

## 4. Get Post by ID

**GET** `/post/:id`

> Returns full post detail. If you are the post owner or assigned driver, door codes are visible.

**Example:** `GET /post/664f1a2b3c4d5e6f7a8b9c0d`

**Success Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Post retrieved successfully",
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "type": "move",
    "title": "Move Bike To Another City",
    "status": "pending",
    "user": { "_id": "...", "name": "Ahmed", "avatar": "", "phoneNumber": "+971501234567" },
    "assignedDriver": null,
    "photos": ["uploads/post_image/1710000000000-bike.jpg"],
    "pickup": { "address": { "text": "Dubai Downtown" }, "placement": { "doorCode": "A95" } },
    "dropoff": { "address": { "text": "Abu Dhabi" }, "placement": { "doorCode": "B12" } },
    "dateTimeSlot": { "slotType": "regular" },
    "price": 120
  }
}
```

**Error Response `404`:**
```json
{ "success": false, "statusCode": 404, "message": "Post not found" }
```

---

## 5. Update Post

**PATCH** `/post/:id`

> Only works when post status is `pending`. Send only the fields you want to change.  
> Body type: `form-data` — same format as Create.

**Example `data` field value (partial update):**
```json
{
  "title": "Updated Title",
  "price": 150
}
```

**To replace photos:** send new files in `post_image` + pass `keepPhotos` as an array of old photo paths to keep.
```json
{
  "keepPhotos": ["uploads/post_image/1710000000000-bike.jpg"]
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Post updated successfully",
  "data": { "...updated post..." }
}
```

**Error — editing a non-pending post `400`:**
```json
{ "success": false, "statusCode": 400, "message": "Only pending posts can be edited" }
```

---

## 6. Cancel Post

**PATCH** `/post/:id/cancel`

> Cancels a post. Works on `pending` or `active` posts only.

**Example:** `PATCH /post/664f1a2b3c4d5e6f7a8b9c0d/cancel`

**No body required.**

**Success Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Post cancelled successfully",
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "status": "cancelled"
  }
}
```

**Error — already cancelled `400`:**
```json
{ "success": false, "statusCode": 400, "message": "Only pending or active posts can be cancelled" }
```

---

## Common Error Responses

| Status | When |
|--------|------|
| `400` | Missing/invalid field in request body or query param |
| `401` | No token or invalid token |
| `403` | Trying to edit/cancel someone else's post |
| `404` | Post ID does not exist |
