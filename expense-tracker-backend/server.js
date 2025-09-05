const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// --- MIDDLEWARE ---

// ✅ Add all allowed frontend URLs here
const allowedOrigins = [
  'https://app.vabuilders.in',              // production domain
  'https://monumental-taffy-3bfb9d.netlify.app', // Netlify frontend
  'http://localhost:3000',                  // local dev (React default)
  'http://localhost:5173'                   // local dev (Vite)
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

// ✅ Explicitly handle preflight requests
app.options('*', cors());

app.use(express.json());

// --- DATABASE CONNECTION ---
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

// --- CLERK AUTHENTICATION ---
// Apply Clerk *only* to API routes (not globally, otherwise CORS breaks)
app.use('/api', ClerkExpressWithAuth());

// Middleware to protect API routes
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // let preflight through
  }
  if (!req.auth || !req.auth.userId) {
    return res.status(401).send('Unauthenticated!');
  }
  next();
});

// --- DEFINE ROUTERS ---
const projectsRouter = require('./routes/projects');
const expensesRouter = require('./routes/expenses');
const paymentsRouter = require('./routes/payments');
const profileRouter = require('./routes/profile');

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
