const Campaign = require("../models/campaign.model");
const { StatusCodes } = require("http-status-codes");

exports.create = async (req) => {
  const { name, description } = req.body;
  const customerId = req.user._id;

  const campaign = new Campaign({ name, description, customerId });
  await campaign.save();

  return campaign;
};

exports.getAll = async () => {
  const campaigns = await Campaign.find().populate("customerId", "name email");
  return campaigns;
};

exports.getById = async (req) => {
  const { id } = req.params;
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    const err = new Error("Kampanya bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  return campaign;
};

exports.getByCustomer = async (req) => {
  const customerId = req.user._id;
  const campaigns = await Campaign.find({ customerId });
  return campaigns;
};

exports.remove = async (req) => {
  const { id } = req.params;
  const customerId = req.user._id;

  const campaign = await Campaign.findOne({ _id: id, customerId });

  if (!campaign) {
    const err = new Error("Bu kampanyayı silme yetkiniz yok veya kampanya bulunamadı.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  await Campaign.findByIdAndDelete(id);
  return { message: "Kampanya silindi." };
};