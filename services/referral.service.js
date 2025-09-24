const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");

/**
 * Kullanıcı profilinde referral kodu girer:
 * - Kod formatını doğrular (A–F, 0–9; 6-12 uzunluk)
 * - Kod sahibini bulur
 * - Self-referral engellenir
 * - Kullanıcı daha önce kod bağlamışsa engellenir
 * - Transaction içinde:
 *    me.invitedBy / invitedAt set edilir
 *    inviter.invitees array'ine me eklenir (addToSet)
 */

exports.claimReferralCode = async (req) => {
  try {
    const meId =
      req.user?._id || req.user?.id || req.user.userId || req.auth?.id || null;
    if (!meId) {
      const err = new Error("Kimlik doğrulaması yapılmamış.");
      err.statusCode = StatusCodes.UNAUTHORIZED;
      throw err;
    }

    const { code } = req.body;
    if (!code) {
      const err = new Error("Referral kodu zorunlu.");
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }
    const normalized = String(code).trim().toUpperCase();
    // Bizim ürettiğimiz kodlar ObjectId hex'inin bir dilimi, yani HEX formatında
    if (!/^[A-F0-9]{6,12}$/.test(normalized)) {
      const err = new Error(
        "Geçersiz referral kodu formatı. (A-F, 0-9; 6-12 karakter)"
      );
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }
    // Davet eden kullanıcıyı bul
    const inviter = await User.findOne({ referralCode: normalized }).select(
      "_id name referralCode"
    );
    if (!inviter) {
      const err = new Error("Geçersiz referral kodu.");
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }
    // Kendini davet edemezsin
    if (inviter._id.toString() === String(meId)) {
      throw new Error("You cannot refer yourself", StatusCodes.BAD_REQUEST);
    }
    // Zaten bağlanmış mı?
    const me = await User.findById(meId).select("_id invitedBy invitedAt");
    if (!me) {
      const err = new Error("Kullanıcı bulunamadı.");
      err.statusCode = StatusCodes.NOT_FOUND;
      throw err;
    }
    if (me.invitedBy) {
      const err = new Error("Zaten bir referral kodu ile bağlanmışsınız.");
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }
    //Atomik güncelleme
    const session = await User.startSession();
    session.startTransaction();
    try {
      me.invitedBy = inviter._id;
      me.invitedAt = new Date();
      await me.save({ session });

      await User.updateOne(
        { _id: inviter._id },
        { $addToSet: { invitees: me._id } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }

    return {
      message: `Referral code '${inviter.referralCode}' successfully claimed. Inviter: ${inviter.name}`,
      invitedBy: inviter._id,
      invitedByName: inviter.name,
      invitedAt: me.invitedAt,
    };
  } catch (error) {
    throw new Error("Referral kodu işlenirken hata oluştu: " + error.message);
  }
};

/** Profilde referral bilgilerini getir */
exports.getReferralInfo = async (req) => {

  const meId = req.user.userId;

  if (!meId)
    throw new Error("Kimlik doğrulaması yapılmamış.", StatusCodes.UNAUTHORIZED);

  const me = await User.findById(meId)
    .select("name email referralCode invitedBy invitedAt")
    .populate({ path: "invitedBy", select: "name referralCode _id" });

  if (!me) throw new Error("Kullanıcı bulunamadı.", StatusCodes.NOT_FOUND);

  const referralLink = `https://finscope.app/register?ref=${me.referralCode}`;

  const invitees = await User.find({ invitedBy: me._id })
    .select("name email referralCode createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return {
    my: {
      id: me._id,
      name: me.name,
      referralCode: me.referralCode,
      referralLink, // ✅ paylaşılabilir link
    },
    invitedBy: me.invitedBy
      ? {
          id: me.invitedBy._id,
          name: me.invitedBy.name,
          referralCode: me.invitedBy.referralCode, // ✅ isteyen bilgi
          invitedAt: me.invitedAt,
        }
      : null,
    invitees: invitees.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      referralCode: u.referralCode,
      joinedAt: u.createdAt,
    })),
  };
};
