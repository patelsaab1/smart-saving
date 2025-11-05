import multer from "multer";

// Use memory storage (buffer for Cloudinary, S3, etc.)
const storage = multer.memoryStorage();

// Allowed mime types grouped by category
const allowedTypes = {
  images: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  pdf: ["application/pdf"],
  excel: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv"
  ],
  docs: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

// Helper: check mimetype
const fileFilter = (allowed) => (req, file, cb) => {
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`❌ Invalid file type: ${file.mimetype}. Allowed: ${allowed.join(", ")}`),
      false
    );
  }
};

/**
 * Single File Upload
 * @param {String} fieldName - field name in form
 * @param {Array} allowed - allowed mimetypes
 * @param {Number} maxSizeMB - max size in MB
 */
export const uploadSingle = (fieldName, allowed = [...allowedTypes.images, ...allowedTypes.pdf], maxSizeMB = 10) =>
  multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: fileFilter(allowed),
  }).single(fieldName);

/**
 * Multiple Files Upload
 * @param {Array} fields - e.g. [{ name: "rentAgreement", maxCount: 1 }, { name: "licenseDoc", maxCount: 1 }]
 * @param {Array} allowed - allowed mimetypes
 * @param {Number} maxSizeMB - max size in MB
 */
export const uploadMultiple = (fields, allowed = [...allowedTypes.images, ...allowedTypes.pdf, ...allowedTypes.excel], maxSizeMB = 10) =>
  multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: fileFilter(allowed),
  }).fields(fields);

/**
 * Any File Upload (for general site graphics, config, etc.)
 * Allows all types (images, pdf, excel, docs)
 */
export const uploadAny = (maxSizeMB = 20) =>
  multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: fileFilter([
      ...allowedTypes.images,
      ...allowedTypes.pdf,
      ...allowedTypes.excel,
      ...allowedTypes.docs,
    ]),
  }).any();





const upload = multer({ storage });

export const shopUpload = upload.fields([
  { name: "rentAgreement", maxCount: 1 }, // Required
  { name: "licenseDoc", maxCount: 1 }     // Optional
]);
