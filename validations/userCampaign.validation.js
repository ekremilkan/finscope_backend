const Joi = require("joi");
const { StatusCodes } = require("http-status-codes");

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

function validateCreate(req, res, next) {
  const schema = Joi.object({
    user_id: objectId.required(),
    campaign_id: objectId.required(),
    class: Joi.string().trim().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: true,
      message: error.details[0].message,
      code: StatusCodes.BAD_REQUEST,
    });
  }
  next();
}

function validateUpdateClass(req, res, next) {
  const paramsSchema = Joi.object({
    userId: objectId.required(),
    campaignId: objectId.required(),
  });
  const bodySchema = Joi.object({
    class: Joi.string().trim().required(),
  });

  const paramsResult = paramsSchema.validate(req.params);
  if (paramsResult.error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: true,
      message: paramsResult.error.details[0].message,
      code: StatusCodes.BAD_REQUEST,
    });
  }

  const bodyResult = bodySchema.validate(req.body);
  if (bodyResult.error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: true,
      message: bodyResult.error.details[0].message,
      code: StatusCodes.BAD_REQUEST,
    });
  }
  next();
}

function validateGetOne(req, res, next) {
  const schema = Joi.object({
    userId: objectId.required(),
    campaignId: objectId.required(),
  });

  const { error } = schema.validate(req.params);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: true,
      message: error.details[0].message,
      code: StatusCodes.BAD_REQUEST,
    });
  }
  next();
}

module.exports = {
  validateCreate,
  validateUpdateClass,
  validateGetOne,
};


