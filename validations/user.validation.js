const Joi = require("joi");

// Kullanıcı kayıt validation şeması
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .pattern(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .required()
    .messages({
      "string.base": "İsim metin olmalıdır",
      "string.empty": "İsim boş olamaz",
      "string.min": "İsim en az 2 karakter olmalıdır",
      "string.max": "İsim en fazla 50 karakter olmalıdır",
      "string.pattern.base": "İsim sadece harf ve boşluk içerebilir",
      "any.required": "İsim zorunludur",
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      "string.email": "Geçerli bir e-posta adresi giriniz",
      "string.empty": "E-posta boş olamaz",
      "any.required": "E-posta zorunludur",
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      "string.min": "Şifre en az 8 karakter olmalıdır",
      "string.max": "Şifre en fazla 128 karakter olmalıdır",
      "string.pattern.base":
        "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (@$!%*?&) içermelidir",
      "string.empty": "Şifre boş olamaz",
      "any.required": "Şifre zorunludur",
    }),
});

// Kullanıcı giriş validation şeması
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      "string.email": "Geçerli bir e-posta adresi giriniz",
      "string.empty": "E-posta boş olamaz",
      "any.required": "E-posta zorunludur",
    }),

  password: Joi.string().min(1).required().messages({
    "string.empty": "Şifre boş olamaz",
    "any.required": "Şifre zorunludur",
  }),
});

// Validation middleware
const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      error: true,
      message: "Validation hatası",
      errors: errors,
      code: 400,
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      error: true,
      message: "Validation hatası",
      errors: errors,
      code: 400,
    });
  }
  next();
};

const validateVerifyLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Lütfen geçerli bir e-posta adresi girin.",
      "any.required": "E-posta alanı zorunludur.",
    }),
    verificationCode: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        "string.length": "Doğrulama kodu 6 haneli olmalıdır.",
        "string.pattern.base": "Doğrulama kodu sadece rakamlardan oluşmalıdır.",
        "any.required": "Doğrulama kodu zorunludur.",
      }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};

const validateForgotPassword = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        "string.email": "Geçerli bir e-posta adresi giriniz",
        "any.required": "E-posta zorunludur",
      }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};

const validateVerifyResetCode = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        "string.email": "Lütfen geçerli bir e-posta adresi girin.",
        "any.required": "E-posta alanı zorunludur.",
      }),
    code: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        "string.length": "Kod 6 haneli olmalıdır.",
        "string.pattern.base": "Kod sadece rakamlardan oluşmalıdır.",
        "any.required": "Kod zorunludur.",
      }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};

const validateResetPassword = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        "string.email": "Lütfen geçerli bir e-posta adresi girin.",
        "any.required": "E-posta alanı zorunludur.",
      }),
    code: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        "string.length": "Kod 6 haneli olmalıdır.",
        "string.pattern.base": "Kod sadece rakamlardan oluşmalıdır.",
        "any.required": "Kod zorunludur.",
      }),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        "string.min": "Şifre en az 8 karakter olmalıdır",
        "string.max": "Şifre en fazla 128 karakter olmalıdır",
        "string.pattern.base":
          "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir",
        "any.required": "Yeni şifre zorunludur.",
      }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};


module.exports = {
  registerSchema,
  loginSchema,
  validateRegister,
  validateLogin,
  validateVerifyLogin,
  validateForgotPassword,
  validateVerifyResetCode,
  validateResetPassword,
};
