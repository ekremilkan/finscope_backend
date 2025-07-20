const { StatusCodes } = require("http-status-codes");

// Belirli rollere sahip kullanıcıların erişimini kontrol eder
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      // Kullanıcı giriş yapmış mı kontrol et
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: true,
          success: false,
          message: "Giriş yapmanız gerekiyor",
          code: StatusCodes.UNAUTHORIZED
        });
      }

      // Role kontrolü
      if (!roles.includes(req.user.role)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: true,
          success: false,
          message: "Bu işlem için yetkiniz bulunmuyor",
          code: StatusCodes.FORBIDDEN
        });
      }

      next();
    } catch (error) {
      console.error('Role Middleware Error:', error.message);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: true,
        success: false,
        message: "Yetkilendirme hatası",
        code: StatusCodes.INTERNAL_SERVER_ERROR
      });
    }
  };
};

// Sadece admin erişimi
const requireAdmin = requireRole(['admin']);

// Sadece customer erişimi
const requireCustomer = requireRole(['customer']);

// Admin veya customer erişimi (kampanya oluşturma için)
const requireAdminOrCustomer = requireRole(['admin', 'customer']);

// Admin veya user erişimi
const requireAdminOrUser = requireRole(['admin', 'user']);

// Tüm roller erişebilir (giriş yapmış kullanıcılar)
const requireAuth = requireRole(['admin', 'customer', 'user']);

module.exports = {
  requireRole,
  requireAdmin,
  requireCustomer,
  requireAdminOrCustomer,
  requireAdminOrUser,
  requireAuth
}; 