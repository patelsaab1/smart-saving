import User from "../models/User.js";
import Shop from "../models/Shop.js";
import apiResponse from "../utils/apiResponse.js";
import cloudinary from "cloudinary"; 
// import { uploadMultiple } from "../middlewares/multerMemory.js"; 

// ✅ Update Profile (Any user, including vendor)
export const updateProfile = async (req, res) => {
  try {
    const { name, dob, gender, address } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json(apiResponse({ success: false, message: "User not found" }));
    }

    // Update fields
    if (name) user.name = name;
    if (dob) user.dob = new Date(dob);
    if (gender) user.gender = gender;
    if (address) user.address = address;

    // Profile pic upload if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.buffer.toString("base64"), { resource_type: "image" });
      user.profilePic = result.secure_url;
    }

    await user.save();
    return res.json(apiResponse({ message: "Profile updated successfully", data: user }));
  } catch (err) {
    console.error("❌ Update Profile Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// ✅ Become Vendor (Submit KYC)
export const becomeVendor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json(apiResponse({ success: false, message: "User not found" }));
    }

    if (user.role === "vendor") {
      return res.status(400).json(apiResponse({ success: false, message: "Already a vendor" }));
    }

    // Upload KYC docs (assume req.files has pan, gst, license)
    const { pan, gst, license } = req.files || {};
    const kyc = {};

    if (pan) {
      const result = await cloudinary.uploader.upload(pan[0].buffer.toString("base64"), { resource_type: "auto" });
      kyc.pan = result.secure_url;
    }
    if (gst) {
      const result = await cloudinary.uploader.upload(gst[0].buffer.toString("base64"), { resource_type: "auto" });
      kyc.gst = result.secure_url;
    }
    if (license) {
      const result = await cloudinary.uploader.upload(license[0].buffer.toString("base64"), { resource_type: "auto" });
      kyc.license = result.secure_url;
    }

    user.kycDocuments = kyc;
    user.role = "vendor";
    user.vendorStatus = "pending";
    await user.save();

    return res.json(apiResponse({ message: "Vendor application submitted, pending approval" }));
  } catch (err) {
    console.error("❌ Become Vendor Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};



export const addShop = async (req, res) => {
  console.log(req.files?.rentAgreement)
  try {
    // 1️⃣ Validate user role
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "vendor") {
      return res.status(403).json(apiResponse({ success: false, message: "Only vendors can add shops" }));
    }

    const { shopName, category, subcategory, contactNumber, defaultDiscountRate, address, gstNumber } = req.body;

    // 2️⃣ Required fields
    if (!shopName  || !contactNumber) {
      return res.status(400).json(apiResponse({ success: false, message: "shopName, category, and contactNumber are required" }));
    }

    // 3️⃣ Rent Agreement (required file)
    if (!req.files?.rentAgreement?.[0]) {
      return res.status(400).json(apiResponse({ success: false, message: "Rent Agreement file is required" }));
    }

    const documents = {};

    // 4️⃣ GST Number (optional)
    if (gstNumber) documents.gstNumber = gstNumber;

    // 5️⃣ Optional License Doc
    if (req.files.licenseDoc?.[0]) {
      const licenseFile = req.files.licenseDoc[0];
      const licenseResult = await cloudinary.uploader.upload(
        `data:${licenseFile.mimetype};base64,${licenseFile.buffer.toString("base64")}`,
        { folder: "shops/licenses", resource_type: "auto" }
      );
      documents.licenseDoc = licenseResult.secure_url;
    }

    // 6️⃣ Upload Rent Agreement
    const rentFile = req.files.rentAgreement[0];
    const rentResult = await cloudinary.uploader.upload(
      `data:${rentFile.mimetype};base64,${rentFile.buffer.toString("base64")}`,
      { folder: "shops/rentAgreements", resource_type: "auto" }
    );
    documents.rentAgreement = rentResult.secure_url;

    // 7️⃣ Create Shop
    const shop = await Shop.create({
      owner: req.user.id,
      shopName,
      category,
      subcategory: subcategory || "",
      address: address ? JSON.parse(address) : {},
      contactNumber,
      documents,
      defaultDiscountRate: defaultDiscountRate || 0,
      status: "pending"
    });

    return res.status(201).json(apiResponse({
      success: true,
      message: "Shop created successfully. Waiting for admin approval.",
      data: shop
    }));

  } catch (err) {
    console.error("❌ Add Shop Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Internal Server Error" }));
  }
};






/**
 * Vendor: Upload Rate List (Excel/PDF/Image)
 */
export const uploadRateList = async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!req.file) {
      return res.status(400).json(apiResponse({ success: false, message: "No file uploaded" }));
    }

    // Find shop and check ownership
    const shop = await Shop.findById(shopId);
    if (!shop || shop.owner.toString() !== req.user.id) {
      return res.status(403).json(apiResponse({ success: false, message: "Not authorized" }));
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      { folder: "shops/rateLists", resource_type: "auto" }
    );

    // Save URL in shop
    shop.rateListFile = result.secure_url;
    shop.rateListStatus = "pending"; // admin approval pending
    await shop.save();

    return res.json(apiResponse({ message: "Rate list uploaded, pending admin approval", data: shop }));
  } catch (err) {
    console.error("❌ Upload Rate List Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};


export const getShops = async (req, res) => {
  try {
    const shops = await Shop.find({ status: "active" }).populate("owner", "name email phone");
    return res.json(apiResponse({ message: "Active shops list", data: shops }));
  } catch (err) {
    console.error("❌ Get Shops Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};