const express = require('express');
const productRoutes = require('./routes/productRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health / Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Inventory and Data Management System API is running',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      lowStock: '/api/products/low-stock',
      summary: '/api/products/summary'
    }
  });
});

// API Routes
app.use('/api/products', productRoutes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
