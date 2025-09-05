const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// --- MIDDLEWARE ---
// --- FIX 4: Flexible CORS configuration for Production and Development ---
const allowedOrigins = ['https://app.vabuilders.in'];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
}

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
app.use(cors(corsOptions));
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

// This line correctly serves your uploaded logo files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- START SERVER ---
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});