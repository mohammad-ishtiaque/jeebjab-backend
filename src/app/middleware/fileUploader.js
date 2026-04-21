import multer from "multer";
import fs from "fs"

const allowedMimeTypes = [
  "image/jpeg", "image/png", "image/jpg", "image/webp",
  "video/mp4", "video/mpeg", "video/x-matroska", "video/webm"
];

const isValidFileType = (mimetype) => allowedMimeTypes.includes(mimetype);

const createDirIfNotExists = (uploadPath) => {
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
};

const uploadFile = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = `uploads/${file.fieldname}`;
      createDirIfNotExists(uploadPath);

      if (isValidFileType(file.mimetype)) {
        cb(null, uploadPath);
      } else {
        cb(new Error("Invalid file type. Only images and videos are allowed."));
      }
    },
    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname.replace(/\s/g, "_");

      if (!req.uploadedFiles) req.uploadedFiles = [];
      const filePath = `uploads/${file.fieldname}/${name}`;
      req.uploadedFiles.push(filePath);

      cb(null, name);
    },
  });

  const allowedFieldNames = [
    "profile_image",
    "post_image",
    "chat_media",
    // driver document fields — field name IS the docType
    "driving_license",
    "vehicle_registration",
    "insurance",
    "id_proof",
    "company_id",
    "other",
  ];

  const fileFilter = (req, file, cb) => {
    if (!file.fieldname) return cb(null, true);

    if (!allowedFieldNames.includes(file.fieldname))
      return cb(new Error("Invalid fieldname"));

    if (isValidFileType(file.mimetype)) return cb(null, true);
    else return cb(new Error("Invalid file type"));
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 100 * 1024 * 1024,
    },
  }).fields([
    { name: "profile_image", maxCount: 1 },
    { name: "post_image", maxCount: 5 },
    { name: "chat_media", maxCount: 10 },
    // each driver doc type is its own field — no separate docTypes array needed
    { name: "driving_license", maxCount: 1 },
    { name: "vehicle_registration", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "id_proof", maxCount: 1 },
    { name: "company_id", maxCount: 1 },
    { name: "other", maxCount: 3 },
  ]);

  return upload;
};

export default { uploadFile };
