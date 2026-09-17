// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const submissionRoutes = require('./routes/submissions');

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.set("trust proxy", true);

// Security and Parsing Configurations
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets Routing
const ROOT_DIR = path.join(__dirname, '..');
app.use(express.static(ROOT_DIR));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// API Routes Mounting
app.use('/api/admin', adminRoutes);
app.use('/api/submissions', submissionRoutes);

// Global Error Catching Pipeline
app.use((err, req, res, next) => {
  console.error('🔴 Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT,()=>{const host=process.env.RAILWAY_PUBLIC_DOMAIN?`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`:`http://localhost:${PORT}`;console.log(`Running on : ${host}`);console.log(`Admin : ${host}/admin/`);});
