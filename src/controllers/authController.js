import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import EmailVerification from '../models/email.js';
import { sendEmail } from '../services/emailService.js';
import apiResponse from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import Wallet from '../models/Wallet.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const register = async (req, res) => {
  try {
    const { name, email, phone, role, referredBy, shopName, category, address, password } = req.body;
    console.log(req.body)
    // Validate required fields
    if (!name || !email || !phone || !role || !password) {
      return res
        .status(400)
        .json(apiResponse({ success: false, message: 'Missing required fields' }));
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json(apiResponse({ success: false, message: 'User already exists' }));
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Send OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await EmailVerification.deleteMany({ email });
    await EmailVerification.create({ email, otp, expiresAt });
    await sendEmail(email, 'Your SmartSaving OTP', `Your OTP is ${otp}`);
    // Create user
    const user = new User({
      name,
      email,
      phone,
      role,
      referredBy,
      password: password,
      isActive: false,
    });

    await user.save();
    await Wallet.create({ user: user._id, balance: 0 });
    // Vendor-specific registration
    if (role === 'vendor') {
      if (!shopName || !category || !address) {
        return res
          .status(400)
          .json(apiResponse({ success: false, message: 'Vendor details required' }));
      }
      const vendor = new Vendor({
        user: user._id,
        shopName,
        category,
        address,
      });
      await vendor.save();
    }

    return res.status(201).json(
      apiResponse({
        success: true,
        message: 'Registration successful. Please verify your email with OTP.',
        data: { userId: user._id, role: user.role, email: user.email, otp: otp },
      })
    );
  } catch (err) {
    console.error('❌ Register Error:', err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: 'Server error' }));
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json(apiResponse({ success: false, message: 'Email is required' }));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json(apiResponse({ success: false, message: 'User not found' }));
    }

    // Generate and save OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await EmailVerification.deleteMany({ email });
    await EmailVerification.create({ email, otp, expiresAt });
    await sendEmail(email, 'Your SmartSaving OTP', `Your OTP is ${otp}`);

    return res
      .status(200)
      .json(apiResponse({ success: true, data: otp, message: `OTP ${otp} sent successfully` }));
  } catch (err) {
    console.error('❌ Send OTP Error:', err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: 'Server error' }));
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: 'Email and OTP are required',
        })
      );
    }

    // Find latest unverified OTP for this email
    const record = await EmailVerification.findOne({
      email,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: 'Invalid or expired OTP',
        })
      );
    }

    if (record.otp !== otp) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: 'Invalid OTP',
        })
      );
    }

    // Mark OTP as verified
    record.verified = true;
    await record.save();

    // Activate user
    const user = await User.findOneAndUpdate(
      { email },
      { isActive: true, activatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json(
        apiResponse({
          success: false,
          message: 'User not found',
        })
      );
    }

    const token = generateToken(user._id, user.role);

    return res.json(
      apiResponse({
        success: true,
        message: 'Email verified successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          },
        },
      })
    );
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json(
      apiResponse({
        success: false,
        message: 'Server error',
      })
    );
  }
};

export const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json(apiResponse({ success: false, message: 'Email and password are required' }));
    }

    const user = await User.findOne({ email }).select('+password');
    console.log(user)
    if (!user) {
      return res
        .status(404)
        .json(apiResponse({ success: false, message: 'User not found' }));
    }

    // if (!user.isActive) {
    //   return res
    //     .status(403)
    //     .json(apiResponse({ success: false, message: 'Account not activated. Please verify your email.' }));
    // }

    if (user.password !== password) {
      return res
        .status(400)
        .json(apiResponse({ success: false, message: "Invalid credentials" }));
    }
    const token = generateToken(user._id, user.role);

    return res.json(
      apiResponse({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          },
        },
      })
    );
  } catch (err) {
    console.error('❌ Login Error:', err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: 'Server error' }));
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
    if (!user) {
      return res
        .status(404)
        .json(apiResponse({ success: false, message: 'User not found' }));
    }

    let vendorData = {};
    if (user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: user._id });
      if (vendor) {
        vendorData = {
          shopName: vendor.shopName,
          category: vendor.category,
          address: vendor.address,
        };
      }
    }

    return res.json(
      apiResponse({
        success: true,
        message: 'Profile fetched',
        data: { ...user.toObject(), ...vendorData },
      })
    );
  } catch (err) {
    console.error('❌ Get Profile Error:', err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: 'Server error' }));
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, shopName, category, subcategory, gstNumber } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    if (req.file && req.file.path) {
      updateData.profilePic = req.file.path;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
      .select('-password -otp -otpExpiry');
    if (!user) {
      return res
        .status(404)
        .json(apiResponse({ success: false, message: 'User not found' }));
    }

    if (user.role === 'vendor') {
      const vendorUpdateData = {};
      if (shopName) vendorUpdateData.shopName = shopName;
      if (category) vendorUpdateData.category = category;
      if (subcategory) vendorUpdateData.subcategory = subcategory;
      if (gstNumber) vendorUpdateData.gstNumber = gstNumber;
      if (Object.keys(vendorUpdateData).length > 0) {
        await Vendor.findOneAndUpdate({ user: userId }, vendorUpdateData, { new: true, runValidators: true });
      }
    }

    return res.json(
      apiResponse({
        success: true,
        message: 'Profile updated',
        data: user,
      })
    );
  } catch (err) {
    console.error('❌ Update Profile Error:', err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: 'Server error' }));
  }
};