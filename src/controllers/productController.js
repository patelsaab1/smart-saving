import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import xlsx from "xlsx";
import cloudinary from "cloudinary";
import apiResponse from "../utils/apiResponse.js";

// Add Product
export const addProduct = async (req, res) => {
  try {
    const { shopId, name, price, discountPercent } = req.body;
    const shop = await Shop.findById(shopId);
    if (!shop || shop.owner.toString() !== req.user.id || shop.status !== "active") return res.status(403).json(apiResponse({ success: false, message: "Not authorized or shop not active" }));

    const product = await Product.create({ shop: shopId, name, price, discountPercent, status: "pending", lastUpdatedByVendor: new Date() });
    return res.json(apiResponse({ message: "Product submitted for approval", data: product }));
  } catch (err) {
    console.error(err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// Bulk Upload
export const bulkUploadProducts = async (req, res) => {
  try {
    const { shopId } = req.body;
    if (!req.file) return res.status(400).json(apiResponse({ success: false, message: "No file uploaded" }));

    const shop = await Shop.findById(shopId);
    if (!shop || shop.owner.toString() !== req.user.id) return res.status(403).json(apiResponse({ success: false, message: "Not authorized" }));

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const products = sheetData.map(row => ({
      shop: shopId,
      name: row.ProductName,
      price: row.Price,
      discountPercent: row.DiscountPercent,
      status: "pending",
      lastUpdatedByVendor: new Date(),
    }));

    await Product.insertMany(products);
    return res.json(apiResponse({ message: "Products uploaded for approval", data: products.length }));
  } catch (err) {
    console.error(err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};
