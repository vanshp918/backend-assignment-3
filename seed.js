require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const seedProducts = [
  // Furniture (2 items)
  {
    name: 'Study Table',
    sku: 'FURN-TB-812',
    category: 'Furniture',
    price: 3999,
    quantity: 2,
    reorderLevel: 4,
    supplier: 'IKEA India'
  },
  {
    name: 'Ergonomic Office Chair',
    sku: 'FURN-CH-401',
    category: 'Furniture',
    price: 6999,
    quantity: 5,
    reorderLevel: 8,
    supplier: 'Godrej Interio'
  },

  // Electronics (4 items - exactly matches summary metrics: totalQty: 96, avgPrice: 5636.5, stockValue: 343904)
  {
    name: 'Wireless Mouse',
    sku: 'ELEC-MS-101',
    category: 'Electronics',
    price: 1499,
    quantity: 14,
    reorderLevel: 15,
    supplier: 'Logitech'
  },
  {
    name: 'Gaming Earbuds',
    sku: 'ELEC-EB-202',
    category: 'Electronics',
    price: 1999,
    quantity: 45,
    reorderLevel: 20,
    supplier: 'boAt'
  },
  {
    name: 'Mechanical Keyboard',
    sku: 'ELEC-KB-303',
    category: 'Electronics',
    price: 2499,
    quantity: 27,
    reorderLevel: 10,
    supplier: 'Keychron'
  },
  {
    name: '4K Gaming Monitor',
    sku: 'ELEC-MN-404',
    category: 'Electronics',
    price: 16549,
    quantity: 10,
    reorderLevel: 5,
    supplier: 'Dell'
  },

  // Apparel (2 items - exactly matches summary metrics: totalQty: 78, avgPrice: 1399, stockValue: 75522)
  {
    name: 'Cotton Polo T-Shirt',
    sku: 'APRL-TS-501',
    category: 'Apparel',
    price: 799,
    quantity: 67,
    reorderLevel: 20,
    supplier: 'Raymond'
  },
  {
    name: 'Denim Biker Jacket',
    sku: 'APRL-JK-502',
    category: 'Apparel',
    price: 1999,
    quantity: 11,
    reorderLevel: 10,
    supplier: 'Levi’s'
  },

  // Stationery (2 items)
  {
    name: 'Gel Pen Pack of 15',
    sku: 'STNY-PN-713',
    category: 'Stationery',
    price: 120,
    quantity: 40,
    reorderLevel: 20,
    supplier: 'Cello Pens'
  },
  {
    name: 'Executive Diary A5',
    sku: 'STNY-NB-104',
    category: 'Stationery',
    price: 250,
    quantity: 15,
    reorderLevel: 25,
    supplier: 'Classmate'
  },

  // Footwear (2 items)
  {
    name: 'Running Shoes Pro',
    sku: 'FTWR-SH-901',
    category: 'Footwear',
    price: 2999,
    quantity: 35,
    reorderLevel: 10,
    supplier: 'Puma'
  },
  {
    name: 'Casual Canvas Sneakers',
    sku: 'FTWR-SN-302',
    category: 'Footwear',
    price: 1599,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Bata'
  }
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory_db';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Existing products cleared.');

    // Insert sample products
    const inserted = await Product.insertMany(seedProducts);
    console.log(`Successfully seeded ${inserted.length} products across 5 categories.`);

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDB();
