// controllers/vendorController.js
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import apiResponse from "../utils/apiResponse.js";

// 🔹 Add new Shop
export const addShop = async (req, res) => {
  // console.log(req.body)
  console.log("req.files ",req.files)
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "vendor") {
      return res
        .status(403)
        .json(apiResponse({ success: false, message: "Unauthorized or not a vendor" }));
    }

    const { shopName, category, subcategory, contactNumber, address, gstNumber, defaultDiscountRate } = req.body;
    const { rentAgreement, licenseDoc } = req.files || {};

    if (!rentAgreement)
      return res
        .status(400)
        .json(apiResponse({ success: false, message: "Rent agreement required" }));

    const shopDocs = {
      rentAgreement: rentAgreement[0].path,
      licenseDoc: licenseDoc ? licenseDoc[0].path : null,
      gstNumber: gstNumber || "",
    };

    const shop = await Shop.create({
      owner: user._id,
      shopName,
      category,
      subcategory,
      contactNumber,
      address: JSON.parse(address || "{}"),
      documents: shopDocs,
      defaultDiscountRate: defaultDiscountRate || 10,
      status: "pending",
    });

    return res.status(201).json(
      apiResponse({
        success: true,
        message: "Shop created successfully. Awaiting admin approval.",
        data: shop,
      })
    );
  } catch (err) {
    console.error("Add Shop Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// 🔹 Update Shop
export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.shopId, owner: req.user.id });
    if (!shop)
      return res.status(404).json(apiResponse({ success: false, message: "Shop not found" }));

    const { shopName, category, subcategory, contactNumber, address, defaultDiscountRate } = req.body;
    const { rentAgreement, licenseDoc } = req.files || {};

    if (shopName) shop.shopName = shopName;
    if (category) shop.category = category;
    if (subcategory) shop.subcategory = subcategory;
    if (contactNumber) shop.contactNumber = contactNumber;
    if (address) shop.address = JSON.parse(address || "{}");
    if (defaultDiscountRate) shop.defaultDiscountRate = defaultDiscountRate;

    if (rentAgreement) shop.documents.rentAgreement = rentAgreement[0].path;
    if (licenseDoc) shop.documents.licenseDoc = licenseDoc[0].path;

    shop.status = "pending"; // re-verify after update

    await shop.save();
    return res.json(apiResponse({ success: true, message: "Shop updated successfully.", data: shop }));
  } catch (err) {
    console.error("Update Shop Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// 🔹 Delete Shop
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findOneAndDelete({ _id: req.params.shopId, owner: req.user.id });
    if (!shop)
      return res.status(404).json(apiResponse({ success: false, message: "Shop not found" }));

    return res.json(apiResponse({ success: true, message: "Shop deleted successfully" }));
  } catch (err) {
    console.error("Delete Shop Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// 🔹 Upload Rate List
export const uploadRateList = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findOne({ _id: shopId, owner: req.user.id });
    if (!shop)
      return res.status(404).json(apiResponse({ success: false, message: "Shop not found" }));

    const { rateListFile, rateListExcel } = req.files || {};

    if (!rateListFile && !rateListExcel)
      return res.status(400).json(apiResponse({ success: false, message: "No file uploaded" }));

    if (rateListFile) shop.rateListFile = rateListFile[0].path;
    if (rateListExcel) shop.rateListExcel = rateListExcel[0].path;

    shop.rateListStatus = "pending"; // admin verification required
    await shop.save();

    return res.json(
      apiResponse({
        success: true,
        message: "Rate list uploaded successfully. Waiting for admin approval.",
        data: shop,
      })
    );
  } catch (err) {
    console.error("Upload Rate List Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// 🔹 Get My Shops
export const getMyShops = async (req, res) => {
  try {
    const shops = await Shop.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.json(apiResponse({ success: true, data: shops }));
  } catch (err) {
    console.error("Get My Shops Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// 🔹 Get Active Shops (for website)
export const getActiveShops = async (req, res) => {
  try {
    const shops = await Shop.find({ status: "active", rateListStatus: "approved" })
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    return res.json(apiResponse({ success: true, data: shops }));
  } catch (err) {
    console.error("Get Active Shops Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};
