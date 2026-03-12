import multer from "multer";
import fs from "fs"

// ১. টাইপ এক্সটেনশন: ইমেজ এবং ভিডিও উভয়ই অ্যালাউ করা হলো
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
      // ডাইনামিক পাথ: profile_image, post_image বা chat_media ফোল্ডার তৈরি হবে
      const uploadPath = `uploads/${file.fieldname}`;
      createDirIfNotExists(uploadPath);

      if (isValidFileType(file.mimetype)) {
        cb(null, uploadPath);
      } else {
        cb(new Error("Invalid file type. Only images and videos are allowed."));
      }
    },
    filename: function (req, file, cb) {
      // স্পেস রিমুভ করে ক্লিন ফাইলনেম তৈরি`
      const name = Date.now() + "-" + file.originalname.replace(/\s/g, "_");

      // তোমার অরিজিনাল লজিক: এরর হলে ফাইল ডিলিট করার সুবিধার্থে পাথ সেভ রাখা
      if (!req.uploadedFiles) req.uploadedFiles = [];
      const filePath = `uploads/${file.fieldname}/${name}`;
      req.uploadedFiles.push(filePath);

      cb(null, name);
    },
  });

  const fileFilter = (req, file, cb) => {
    // ২. ফিল্ডনেম এক্সটেনশন: 'chat_media' যোগ করা হলো
    const allowedFieldNames = ["profile_image", "post_image", "chat_media"];

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
      fileSize: 100 * 1024 * 1024, // ৩. লিমিট ১০০ এমবি (ভিডিওর জন্য বড় সাইজ দরকার)
    },
  }).fields([
    { name: "profile_image", maxCount: 1 },
    { name: "post_image", maxCount: 5 },
    { name: "chat_media", maxCount: 10 }, // চ্যাটে একসাথে ১০টি ফাইল পাঠানো যাবে
  ]);

  return upload;
};

export default { uploadFile };