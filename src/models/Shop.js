import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shopName: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  subcategory: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: "India" },
    zip: String
  },
  contactNumber: { type: String, required: true },
  documents: {
    gstNumber: String,
    licenseDoc: String,
    rentAgreement: { type: String, required: true },
  },
  defaultDiscountRate: { type: Number, min: 1, max: 40, default: 10 },
  
  // Rate List Uploads
  rateListFile: String,           
  rateListExcel: String,          
  rateListStatus: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },

  status: { 
    type: String, 
    enum: ["pending", "active", "inactive", "blocked"], 
    default: "pending" 
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: Date,
}, { timestamps: true });

export default mongoose.model("Shop", shopSchema);