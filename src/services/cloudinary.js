// src/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 🔹 Reusable function for different folders
const createStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `smart-saving/${folder}`, // dynamic folder
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "pdf"],
      transformation: [{ width: 1000, height: 1000, crop: "limit" }], // optional resize
    },
  });

// 🔹 Different uploaders
export const uploadProfile = multer({ storage: createStorage("profiles") });
export const uploadBillimage = multer({ storage: createStorage("bills") });
export const uploadVendorAll = multer({ storage: createStorage("vendors") });
export const uploadVendorKyc = multer({ storage: createStorage("vendors/kyc") });
export const uploadShopDocs = multer({ storage: createStorage("shops/docs") });
export const uploadRateListFiles = multer({ storage: createStorage("shops/rate-lists") });
export const uploadOther = multer({ storage: createStorage("others") });


export default cloudinary;
