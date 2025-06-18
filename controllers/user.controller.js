const { StatusCodes } = require("http-status-codes");
const userService = require("../services/index");
const baseResponse = require("../dto/baseresponse.dto");

exports.register = async (req, res) => {
  try {
    const data = await userService.user.register(req);
    res
      .status(StatusCodes.CREATED)
      .json({
        ...baseResponse,
        data,
        message: "Kullanıcı başarıyla oluşturuldu",
        code: StatusCodes.CREATED,
      });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({
        ...baseResponse,
        success: false,
        error: true,
        message: error.message,
        code: error.statusCode || 500,
      });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await userService.user.login(req);
    res
      .status(StatusCodes.OK)
      .json({
        ...baseResponse,
        data,
        message: "Giriş başarılı",
        code: StatusCodes.OK,
      });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({
        ...baseResponse,
        success: false,
        error: true,
        message: error.message,
        code: error.statusCode || 500,
      });
  }
};
