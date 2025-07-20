const Campaign = require("../models/campaign.model");
const { StatusCodes } = require("http-status-codes");

exports.create = async (req) => {
  const { 
    title, 
    description, 
    reward, 
    maxParticipants, 
    category, 
    difficulty, 
    startDate, 
    endDate, 
    questions, 
    tags 
  } = req.body;
  
  const customerId = req.user._id;

  const campaign = new Campaign({ 
    title, 
    description, 
    reward, 
    maxParticipants, 
    category, 
    difficulty, 
    startDate, 
    endDate, 
    questions, 
    tags,
    customerId 
  });
  
  await campaign.save();
  return campaign;
};

exports.getAll = async () => {
  const campaigns = await Campaign.find()
    .populate("customerId", "name email")
    .sort({ createdAt: -1 });
  return campaigns;
};

exports.getById = async (req) => {
  const { id } = req.params;
  const campaign = await Campaign.findById(id)
    .populate("customerId", "name email");

  if (!campaign) {
    const err = new Error("Kampanya bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  return campaign;
};

exports.update = async (req) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const userRole = req.user.role;
  
  // Admin ise tüm kampanyaları güncelleyebilir, değilse sadece kendi kampanyasını
  let campaign;
  if (userRole === 'admin') {
    campaign = await Campaign.findById(id);
  } else {
    campaign = await Campaign.findOne({ _id: id, customerId });
  }
  
  if (!campaign) {
    const err = new Error("Bu kampanyayı güncelleme yetkiniz yok veya kampanya bulunamadı.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  const updatedCampaign = await Campaign.findByIdAndUpdate(
    id, 
    req.body, 
    { new: true, runValidators: true }
  ).populate("customerId", "name email");
  
  return updatedCampaign;
};

exports.getByCustomer = async (req) => {
  const customerId = req.user._id;
  const campaigns = await Campaign.find({ customerId })
    .populate("customerId", "name email")
    .sort({ createdAt: -1 });
  return campaigns;
};

exports.remove = async (req) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const userRole = req.user.role;

  // Admin ise tüm kampanyaları silebilir, değilse sadece kendi kampanyasını
  let campaign;
  if (userRole === 'admin') {
    campaign = await Campaign.findById(id);
  } else {
    campaign = await Campaign.findOne({ _id: id, customerId });
  }

  if (!campaign) {
    const err = new Error("Bu kampanyayı silme yetkiniz yok veya kampanya bulunamadı.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  await Campaign.findByIdAndDelete(id);
  return { message: "Kampanya silindi." };
};

// Kampanya durumunu güncelle (cron job için)
exports.updateExpiredCampaigns = async () => {
  const now = new Date();
  const result = await Campaign.updateMany(
    { 
      endDate: { $lt: now },
      status: { $ne: 'expired' }
    },
    { 
      status: 'expired',
      isActive: false
    }
  );
  return result;
};