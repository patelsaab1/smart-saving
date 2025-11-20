
import ShoppingBill from "../models/ShoppingBill.js";
import VendorProfit from "../models/VendorProfit.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import AuditLog from "../models/AuditLog.js";
import apiResponse from "../utils/apiResponse.js";
import Admin from "../models/Admin.js";
import { updateWallet } from "../services/walletService.js";
import { sendSmartSavingMail } from "../services/emailService.js";


// User Upload Bill
export const uploadBill = async (req, res) => {
  try {
    const { shopId, billAmount } = req.body;

    if (!req.file) {
      return res.status(400).json(apiResponse({
        success: false,
        message: "Bill image is required!"
      }));
    }
    console.log(" req.file.path", req.file)

    // Validate shop
    const shop = await Shop.findById(shopId);
    if (!shop || shop.status !== "active") {
      return res.status(400).json(apiResponse({
        success: false,
        message: "Invalid or inactive shop"
      }));
    }


    // Create Bill Entry
    const bill = await ShoppingBill.create({
      user: req.user._id,
      shop: shopId,
      billAmount: Number(billAmount),
      billImage: req.file.path,
      status: "pending"
    });

    return res.json(apiResponse({
      success: true,
      message: "Bill uploaded successfully, pending admin approval",
      data: bill
    }));

  } catch (err) {
    console.error("Upload Bill Error:", err);
    return res.status(500).json(apiResponse({
      success: false,
      message: "Server error"
    }));
  }
};


export const getAllBillsAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const bills = await ShoppingBill.find(filter)
      .populate("user", "name phoneNumber")
      .populate("shop", "shopName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ShoppingBill.countDocuments(filter);

    return res.json(apiResponse({
      success: true,
      message: "Bills fetched successfully",
      data: { bills, total }
    }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};


export const approveBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { ProfitAmount } = req.body;

    const admin = await Admin.findById(req.user.id);
    const bill = await ShoppingBill.findById(billId).populate("user shop");

    // console.log("----", bill)
    if (!bill || bill.status !== "pending") {
      return res.status(400).json(apiResponse({ success: false, message: "Invalid or already processed bill" }));
    }

    const user = bill.user;
    const billAmount = bill.billAmount;
    const maxProfit = billAmount * 0.40;
    const vendorId = bill.shop.owner;
    const vendor = await User.findById(vendorId); // or Admin.findById(vendorId)


    if (ProfitAmount > maxProfit) {
      return res.status(405).json(apiResponse({
        success: false,
        message: `Profit amount cannot exceed 40% of bill amount. Maximum allowed is ₹${maxProfit.toFixed(2)}`
      }));
    }

    // Calculate Percentages
    const userCashback = ProfitAmount * 0.40;
    const referrerBonus = ProfitAmount * 0.20;
    let adminShare = ProfitAmount * 0.40;

    // ✅ USER CASHBACK → Wallet + Transaction
    await updateWallet({
      userId: user._id,
      amount: userCashback,
      action: "shopping_cashback",
      referenceId: bill._id,
      referenceModel: "ShoppingBill",
      description: `Up to 40% cashback on bill ₹${bill.billAmount}`
    });


    // ✅ Send mail to User (profit added)

    if (user.email && user.email.trim() !== "") {
      await sendSmartSavingMail(
        user.email,
        "💰 Cashback Added to Your SmartSaving Wallet",
        "Congratulations! Your Cashback is Credited 🎉",
        `प्रिय ${user.name},<br/><br/>
  आपके SmartSaving Wallet में <b>₹${userCashback.toFixed(2)}</b> का लाभ जोड़ दिया गया है।<br/>
  कृपया ऐप में जाकर अपना Wallet Balance देखें।<br/><br/>धन्यवाद 🙏`
      );
    } else {
      console.log("⚠️ No email found for user, skipping email sending");
    }


    // ✅ Vendor Pending Profit
    if (!bill.vendorProfitProcessed) {
      await VendorProfit.create({
        vendor: bill.shop.owner,
        bill: bill._id,
        amount: ProfitAmount,
        status: "pending",
      });
      bill.vendorProfitProcessed = true;
      // ✅ Send mail to Vendor


      if (vendor && vendor.email) {
        await sendSmartSavingMail(
          vendor.email,
          "बिल सफलतापूर्वक सत्यापित ✅",
          "SmartSaving बिल अनुमोदन सूचना",
          `
      नमस्कार ${vendor.name || "Vendor"} जी,<br/><br/>

      आपके स्टोर <b>${bill.shop.shopName}</b> पर हुई खरीदारी का बिल SmartSaving द्वारा सफलतापूर्वक सत्यापित कर दिया गया है।<br/><br/>

      बिल का विवरण:<br/>
      • बिल राशि: <b>₹${bill.billAmount}</b><br/>
      • SmartSaving के लिए देय राशि (Pending): <b>₹${ProfitAmount}</b><br/><br/>

      कृपया इस बकाया राशि को समय पर जमा करने में सहयोग प्रदान करें।<br/>
      आपके सहयोग से हम बेहतर सेवा प्रदान कर पाते हैं।<br/><br/>

      किसी भी सहायता या जानकारी के लिए संपर्क करें:<br/>
      📞 <b>6265861847</b><br/><br/>

      धन्यवाद,<br/>
      <b>SmartSaving Team</b> 🌱
    `
        );
      }

    }


    // ✅ FIRST SHOPPING CASHBACK (deducts admin share)
    if (!user.firstShoppingCashbackClaimed) {
      const firstCashback = user.planType === "A" ? 500 : 250;

      const actualFirstCashback = Math.min(adminShare, firstCashback); // Prevent negative admin
      if (actualFirstCashback > 0) {
        await updateWallet({
          userId: user._id,
          amount: actualFirstCashback,
          action: "first_shopping_cashback",
          referenceId: bill._id,
          referenceModel: "ShoppingBill",
          description: "First shopping cashback reward"
        });
      }

      adminShare -= actualFirstCashback;

      user.firstShoppingCashbackClaimed = true;
      bill.firstCashbackProcessed = true;
      await user.save();
    }

    // ✅ REFERRER BONUS → Only if plan A
    if (user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });
      if (referrer && referrer.planType === "A") {
        await updateWallet({
          userId: referrer._id,
          amount: referrerBonus,
          action: "referral_bonus",
          referenceId: bill._id,
          referenceModel: "ShoppingBill",
          description: `20% referral bonus on bill ₹${bill.billAmount}`
        });
      }
    }

    // ✅ ADMIN SHARE → Wallet Update
    if (adminShare > 0) {
      admin.wallet += adminShare;
      await admin.save();
    }

    // ✅ Final Bill Update
    bill.status = "approved";
    bill.cashbackAmount = userCashback;
    bill.approvedBy = admin._id;
    bill.approvedAt = new Date();
    await bill.save();

    return res.json(apiResponse({
      success: true,
      message: "Bill approved successfully",
      data: {
        userCashback,
        referrerBonus,
        adminShare,
        vendorProfit: ProfitAmount,

      }
    }));

  } catch (err) {
    console.error(err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};


// Admin Reject Bill
export const rejectBill = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await ShoppingBill.findById(billId);
    if (!bill || bill.status !== "pending") {
      return res.status(400).json(apiResponse({ success: false, message: `Bill already ${bill.status}` }));
    }

    bill.status = "rejected";
    bill.approvedBy = req.user._id;
    bill.approvedAt = new Date();
    await bill.save();

    await AuditLog.create({
      adminId: req.user._id,
      action: "reject_bill",
      details: { billId },
    });

    return res.json(apiResponse({ success: true, message: "Bill rejected", data: bill }));
  } catch (err) {
    console.error(err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// User My Bills
export const myBills = async (req, res) => {
  try {
    const bills = await ShoppingBill.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("shop", "shopName");

    return res.json(apiResponse({ success: true, data: bills }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// Vendor Bill Entries (Bills for their shops)
export const vendorBillEntries = async (req, res) => {
  try {
    // Find all shops owned by this vendor
    const shops = await Shop.find({ owner: req.user._id }).select("_id shopName");

    const shopIds = shops.map(s => s._id);

    // Fetch all bills for these shops
    const bills = await ShoppingBill.find({ shop: { $in: shopIds } })
      .populate({
        path: "user",
        select: "name email phone address", // ✅ Only include safe fields
      })
      .populate({
        path: "shop",
        select: "shopName category subcategory address contactNumber", // ✅ Exclude sensitive fields
      })
      .sort({ createdAt: -1 });

    return res.json(
      apiResponse({
        success: true,
        data: { shops, bills },
      })
    );
  } catch (err) {
    console.error("❌ vendorBillEntries error:", err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: "Server Error" }));
  }
};



// Vendor Owed to Admin
export const vendorOwedAmount = async (req, res) => {
  try {
    const owed = await VendorProfit.aggregate([
      { $match: { vendor: req.user._id, status: "pending" } },
      { $group: { _id: null, totalOwed: { $sum: "$amount" } } }
    ]);

    return res.json(apiResponse({
      success: true,
      data: { totalOwed: owed[0]?.totalOwed || 0 }
    }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

export const vendorPaymentHistory = async (req, res) => {
  try {
    const payments = await VendorProfit.find({ vendor: req.user._id, status: "paid" })
      .populate("bill", "billAmount")
      .sort({ paidAt: -1 });

    return res.json(apiResponse({ success: true, data: payments }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};


export const vendorPendingProfitDetails = async (req, res) => {
  try {
    const pendingProfits = await VendorProfit.find({
      vendor: req.user._id,
      status: "pending"
    })
      .populate("bill", "billAmount createdAt")
      .populate("bill.user", "name phoneNumber")
      .populate("bill.shop", "shopName")
      .sort({ createdAt: -1 });

    const totalPending = pendingProfits.reduce((sum, record) => sum + record.amount, 0);

    return res.json(apiResponse({
      success: true,
      message: "Vendor pending profit details",
      data: { totalPending, pendingProfits }
    }));

  } catch (err) {
    console.error(err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

export const vendorProfitHistory = async (req, res) => {
  try {
    const history = await VendorProfit.find({
      vendor: req.user._id,
      status: "paid"
    })
      .populate("paidBy", "name")
      .populate("bill", "billAmount createdAt")
      .sort({ paidAt: -1 });

    return res.json(apiResponse({
      success: true,
      message: "Vendor payment history",
      data: history
    }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};


// Admin Mark Vendor Paid
export const markVendorPaid = async (req, res) => {
  try {
    const { vendorId } = req.params;

    await VendorProfit.updateMany(
      { vendor: vendorId, status: "pending" },
      { $set: { status: "paid", paidAt: new Date(), paidBy: req.user._id } }
    );

    return res.json(apiResponse({ success: true, message: "Vendor payment marked as received" }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// export const getBillAnalytics = async (req, res) => {
//   try {
//     const vendorId = req.user._id;

//     // 1. All VendorProfit records (pending + paid)
//     const profitStats = await VendorProfit.aggregate([
//       { $match: { vendor: vendorId } },
//       {
//         $group: {
//           _id: "$status",
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     const pendingProfit = profitStats.find(p => p._id === "pending") || { totalAmount: 0, count: 0 };
//     const paidProfit    = profitStats.find(p => p._id === "paid")    || { totalAmount: 0, count: 0 };

//     // 2. Bill counts (by status) for the vendor's shops
//     const shops = await Shop.find({ owner: vendorId }).select("_id");
//     console.log("shop", shops)
//     const shopIds = shops.map(s => s._id);

//     // ---- 3. Vendor Total Shopping Summary ----
// const shoppingSummary = await ShoppingBill.aggregate([
//   { $match: { shop: { $in: shopIds }, status: "approved" } },

//   {
//     $group: {
//       _id: null,
//       totalShoppingAmount: { $sum: "$billAmount" },   // कितनी total खरीदारी आपकी shop पर हुई
//       totalCashbackGiven: { $sum: "$cashbackAmount" }, // total cashback generated from your shop
//       totalUsers: { $addToSet: "$user" }               // unique users
//     }
//   },
//   {
//     $project: {
//       _id: 0,
//       totalShoppingAmount: 1,
//       totalCashbackGiven: 1,
//       totalUsersCount: { $size: "$totalUsers" }
//     }
//   }
// ]);

// // Default if no bills exist
// const shopSummary = shoppingSummary[0] || {
//   totalShoppingAmount: 0,
//   totalCashbackGiven: 0,
//   totalUsersCount: 0
// };

//     console.log("billStats", billStats)

//     const pendingBills  = billStats.find(b => b._id === "pending")  || { count: 0, totalBill: 0, totalCashback: 0 };
//     const approvedBills = billStats.find(b => b._id === "approved") || { count: 0, totalBill: 0, totalCashback: 0 };
//     const rejectedBills = billStats.find(b => b._id === "rejected") || { count: 0, totalBill: 0, totalCashback: 0 };

//     const totalBills = pendingBills.count + approvedBills.count + rejectedBills.count;
//     const totalCashbackGenerated = approvedBills.totalCashback;

//     // 3. Final payload
//    const data = {
//   // Vendor profits
//   totalProfit: totalCashbackGenerated,
//   owedToAdmin: pendingProfit.totalAmount,
//   paidToVendor: paidProfit.totalAmount,

//   totalBills,
//   pendingBills: pendingBills.count,
//   approvedBills: approvedBills.count,
//   rejectedBills: rejectedBills.count,

//   // New: Your shop's total customer shopping analytics
//   totalShoppingAmount: shopSummary.totalShoppingAmount,  // आपकी दुकान पर users ने कुल कितना shopping किया
//   totalCashbackGiven: shopSummary.totalCashbackGiven,    // आपकी दुकान पर कितना cashback दिया गया
//   totalUniqueCustomers: shopSummary.totalUsersCount,     // कितने users ने आपकी shop से shopping की

//   pendingProfitDetails: pendingProfit,
//   paidProfitDetails: paidProfit,
// };

//     return res.json(
//       apiResponse({
//         success: true,
//         message: "Vendor dashboard analytics",
//         data,
//       })
//     );
//   } catch (err) {
//     console.error("vendorDashboardAnalytics error:", err);
//     return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
//   }
// };


export const getBillAnalytics = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const profitStats = await VendorProfit.aggregate([
      { $match: { vendor: vendorId } },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingProfit = profitStats.find(p => p._id === "pending") || {
      totalAmount: 0,
      count: 0,
    };

    const paidProfit = profitStats.find(p => p._id === "paid") || {
      totalAmount: 0,
      count: 0,
    };

   
    const shops = await Shop.find({ owner: vendorId }).select("_id");
    const shopIds = shops.map(s => s._id);

    const billStats = await ShoppingBill.aggregate([
      { $match: { shop: { $in: shopIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalBill: { $sum: "$billAmount" },
          totalCashback: { $sum: "$cashbackAmount" },
        },
      },
    ]);

    const pendingBills =
      billStats.find(b => b._id === "pending") || {
        count: 0,
        totalBill: 0,
        totalCashback: 0,
      };

    const approvedBills =
      billStats.find(b => b._id === "approved") || {
        count: 0,
        totalBill: 0,
        totalCashback: 0,
      };

    const rejectedBills =
      billStats.find(b => b._id === "rejected") || {
        count: 0,
        totalBill: 0,
        totalCashback: 0,
      };

    const totalBills =
      pendingBills.count +
      approvedBills.count +
      rejectedBills.count;

    const totalCashbackGenerated = approvedBills.totalCashback;
    const shoppingSummary = await ShoppingBill.aggregate([
      {
        $match: {
          shop: { $in: shopIds },
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          totalShoppingAmount: { $sum: "$billAmount" },
          totalCashbackGiven: { $sum: "$cashbackAmount" },
          totalUsers: { $addToSet: "$user" },
        },
      },
      {
        $project: {
          _id: 0,
          totalShoppingAmount: 1,
          totalCashbackGiven: 1,
          totalUsersCount: { $size: "$totalUsers" },
        },
      },
    ]);

    const shopSummary = shoppingSummary[0] || {
      totalShoppingAmount: 0,
      totalCashbackGiven: 0,
      totalUsersCount: 0,
    };

    // ---------------------------
    // 5. FINAL RESPONSE
    // ---------------------------
    const data = {
      // Cashback analytics
      totalProfit: totalCashbackGenerated,
      owedToAdmin: pendingProfit.totalAmount,
      paidToVendor: paidProfit.totalAmount,

      // Bills summary
      totalBills,
      pendingBills: pendingBills.count,
      approvedBills: approvedBills.count,
      rejectedBills: rejectedBills.count,

      // NEW: Shopping done by all users in vendor’s shops
      totalShoppingAmount: shopSummary.totalShoppingAmount,
      totalCashbackGiven: shopSummary.totalCashbackGiven,
      totalUniqueCustomers: shopSummary.totalUsersCount,

      // Raw profit data
      pendingProfitDetails: pendingProfit,
      paidProfitDetails: paidProfit,
    };

    return res.json(
      apiResponse({
        success: true,
        message: "Vendor dashboard analytics",
        data,
      })
    );
  } catch (err) {
    console.error("vendorDashboardAnalytics error:", err);
    return res
      .status(500)
      .json(
        apiResponse({
          success: false,
          message: "Server error",
        })
      );
  }
};
