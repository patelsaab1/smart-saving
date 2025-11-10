// src/controllers/contactController.js
import Contact from "../models/Contact.js";
import apiResponse from "../utils/apiResponse.js";

export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const userId = req.user?._id || null;

    const contact = await Contact.create({
      name, email, phone, message, user: userId
    });

    return res.json(apiResponse({
      success: true,
      message: "Message sent! Our team will contact you within 2 hours",
      data: contact
    }));
  } catch (err) {
    console.error("Contact Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });
    return res.json(apiResponse({ data: contacts }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    return res.json(apiResponse({ message: "Status updated", data: contact }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Update failed" }));
  }
};