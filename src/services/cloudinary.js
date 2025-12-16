// src/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

/* ================= CLOUDINARY CONFIG ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/* ================= IMAGE STORAGE ================= */
const createImageStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `smart-saving/${folder}`,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
      transformation: [{ width: 1200, crop: "limit" }],
    },
  });

/* ================= RAW / PDF STORAGE ================= */
const createRawStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `smart-saving/${folder}`,
      resource_type: "raw",
      use_filename: true,           // keep original name
      unique_filename: true,        // avoid overwrite
      format: file.originalname.split(".").pop(), // pdf / xls
    }),
  });

/* ================= MULTER EXPORTS ================= */
export const uploadProfile = multer({
  storage: createImageStorage("profiles"),
});

export const uploadBillimage = multer({
  storage: createImageStorage("bills"),
});

export const uploadVendorAll = multer({
  storage: createImageStorage("vendors"),
});

export const uploadVendorKyc = multer({
  storage: createImageStorage("vendors/kyc"),
});

export const uploadShopDocs = multer({
  storage: createRawStorage("shops/docs"),
});

export const uploadRateListFiles = multer({
  storage: createRawStorage("shops/rate-lists"),
});

export const uploadOther = multer({
  storage: createRawStorage("others"),
});

export default cloudinary;
