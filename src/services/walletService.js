
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";


export const getOrCreateWallet = async (userId, session = null) => {
  let wallet = await Wallet.findOne({ user: userId }).session(session);

  if (!wallet) {
    wallet = await Wallet.create([{ user: userId, balance: 0 }], { session });
    wallet = wallet[0];
  }

  return wallet;
};

export const updateWallet = async ({
  userId,
  amount,
  action,
  referenceId,
  referenceModel = "Payment",
  description
}, session = null) => {

  const wallet = await getOrCreateWallet(userId, session); // ✅ safe

  const type = amount >= 0 ? "CREDIT" : "DEBIT";

  wallet.balance += amount;
  await wallet.save({ session });

  // ✅ Log Transaction
  await WalletTransaction.create([{
    user: userId,
    amount,
    type,
    action,
     balanceAfter: wallet.balance,
    referenceId,
    referenceModel,
    description,
    status: "completed"
  }], { session });

  return wallet;
};


