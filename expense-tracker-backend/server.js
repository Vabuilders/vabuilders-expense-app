const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// --- MIDDLEWARE ---

// ✅ CORS FIX: Place this at the top, before routes
const allowedOrigins = [
  'https://app.vabuilders.in',       // production frontend
  'http://localhost:3000'            // local dev frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Explicitly allow preflight
app.options('*', cors());

app.use(express.json());

// --- DATABASE CONNECTION ---
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

// --- DEFINE ROUTERS ---
const projectsRouter = require('./routes/projects');
const expensesRouter = require('./routes/expenses');
const paymentsRouter = require('./routes/payments');
const profileRouter = require('./routes/profile');

// --- CLERK AUTHENTICATION MIDDLEWARE ---
app.use(ClerkExpressWithAuth());

app.use((req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).send('Unauthenticated!');
  }
  next();
});

// --- USE ROUTERS (with /api prefix) ---
app.use('/api/projects', projectsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/profile', profileRouter);

// ✅ Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- START SERVER ---
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
