import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Mock Database in memory
const users = [
  { email: "dosen@kampus.ac.id", password: "password123", name: "Dosen Pembimbing" },
  { email: "user@hybrid.com", password: "user123", name: "User Reguler" }
];

// Backend Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running perfectly!', timestamp: new Date() });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Return success without password
    const { password: _, ...userData } = user;
    return res.json({ success: true, message: 'Login successful', user: userData, token: 'mock-jwt-token-12345' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
});

// Start local server if not running in Vercel serverless environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless Functions
export default app;
