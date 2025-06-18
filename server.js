const express = require("express");
const cors = require("cors");
const config = require("./configs/index");
const db = require("./db/index");

const router = require("./routers/index");
const ROUTER_PREFIX = require("./consts/router.prefix.consts");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API Çalışıyor..."));

app.use(`${config.appPrefix}/${ROUTER_PREFIX.USER}`, router.userRouter);

db.mongooseConnection.connectMongoDB().then(() => {
  app.listen(config.port, () => {
    console.log(`✅ Server ${config.port} portunda çalışıyor`);
    console.log(`🔗 API URL: http://localhost:${config.port}`);
  });
});
