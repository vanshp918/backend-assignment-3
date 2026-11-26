# Assignment 3: Inventory and Data Management System

A production-ready RESTful backend built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose** for warehouse and inventory catalog management. It provides complete CRUD operations, query-string based filtering, sorting, pagination, safe stock adjustments, centralized error handling, and MongoDB aggregation pipelines for inventory reporting.

---

## 🚀 Technology Stack & Constraints

- **Runtime Environment:** Node.js
- **Routing & Framework:** Express.js
- **Database:** MongoDB
- **ODM & Schema Validation:** Mongoose
- **Environment Management:** dotenv
- **Strict Compliance:** No pre-built admin panels, CMS, or boilerplate libraries. Only `express`, `mongoose`, and `dotenv`.

---

## 📁 Project Structure

```text
├── .env                  # Environment configuration
├── .env.example          # Sample environment variables
├── .gitignore            # Git ignore rules
├── package.json          # Node.js project manifest & scripts
├── README.md             # Project documentation & API guide
├── seed.js               # Database seeder (12 items across 5 categories)
├── test-api.js           # Automated test suite (48 assertions)
└── src/
    ├── app.js            # Express application setup & middleware
    ├── server.js         # HTTP server entry point & DB connection
    ├── config/
    │   └── db.js         # Mongoose MongoDB connection
    ├── controllers/
    │   └── productController.js  # CRUD and Aggregation business logic
    ├── middleware/
    │   ├── errorHandler.js       # Centralized error handler & 404
    │   └── validate.js           # Request payload & ID validators
    ├── models/
    │   └── Product.js            # Mongoose Schema, validations & virtuals
    └── routes/
        └── productRoutes.js      # Express API route declarations
```

---

## ⚙️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or verify `.env` in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_db
```

### 3. Seed Initial Inventory Data
Pre-loads 12 products across 5 categories (matching the assignment screenshots):
```bash
npm run seed
```

### 4. Run Automated Test Suite
Executes 48 automated test assertions covering all endpoints, query params, validations, safe stock adjustments, and aggregation queries:
```bash
npm test
```

### 5. Start the Server
- **Production mode:**
  ```bash
  npm start
  ```
- **Development / Watch mode:**
  ```bash
  npm run dev
  ```
Server starts at: `http://localhost:5000`

---

## 📊 Database Schema Design

### Product Schema (`src/models/Product.js`)

| Field | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | Trimmed, minlength: 2 | Product name |
| `sku` | String | Yes | Unique, Uppercase, Trimmed | Stock Keeping Unit identifier |
| `category` | String | Yes | Trimmed | Product category |
| `price` | Number | Yes | Min: 0 | Selling unit price |
| `quantity` | Number | Yes | Min: 0, default: 0 | Current stock quantity |
| `reorderLevel` | Number | Yes | Min: 0, default: 5 | Low-stock threshold |
| `supplier` | String | No | Trimmed, default: `""` | Supplier name |
| `createdAt` | Date | Auto | Timestamps: true | Record creation timestamp |
| `updatedAt` | Date | Auto | Timestamps: true | Last update timestamp |

### Schema Virtuals:
- **`stockValue`**: Dynamically computed as `price * quantity`.
- **`id`**: String representation of `_id` automatically included via `{ toJSON: { virtuals: true }, toObject: { virtuals: true } }`.

---

## 🔌 API Endpoints Reference

Base URL: `http://localhost:5000/api/products`

### 1. Create Product
- **Route:** `POST /api/products`
- **Status:** `201 Created`
- **Request Body:**
  ```json
  {
    "name": "Gel Pen Pack of 15",
    "sku": "STNY-PN-713",
    "category": "Stationery",
    "price": 120,
    "quantity": 40,
    "reorderLevel": 20,
    "supplier": "Cello Pens"
  }
  ```
- **Response:**
  ```json
  {
    "_id": "6a547727f6123427d6e61d7c",
    "name": "Gel Pen Pack of 15",
    "sku": "STNY-PN-713",
    "category": "Stationery",
    "price": 120,
    "quantity": 40,
    "reorderLevel": 20,
    "supplier": "Cello Pens",
    "createdAt": "2026-07-13T05:27:03.054Z",
    "updatedAt": "2026-07-13T05:27:03.054Z",
    "__v": 0,
    "stockValue": 4800,
    "id": "6a547727f6123427d6e61d7c"
  }
  ```

---

### 2. Get All Products (Filtering, Sorting & Pagination)
- **Route:** `GET /api/products`
- **Status:** `200 OK`
- **Query Parameters:**
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`)
  - `category`: Filter by category (case-insensitive)
  - `search`: Keyword search across `name` and `sku`
  - `minPrice` / `maxPrice`: Filter by price range
  - `inStock`: `true` (quantity > 0) or `false` (quantity = 0)
  - `supplier`: Filter by supplier name
  - `sortBy`: Field to sort (`price`, `quantity`, `name`, `createdAt`), default: `createdAt`
  - `order`: `asc` or `desc` (default: `desc`)
- **Example Request:** `GET /api/products?page=1&limit=10`
- **Response:**
  ```json
  {
    "total": 12,
    "page": 1,
    "totalPages": 2,
    "count": 10,
    "products": [
      {
        "_id": "6a54767af6123427d6e61d76",
        "name": "Study Table",
        "sku": "FURN-TB-812",
        "category": "Furniture",
        "price": 3999,
        "quantity": 2,
        "reorderLevel": 4,
        "supplier": "IKEA India",
        "createdAt": "2026-07-13T05:24:10.351Z",
        "updatedAt": "2026-07-13T05:24:10.351Z",
        "__v": 0,
        "stockValue": 7998,
        "id": "6a54767af6123427d6e61d76"
      }
    ]
  }
  ```

---

### 3. Get Single Product by ID
- **Route:** `GET /api/products/:id`
- **Status:** `200 OK` (or `404 Not Found`, `400 Bad Request` if invalid ID)
- **Response:** Single product object with virtual `stockValue` and `id`.

---

### 4. Update Product Details
- **Route:** `PUT /api/products/:id`
- **Status:** `200 OK`
- **Request Body:**
  ```json
  {
    "name": "Gel Pen Pack of 15",
    "sku": "STNY-PN-713",
    "category": "Stationery",
    "price": 140,
    "quantity": 60
  }
  ```
- **Response:** Updated product object with recalculated `stockValue`.

---

### 5. Safe Stock Adjustment (Restock / Sale)
- **Route:** `PATCH /api/products/:id/stock`
- **Status:** `200 OK` (or `400 Bad Request` if decrement exceeds current stock)
- **Restock (+10):**
  ```json
  {
    "change": 10
  }
  ```
  **Response:**
  ```json
  {
    "message": "Stock updated",
    "product": {
      "_id": "6a54767af6123427d6e61d76",
      "name": "Study Table",
      "sku": "FURN-TB-812",
      "category": "Furniture",
      "price": 3999,
      "quantity": 12,
      "reorderLevel": 4,
      "supplier": "IKEA India",
      "createdAt": "2026-07-13T05:24:10.351Z",
      "updatedAt": "2026-07-13T05:35:24.419Z",
      "__v": 0,
      "stockValue": 47988,
      "id": "6a54767af6123427d6e61d76"
    }
  }
  ```
- **Safe Sale (-5):**
  ```json
  {
    "change": -5
  }
  ```
- **Insufficient Stock Error:**
  If `quantity + change < 0`, returns `400 Bad Request`:
  ```json
  {
    "message": "Insufficient stock. Current stock is 2, cannot reduce by 10."
  }
  ```

---

### 6. Delete Product
- **Route:** `DELETE /api/products/:id`
- **Status:** `200 OK`
- **Response:**
  ```json
  {
    "message": "Product deleted",
    "id": "6a547727f6123427d6e61d7c"
  }
  ```

---

### 7. Low-Stock Alert Report (Aggregation)
- **Route:** `GET /api/products/low-stock`
- **Status:** `200 OK`
- **Aggregation Pipeline:** Filters products where `$expr: { $lte: ["$quantity", "$reorderLevel"] }`.
- **Response:**
  ```json
  {
    "count": 4,
    "lowStockItems": [
      {
        "_id": "6a54767af6123427d6e61d76",
        "name": "Study Table",
        "sku": "FURN-TB-812",
        "category": "Furniture",
        "price": 3999,
        "quantity": 2,
        "reorderLevel": 4,
        "supplier": "IKEA India",
        "createdAt": "2026-07-13T05:24:10.351Z",
        "updatedAt": "2026-07-13T05:24:10.351Z",
        "__v": 0,
        "stockValue": 7998,
        "id": "6a54767af6123427d6e61d76"
      }
    ]
  }
  ```

---

### 8. Category-wise Inventory Summary (Aggregation)
- **Route:** `GET /api/products/summary`
- **Status:** `200 OK`
- **Aggregation Pipeline:** Groups by `$category` computing `totalItems`, `totalQuantity`, `totalStockValue`, and `avgPrice`.
- **Response:**
  ```json
  {
    "categories": 5,
    "summary": [
      {
        "_id": "Electronics",
        "totalItems": 4,
        "totalQuantity": 96,
        "totalStockValue": 343904,
        "avgPrice": 5636.5
      },
      {
        "_id": "Apparel",
        "totalItems": 2,
        "totalQuantity": 78,
        "totalStockValue": 75522,
        "avgPrice": 1399
      }
    ]
  }
  ```

---

## 🛡️ Centralized Error Handling

All runtime and database errors pass through `src/middleware/errorHandler.js`:
- **Validation Errors (`ValidationError`):** Returns `400 Bad Request` with field descriptions.
- **Malformed ObjectIds (`CastError`):** Returns `400 Bad Request` with invalid ID message.
- **Duplicate SKU (`11000`):** Returns `409 Conflict` indicating duplicate SKU.
- **404 Route Not Found:** Returns `404` for non-existent endpoints.
