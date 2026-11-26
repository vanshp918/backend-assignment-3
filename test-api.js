require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = 5001; // Use 5001 to avoid any port conflicts during test

async function runTests() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory_db';
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB for testing.');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test server running on port ${PORT}`);

  const baseURL = `http://localhost:${PORT}/api/products`;

  try {
    let testPassed = 0;
    let testFailed = 0;

    const assert = (condition, message) => {
      if (condition) {
        console.log(`  ✓ PASS: ${message}`);
        testPassed++;
      } else {
        console.error(`  ✗ FAIL: ${message}`);
        testFailed++;
      }
    };

    console.log('\n--- Test 1: GET /api/products (Pagination & Schema Virtuals) ---');
    const res1 = await fetch(`${baseURL}?page=1&limit=10`);
    const data1 = await res1.json();
    assert(res1.status === 200, 'Status is 200 OK');
    assert(data1.total === 12, `Total is 12 (got ${data1.total})`);
    assert(data1.page === 1, `Page is 1 (got ${data1.page})`);
    assert(data1.totalPages === 2, `TotalPages is 2 (got ${data1.totalPages})`);
    assert(data1.count === 10, `Count is 10 (got ${data1.count})`);
    assert(Array.isArray(data1.products), 'Products is an array');
    assert(data1.products[0].stockValue !== undefined, 'Virtual stockValue is present on products');
    assert(data1.products[0].id !== undefined, 'Virtual id is present on products');

    console.log('\n--- Test 2: GET /api/products with Filtering (Category & Price) ---');
    const res2 = await fetch(`${baseURL}?category=Electronics&minPrice=2000`);
    const data2 = await res2.json();
    assert(res2.status === 200, 'Status is 200 OK');
    assert(data2.products.every(p => p.category === 'Electronics' && p.price >= 2000), 'All filtered items are Electronics with price >= 2000');

    console.log('\n--- Test 3: GET /api/products with Search & Sorting ---');
    const res3 = await fetch(`${baseURL}?search=Table&sortBy=price&order=asc`);
    const data3 = await res3.json();
    assert(res3.status === 200, 'Status is 200 OK');
    assert(data3.products.some(p => p.name.includes('Table')), 'Found product matching "Table"');

    console.log('\n--- Test 4: GET /api/products/low-stock (Aggregation) ---');
    const res4 = await fetch(`${baseURL}/low-stock`);
    const data4 = await res4.json();
    assert(res4.status === 200, 'Status is 200 OK');
    assert(data4.count === 4, `Low stock count is 4 (got ${data4.count})`);
    assert(Array.isArray(data4.lowStockItems), 'lowStockItems is an array');
    assert(data4.lowStockItems.every(p => p.quantity <= p.reorderLevel), 'All low-stock items have quantity <= reorderLevel');
    assert(data4.lowStockItems[0].stockValue !== undefined, 'low-stock items have calculated stockValue');

    console.log('\n--- Test 5: GET /api/products/summary (Aggregation) ---');
    const res5 = await fetch(`${baseURL}/summary`);
    const data5 = await res5.json();
    assert(res5.status === 200, 'Status is 200 OK');
    assert(data5.categories === 5, `Categories count is 5 (got ${data5.categories})`);
    assert(Array.isArray(data5.summary), 'Summary is an array');
    const elecSummary = data5.summary.find(s => s._id === 'Electronics');
    assert(elecSummary !== undefined, 'Electronics category found in summary');
    if (elecSummary) {
      assert(elecSummary.totalItems === 4, `Electronics totalItems is 4 (got ${elecSummary.totalItems})`);
      assert(elecSummary.totalQuantity === 96, `Electronics totalQuantity is 96 (got ${elecSummary.totalQuantity})`);
      assert(elecSummary.totalStockValue === 343904, `Electronics totalStockValue is 343904 (got ${elecSummary.totalStockValue})`);
      assert(elecSummary.avgPrice === 5636.5, `Electronics avgPrice is 5636.5 (got ${elecSummary.avgPrice})`);
    }

    console.log('\n--- Test 6: POST /api/products (Create Product) ---');
    const newProductData = {
      name: 'Test Bluetooth Speaker',
      sku: 'TEST-SPK-999',
      category: 'Electronics',
      price: 1999,
      quantity: 50,
      reorderLevel: 10,
      supplier: 'JBL Audio'
    };
    const res6 = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProductData)
    });
    const createdProduct = await res6.json();
    assert(res6.status === 201, 'Status is 201 Created');
    assert(createdProduct.sku === 'TEST-SPK-999', 'SKU matches created');
    assert(createdProduct.stockValue === 1999 * 50, 'Virtual stockValue calculated properly');
    const createdId = createdProduct._id;

    console.log('\n--- Test 7: GET /api/products/:id (Get Single Product) ---');
    const res7 = await fetch(`${baseURL}/${createdId}`);
    const data7 = await res7.json();
    assert(res7.status === 200, 'Status is 200 OK');
    assert(data7._id === createdId, 'Fetched product ID matches');

    console.log('\n--- Test 8: PUT /api/products/:id (Update Product Details) ---');
    const res8 = await fetch(`${baseURL}/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 2199, quantity: 45 })
    });
    const updatedProduct = await res8.json();
    assert(res8.status === 200, 'Status is 200 OK');
    assert(updatedProduct.price === 2199, 'Price updated to 2199');
    assert(updatedProduct.quantity === 45, 'Quantity updated to 45');
    assert(updatedProduct.stockValue === 2199 * 45, 'stockValue updated properly');

    console.log('\n--- Test 9: PATCH /api/products/:id/stock (Safe Stock Adjustment) ---');
    // Increment stock by +15
    const res9a = await fetch(`${baseURL}/${createdId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change: 15 })
    });
    const data9a = await res9a.json();
    assert(res9a.status === 200, 'Restock +15 status is 200 OK');
    assert(data9a.product.quantity === 60, `Quantity updated from 45 to 60 (got ${data9a.product.quantity})`);
    assert(data9a.message === 'Stock updated', 'Message is "Stock updated"');

    // Decrement stock by -20 (Sale)
    const res9b = await fetch(`${baseURL}/${createdId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change: -20 })
    });
    const data9b = await res9b.json();
    assert(res9b.status === 200, 'Sale -20 status is 200 OK');
    assert(data9b.product.quantity === 40, `Quantity reduced from 60 to 40 (got ${data9b.product.quantity})`);

    // Insufficient stock test: attempt to decrement by -100 when quantity is 40
    const res9c = await fetch(`${baseURL}/${createdId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change: -100 })
    });
    const data9c = await res9c.json();
    assert(res9c.status === 400, 'Insufficient stock returns 400 Bad Request');
    assert(data9c.message.includes('Insufficient stock'), 'Error message informs user of insufficient stock');

    console.log('\n--- Test 10: DELETE /api/products/:id (Delete Product) ---');
    const res10 = await fetch(`${baseURL}/${createdId}`, {
      method: 'DELETE'
    });
    const data10 = await res10.json();
    assert(res10.status === 200, 'Status is 200 OK');
    assert(data10.message === 'Product deleted', 'Message is "Product deleted"');
    assert(data10.id === createdId, 'Deleted ID matches');

    // Verify deletion
    const res10Verify = await fetch(`${baseURL}/${createdId}`);
    assert(res10Verify.status === 404, 'Product no longer exists (404 Not Found)');

    console.log('\n--- Test 11: Validation and Error Handling ---');
    // Duplicate SKU
    const res11a = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Study Table',
        sku: 'FURN-TB-812', // Already exists in seed
        category: 'Furniture',
        price: 4500,
        quantity: 10,
        reorderLevel: 5
      })
    });
    assert(res11a.status === 409, `Duplicate SKU returns 409 Conflict (got ${res11a.status})`);

    // Invalid ObjectId format
    const res11b = await fetch(`${baseURL}/not-a-valid-object-id`);
    assert(res11b.status === 400, `Invalid ID format returns 400 Bad Request (got ${res11b.status})`);

    // Missing required field
    const res11c = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: 'INVAL-01',
        category: 'Furniture'
        // name and price missing
      })
    });
    assert(res11c.status === 400, `Missing required field returns 400 Bad Request (got ${res11c.status})`);

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${testPassed} passed, ${testFailed} failed.`);
    console.log(`========================================\n`);

  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
