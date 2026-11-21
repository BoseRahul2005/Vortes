const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const { clerkMiddleware } = require('@clerk/express');
const connectDB = require("./src/config/db.js");
const connectChromaDb = require("./src/config/chroma.js");

const app = express();
connectDB();
connectChromaDb();

const repositoryRoutes = require('./src/routes/repositoryRoutes.js');
const ragRoutes = require('./src/routes/ragRoutes.js');

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

// CORS configuration supporting credentials (cookies / headers)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Blocked by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    verify: (req, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use('/api/repositories', repositoryRoutes);
app.use('/repositories', repositoryRoutes);
app.use('/api/rag', ragRoutes);
app.use('/rag', ragRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});
