const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'royalaura2026';

// Middleware for parsing JSON & Form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database file exists
const initDB = () => {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ visitors: [], inquiries: [] }, null, 2));
  }
};

const getDB = () => {
  try {
    initDB();
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { visitors: [], inquiries: [] };
  }
};

const saveDB = (data) => {
  try {
    initDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving DB:', err);
  }
};

// Visitor Tracking Middleware
app.use((req, res, next) => {
  // Skip static asset files (css, js, images)
  const isStatic = req.path.includes('.') && !req.path.endsWith('.html');
  const isApi = req.path.startsWith('/api/');
  
  if (!isStatic && !isApi) {
    try {
      const db = getDB();
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      const userAgent = req.headers['user-agent'] || 'Unknown';
      
      const newVisit = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        ip: ip || '127.0.0.1',
        path: req.path,
        userAgent: userAgent
      };

      // Keep last 500 logs
      db.visitors.unshift(newVisit);
      if (db.visitors.length > 500) {
        db.visitors = db.visitors.slice(0, 500);
      }
      
      saveDB(db);
    } catch (err) {
      console.error('Tracking error:', err);
    }
  }
  next();
});

// Serve static assets from root
app.use(express.static(path.join(__dirname, '.')));

/* ==========================================
   API Routes
   ========================================== */

// 1. Submit Inquiry API
app.post('/api/inquire', (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
  }

  const db = getDB();
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  const newInquiry = {
    id: 'INQ-' + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toISOString(),
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    message: message.trim(),
    ip: ip || '127.0.0.1'
  };

  db.inquiries.unshift(newInquiry);
  saveDB(db);

  return res.json({ success: true, message: 'Inquiry received successfully!' });
});

// 2. Admin Auth Login API
app.post('/api/admin/login', (req, res) => {
  const { passcode } = req.body;

  if (passcode === ADMIN_PASSCODE) {
    return res.json({ success: true, token: 'royal-admin-auth-token-2026' });
  }

  return res.status(401).json({ success: false, error: 'Invalid admin passcode.' });
});

// 3. Admin Analytics & Inquiry Data API
app.get('/api/admin/data', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token !== 'royal-admin-auth-token-2026') {
    return res.status(401).json({ success: false, error: 'Unauthorized admin access.' });
  }

  const db = getDB();
  const totalViews = db.visitors.length;
  
  // Calculate unique IP count
  const uniqueIPs = new Set(db.visitors.map(v => v.ip)).size;
  
  // Calculate today's visits
  const todayStr = new Date().toISOString().split('T')[0];
  const todayViews = db.visitors.filter(v => v.timestamp.startsWith(todayStr)).length;

  return res.json({
    success: true,
    stats: {
      totalViews,
      uniqueVisitors: uniqueIPs,
      totalInquiries: db.inquiries.length,
      todayViews
    },
    inquiries: db.inquiries,
    recentVisitors: db.visitors.slice(0, 100)
  });
});

// Explicit Admin Route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Royal Aura Events server running on port ${PORT}`);
});
