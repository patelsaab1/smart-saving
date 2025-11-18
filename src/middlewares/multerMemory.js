// middlewares/multerMemory.js
import multer from "multer";


const storage = multer.memoryStorage();

export const uploadMultiple = (fields = []) => {
  const upload = multer({ storage }).fields(fields);

  // return a middleware wrapper that handles MulterErrors gracefully
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) return next();

      // MulterError handling
      if (err.name === "MulterError") {
        // Unexpected field, file too large, etc.
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }

      // any other error
      return res.status(500).json({ success: false, message: err.message || "Upload failed" });
    });
  };
};
