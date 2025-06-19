const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const config = require("./configs/index");
const db = require("./db/index");
const middlewares = require ("./middlewares/index")

const router = require("./routers/index");
const ROUTER_PREFIX = require("./consts/router.prefix.consts");

const app = express();

// Güvenlik middleware'leri
app.use(helmet({
  crossOriginEmbedderPolicy: false, // API için COEP'i devre dışı bırak
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL injection koruması
app.use(mongoSanitize({
  replaceWith: '_'
}));

// Global rate limiter
app.use(middlewares.rateLimiter.generalLimiter);

// Auth middleware
app.use(middlewares.authMiddleware);

app.get("/", (req, res) => res.send("API Çalışıyor..."));

app.use(`${config.appPrefix}/${ROUTER_PREFIX.USER}`, router.userRouter);

db.mongooseConnection.connectMongoDB().then(() => {
  app.listen(config.port, () => {
    console.log(`✅ Server ${config.port} portunda çalışıyor`);
    console.log(`🔗 API URL: http://localhost:${config.port}`);
    console.log(`🛡️  Güvenlik önlemleri aktif`);
    console.log(`🔒 Rate limiting: Aktif`);
    console.log(`🚫 NoSQL Injection koruması: Aktif`);
    console.log(`🛡️  Helmet güvenlik headers: Aktif`);
  });
});
