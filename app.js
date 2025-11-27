import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import connectDB from "./src/config/db.js";
import bodyParser from "body-parser";

// Routes Imports
import authRoutes from "./src/routes/authRoutes.js";
import vendorRoutes from "./src/routes/vendorRoutes.js";
import shoppingRoutes from "./src/routes/shoppingRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import referralRoutes from "./src/routes/referralRoutes.js";
import walletRoutes from "./src/routes/walletroutes.js";
import errorHandler from "./src/utils/errorHandler.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import subscriptionRoutes from "./src/routes/subscriptionRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import withdrawRoutes from "./src/routes/withdrawRoutes.js";

dotenv.config();
const app = express();

/* ----------------------------- IMPORTANT FIX ----------------------------- */
// Razorpay Webhook MUST receive RAW BODY
app.use(
  "/api/payments/razorpay/webhook",
  bodyParser.raw({ type: "application/json" })
);
/* ------------------------------------------------------------------------ */

// Now load express.json()
app.use(express.json({ limit: "100mb" }));
// Other middlewares
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://smartsaving.in"
        : "*",
  })
);
app.use(helmet());
app.use(compression());
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Connect to Database
connectDB()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/shopping", shoppingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/account", walletRoutes);
app.use("/api/withdrawal", withdrawRoutes);
app.use("/api/contacts", contactRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Shree SeetRam 🙏 🚀 Smart Saving API is live and running!",
    version: "1.0.0",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 1116;
app.listen(PORT, () => {
  console.log(`⚡ Smart Saving API running: http://localhost:${PORT}`);
});
