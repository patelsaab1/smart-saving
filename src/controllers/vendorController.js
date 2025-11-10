import User from "../models/User.js";
import Shop from "../models/Shop.js";
import apiResponse from "../utils/apiResponse.js";
import cloudinary from "cloudinary";

// Become Vendor (KYC)
export const becomeVendor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json(apiResponse({ success: false, message: "User not found" }));

    if (user.role === "vendor") {
      return res.status(400).json(apiResponse({ success: false, message: "Already a vendor" }));
    }

    const { pan, gst, license } = req.files || {};
    const kyc = {};

    // if (!pan || !gst) return res.status(400).json(apiResponse({ success: false, message: "PAN & GST required" }));

    const uploadFile = async (file) => {
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        { folder: "vendor/kyc" }
      );
      return result.secure_url;
    };

    kyc.pan = await uploadFile(pan[0]);
    kyc.gst = await uploadFile(gst[0]);
    if (license) kyc.license = await uploadFile(license[0]);

    user.kycDocuments = kyc;
    user.role = "vendor";
    user.isActive ="true"
    await user.save();

    return res.json(apiResponse({ 
      success: true, 
      message: "Vendor application submitted! Admin will review within 24 hours." 
    }));
  } catch (err) {
    console.error("Become Vendor Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// Add Shop
export const addShop = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    console.log(user)
    if (user.role !== "vendor") {
      return res.status(403).json(apiResponse({ success: false, message: "Vendor not approved yet" }));
    }

    const { shopName, category, subcategory, contactNumber, address, gstNumber, defaultDiscountRate } = req.body;
    const { rentAgreement, licenseDoc } = req.files || {};

    if (!rentAgreement) return res.status(400).json(apiResponse({ success: false, message: "Rent agreement required" }));

    const upload = (file) => cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      { folder: "shops" }
    );

    const docs = {
      rentAgreement: (await upload(rentAgreement[0])).secure_url,
    };
    if (licenseDoc) docs.licenseDoc = (await upload(licenseDoc[0])).secure_url;
    if (gstNumber) docs.gstNumber = gstNumber;

    const shop = await Shop.create({
      owner: user._id,
      shopName, category, subcategory, contactNumber,
      address: JSON.parse(address),
      documents: docs,
      defaultDiscountRate: defaultDiscountRate || 10,
      status: "pending"
    });

    return res.status(201).json(apiResponse({
      success: true,
      message: "Shop created! Waiting for admin approval.",
      data: shop
    }));
  } catch (err) {
    console.error(err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};


// vendorController.js
export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.shopId, owner: req.user.id });
    if (!shop) return res.status(404).json(apiResponse({ success: false, message: "Shop not found" }));

    const { shopName, category, subcategory, contactNumber, address, defaultDiscountRate } = req.body;
    if (shopName) shop.shopName = shopName;
    if (category) shop.category = category;
    if (subcategory) shop.subcategory = subcategory;
    if (contactNumber) shop.contactNumber = contactNumber;
    if (address) shop.address = JSON.parse(address);
    if (defaultDiscountRate) shop.defaultDiscountRate = defaultDiscountRate;

    await shop.save();
    return res.json(apiResponse({ success: true, data: shop }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

export const deleteShop = async (req, res) => {
  try {
    await Shop.findOneAndDelete({ _id: req.params.shopId, owner: req.user.id });
    return res.json(apiResponse({ success: true, message: "Shop deleted" }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};
// Upload Rate List (Photo OR Excel)
export const uploadRateList = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findOne({ _id: shopId, owner: req.user.id });
    if (!shop) return res.status(404).json(apiResponse({ success: false, message: "Shop not found" }));

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json(apiResponse({ success: false, message: "No file uploaded" }));
    }

    const upload = (file) => cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      { folder: "rate-lists" }
    );

    if (req.files.rateListFile) {
      const result = await upload(req.files.rateListFile[0]);
      shop.rateListFile = result.secure_url;
    }

    if (req.files.rateListExcel) {
      const result = await upload(req.files.rateListExcel[0]);
      shop.rateListExcel = result.secure_url;
    }

    shop.rateListStatus = "pending";
    await shop.save();

    return res.json(apiResponse({
      success: true,
      message: "Rate list uploaded! Admin will verify soon.",
      data: shop
    }));
  } catch (err) {
    console.error(err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// Get My Shops (Vendor)
export const getMyShops = async (req, res) => {
  try {
    const shops = await Shop.find({ owner: req.user.id })
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.json(apiResponse({ success: true, data: shops }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// Get Active Shops (For Users)
export const getActiveShops = async (req, res) => {
  try {
    const shops = await Shop.find({ 
      // status: "active", 
      rateListStatus: "approved" 
    })
    .populate("owner", "name phone email")
    .select("shopName category address contactNumber defaultDiscountRate");

    console.log("shop user ", shops)
    return res.json(apiResponse({ success: true, data: shops }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};