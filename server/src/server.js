require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { connectDB, disconnectDB } = require('./config/db');
const { uploadsDir } = require('./middleware/upload');

const authRoutes = require('./routes/authRoutes');
const rawMaterialRoutes = require('./routes/rawMaterialRoutes');
const productRoutes = require('./routes/productRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join_product', (productId) => {
    if (productId) socket.join(`product_${productId}`);
  });

  socket.on('leave_product', (productId) => {
    if (productId) socket.leave(`product_${productId}`);
  });
});

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

let dbMode = 'connecting';

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TradeHub MERN API',
    dbMode,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const result = await connectDB();
  dbMode = result.mode;

  server.listen(PORT, () => {
    console.log(`TradeHub API + WebSocket server running on http://localhost:${PORT} (DB mode: ${dbMode})`);
  });
};

startServer().catch((error) => {
  console.error(`TradeHub API failed to start: ${error.message}`);
  process.exitCode = 1;
});

process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});
