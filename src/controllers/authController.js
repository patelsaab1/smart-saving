
import User from '../models/User.js';
import EmailVerification from '../models/email.js';
import { sendEmail } from '../services/emailService.js';
import apiResponse from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import Wallet from '../models/Wallet.js';
import Vendor from '../models/Vendor.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const register = async (req, res) => {
  try {
    const { name, email, phone, role, referredBy, shopName, category, address, password } = req.body;
    // console.log(req.body)
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

    let referrer = null;
    if (referredBy) {
      referrer = await User.findOne({ referralCode: referredBy });
      if (!referrer) {
        return res.status(400).json(apiResponse({ success: false, message: "Invalid referral code" }));
      }
    }

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

export const registerVendor = async (req, res) => {
  try {
    const { name, email, phone, password, referredBy, shopName, category, subcategory, address, gstNumber } = req.body;

    if (!name || !email || !phone || !password || !shopName || !category || !address) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Vendor already registered with this email" });
    }

    // OTP logic
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await EmailVerification.deleteMany({ email });
    await EmailVerification.create({ email, otp, expiresAt });
    await sendEmail(email, "SmartSaving Vendor Verification OTP", `Your OTP is: ${otp}`);

    // Create User
    const user = new User({
      name,
      email,
      phone,
      password,
      role: "vendor",
      referredBy,
      address,   // ✅ Save address properly
      isActive: true
    });

    await user.save();

    await Wallet.create({ user: user._id, balance: 0 });

    // Create Vendor
    await Vendor.create({
      user: user._id,
      shopName,
      shopCategory: category,   // ✅ map correctly
      shopSubCategory: subcategory, // ✅ extra optional field
      shopAddress: `${address.street}, ${address.city}, ${address.state}, ${address.country} - ${address.zip}`, // ✅ make proper full string
      gstNumber
    });

    return res.status(201).json({
      success: true,
      message: "Vendor registered successfully.",
      data: {
        userId: user._id,
        email: user.email,
        otp   // remove in production
      }
    });

  } catch (err) {
    console.log("Vendor Register Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
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
      { activatedAt: new Date() },
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
    // console.log(user)
    if (!user) {
      return res
        .status(404)
        .json(apiResponse({ success: false, message: 'User not found' }));
    }

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
    // console.log("user infor ", user)
    if (!user) {
      return res
        .status(404)
        .json(apiResponse({ success: false, message: 'User not found' }));
    }

    // for (const user of await User.find({ referralCode: { $exists: false } })) {
    //   user.referralCode = generateReferralCode();
    //   await user.save();
    // }


    console.log(user.referralCode || null)
    let vendorData = null;
    if (user.role == 'vendor') {
      const vendor = await Vendor.findOne({ user: user._id });
      // console.log("--------------------------",vendor)

      if (vendor) {
        vendorData = {
          shopName: vendor.shopName,
          shopCategory: vendor.shopCategory,
          shopSubCategory: vendor.shopSubCategory || null,
          shopAddress: vendor.shopAddress,
          gstNumber: vendor.gstNumber || null,
        };

      }
    }

    return res.json(
      apiResponse({
        success: true,
        message: 'Profile fetched',
        data: {
          ...user.toObject(),
          ...vendorData,
          referralCode: user.planType == "A" ? user.referralCode : null,
          profilePic: user.profilePic || "https://ui-avatars.com/api/?background=random&name=" + user.name
        }

      })
    );
  } catch (err) {
    console.error('❌ Get Profile Error:', err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: 'Server error' }));
  }
};


// ------------------- USER / VENDOR PROFILE UPDATE -------------------
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, gender, dob } = req.body;

    const updateUserData = {};
    if (name) updateUserData.name = name;
    if (phone) updateUserData.phone = phone;
    if (gender) updateUserData.gender = gender;
    if (dob) updateUserData.dob = dob;

    // ✅ Parse address JSON safely
    if (address) {
      try {
        updateUserData.address =
          typeof address === "string" ? JSON.parse(address) : address;
      } catch {
        updateUserData.address = {};
      }
    }
    console.log("--------", req.file)
    // ✅ Profile Picture Upload
    if (req.file && req.file.fieldname === "profilePic") {
      updateUserData.profilePic = req.file.path;
    }

    // ✅ Update user
    let user = await User.findByIdAndUpdate(userId, updateUserData, {
      new: true,
      runValidators: true,
    }).select("-password -otp -otpExpiry");

    if (!user)
      return res
        .status(404)
        .json(apiResponse({ success: false, message: "User not found" }));

    return res.json(
      apiResponse({
        success: true,
        message: "Profile updated successfully ✅",
        data: user,
      })
    );
  } catch (err) {
    console.error("❌ Update Profile Error:", err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: "Server error" }));
  }
};

// ------------------- BECOME VENDOR -------------------
export const becomeVendor = async (req, res) => {
  try {
    const userId = req.user.id;
    let { shopName, shopCategory, shopAddress, gstNumber } = req.body;

    // ✅ KYC Validation
    const hasKyc =
      req.files?.pan?.[0] ||
      req.files?.gst?.[0] ||
      req.files?.license?.[0];

    if (!hasKyc) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message:
            "At least one KYC document (PAN / GST / License) is required.",
        })
      );
    }

    // ✅ Update user role & activate
    let user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json(apiResponse({ success: false, message: "User not found" }));

    user.role = "vendor";
    user.isActive = true;
    user.activatedAt = new Date();
    await user.save();

    // ✅ Vendor section
    let vendor = await Vendor.findOne({ user: userId });
    if (!vendor) {
      vendor = new Vendor({
        user: userId,
        shopName,
        shopCategory,
        shopAddress,
        gstNumber,
      });
    } else {
      vendor.shopName = shopName;
      vendor.shopCategory = shopCategory;
      vendor.shopAddress = shopAddress;
      vendor.gstNumber = gstNumber;
    }

    // ✅ Upload KYC
    if (req.files?.pan?.[0]) vendor.kycDocuments.pan = req.files.pan[0].path;
    if (req.files?.gst?.[0]) vendor.kycDocuments.gst = req.files.gst[0].path;
    if (req.files?.license?.[0])
      vendor.kycDocuments.license = req.files.license[0].path;

    await vendor.save();

    return res.json(
      apiResponse({
        success: true,
        message: "Vendor profile created successfully ✅",
        data: { user, vendor },
      })
    );
  } catch (err) {
    console.error("❌ Become Vendor Error:", err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: "Server error" }));
  }
};
