// src/routes/contactRoutes.js
import express from "express";
import { submitContact, getAllContacts, updateContactStatus } from "../controllers/contactController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, submitContact); // Optional auth
router.get("/admin", adminMiddleware, getAllContacts);
router.patch("/admin/:id", adminMiddleware, updateContactStatus);

export default router;