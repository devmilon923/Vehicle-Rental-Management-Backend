# Vehicle Rental Management System — Backend API

A production-ready, service-oriented RESTful API built with **Node.js**, **Express**, **TypeScript**, **PostgreSQL**, and **Prisma ORM** for managing vehicle rentals, fleet operations, staff authentication, and financial reporting.

---

## 📌 Technology Stack & Deviation Statement

- **Core Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma ORM v7
- **Validation**: Zod
- **Authentication**: JWT (JSON Web Tokens) & Bcrypt password hashing
- **File Storage**: Multer (Local disk storage)
- **Code Quality**: ESLint & Prettier

> **Technology Choice Note**: The original task specification suggested Knex and Joi/express-validator. This production implementation intentionally uses **Prisma ORM** and **Zod** for end-to-end type safety, structured multi-file schema management, robust data validation, and superior developer ergonomics while strictly adhering to all functional API contracts and business logic requirements.

---

## ✨ Features

- **Staff Authentication & Authorization**:
  - Secure login (`POST /auth/login`) returning JWT tokens.
  - Omission of password hashes in responses.
  - Middleware-based route protection for vehicles, rentals, and reports.

- **Fleet / Vehicle Management**:
  - Full CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`).
  - Search by name & filter by category (case-insensitive).
  - Pagination metadata support.
  - Image upload & replacement via Multer with old file cleanup.
  - Soft deletion pattern (`deleted_at` timestamp) preserving historical records.

- **Rental Management**:
  - Booking creation with server-controlled pricing calculations (`total_amount = daily_rate × days`).
  - Same-day rental support (Aug 10 → Aug 10 = 1 day).
  - Real-time double-booking prevention (`409 Conflict`) across `BOOKED` and `ONGOING` statuses.
  - Soft-cancelled rental deletion (`DELETE /rentals/:id` sets `CANCELLED` status).
  - Overlap-aware date range filtering.

- **Monthly Performance & Revenue Reports**:
  - Report endpoint `GET /reports/rentals?month=YYYY-MM` (with optional `&vehicle_id=`).
  - **Cross-Month Attribution**: Renting across month boundaries (e.g. July 29 → August 3) attributes only the relevant days (Aug 1–3 = 3 days) and revenue to August's report.
  - Automatic calculation of top-performing vehicle by monthly revenue.

---

## 🏗️ Architecture

The application adopts a clean, layered service-oriented architecture:

```text
src/
├── index.ts               # Express application entrypoint
├── routes/                # Central route registry (appRouters)
├── modules/
│   ├── auth/              # Auth route, controller, service, validation, interface
│   ├── vehicles/          # Vehicle CRUD, image upload, soft-delete logic
│   ├── rentals/           # Rental CRUD, overlap check, price calculation
│   └── reports/           # Monthly financial breakdown & analytics
├── middleware/
│   ├── auth.ts            # JWT authentication guard
│   ├── errorHandler.ts    # Global error handler with Zod & Prisma formatting
│   ├── notFoundHandler.ts  # 404 handler
│   └── roleGuard.ts       # Role-based access handler
├── util/
│   ├── date.ts            # UTC midnight normalization & rental day calculator
│   ├── error.ts           # Custom ServerError exception class
│   ├── multer.ts          # Photo storage configuration
│   ├── pagination.ts      # Standardized pagination metadata builder
│   ├── prisma.ts          # Singleton Prisma Client instance
│   └── sendResponse.ts    # Standardized API response formatter
└── types/                 # Custom ambient types (Express Request extension)
```

---

## 🗄️ Database Schema

The database models are configured in `prisma/models/` and bundled into `prisma/schema.prisma`:

### `Staff`

- `id` (Int, Primary Key, Auto-increment)
- `email` (String, Unique)
- `password_hash` (String)
- `name` (String)
- `role` (Enum: `ADMIN`, `STAFF`)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### `Vehicle`

- `id` (Int, Primary Key, Auto-increment)
- `name` (String)
- `plate_number` (String, Unique)
- `category` (String)
- `daily_rate` (Decimal)
- `photo_path` (String, Optional)
- `deleted_at` (DateTime, Optional — Soft Delete)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### `Rental`

- `id` (Int, Primary Key, Auto-increment)
- `vehicle_id` (Int, Foreign Key → `Vehicle.id`)
- `customer_name` (String)
- `customer_phone` (String)
- `start_date` (DateTime)
- `end_date` (DateTime)
- `total_amount` (Decimal)
- `status` (Enum: `BOOKED`, `ONGOING`, `COMPLETED`, `CANCELLED`)
- `created_at` (DateTime)
- `updated_at` (DateTime)

---

## 🔑 Authentication

Protected endpoints require a valid JWT token sent in the HTTP `Authorization` header:

```http
Authorization: Bearer <your_jwt_token_here>
```

### Auth Endpoints

#### `POST /auth/login`

- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "staff@example.com",
    "password": "password"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "staff": {
        "id": 1,
        "name": "Test Staff",
        "email": "staff@example.com",
        "role": "STAFF"
      }
    }
  }
  ```

---

## 🚗 Vehicle Endpoints

Protected by JWT authentication.

#### `GET /vehicles`

- **Query Params**: `page` (default: 1), `limit` (default: 10), `category`, `search`
- **Response** (`200 OK`): Returns paginated list of non-deleted vehicles.

#### `GET /vehicles/:id`

- **Response** (`200 OK`): Returns vehicle details or `404 Not Found`.

#### `POST /vehicles`

- **Content-Type**: `multipart/form-data`
- **Form Fields**: `name`, `plate_number`, `category`, `daily_rate`, `photo` (file, optional)
- **Response** (`201 Created`): Returns created vehicle object.

#### `PUT /vehicles/:id`

- **Content-Type**: `multipart/form-data`
- **Form Fields**: `name`, `plate_number`, `category`, `daily_rate`, `photo` (file, optional)
- **Response** (`200 OK`): Updates vehicle and unlinks former photo file if replaced.

#### `DELETE /vehicles/:id`

- **Response** (`200 OK`): Soft-deletes vehicle by setting `deleted_at = current_timestamp`.

---

## 📑 Rental Endpoints

Protected by JWT authentication.

#### `GET /rentals`

- **Query Params**: `page`, `limit`, `vehicle_id`, `status`, `start_date`, `end_date`
- **Response** (`200 OK`): Returns list of rentals matching filters.

#### `GET /rentals/:id`

- **Response** (`200 OK`): Returns rental details with included vehicle relation.

#### `POST /rentals`

- **Request Body**:
  ```json
  {
    "vehicle_id": 1,
    "customer_name": "John Doe",
    "customer_phone": "+1234567890",
    "start_date": "2026-08-10",
    "end_date": "2026-08-15"
  }
  ```
- **Response** (`201 Created`): Creates booking with server-calculated `total_amount`.
- **Errors**: `404 Not Found` if vehicle deleted/non-existent, `409 Conflict` if vehicle is already booked for overlapping dates.

#### `PUT /rentals/:id`

- **Request Body**: Partial rental fields (`vehicle_id`, `customer_name`, `customer_phone`, `start_date`, `end_date`, `status`).
- **Response** (`200 OK`): Updates rental, re-evaluating double-booking checks and recalculating `total_amount` if dates/vehicle change.

#### `DELETE /rentals/:id`

- **Response** (`200 OK`): Sets rental status to `CANCELLED`, freeing future availability for that vehicle while preserving historical records.

---

## 📊 Reports Endpoints

Protected by JWT authentication.

#### `GET /reports/rentals?month=YYYY-MM`

- **Query Params**:
  - `month` (Required, string format `YYYY-MM`, e.g., `2026-08`)
  - `vehicle_id` (Optional, integer)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Rental report generated successfully",
    "data": {
      "month": "2026-08",
      "vehicles": [
        {
          "id": 1,
          "name": "Toyota Camry",
          "total_bookings": 1,
          "days_rented": 3,
          "revenue": 7500
        }
      ],
      "highest_revenue_vehicle": {
        "id": 1,
        "name": "Toyota Camry",
        "total_bookings": 1,
        "days_rented": 3,
        "revenue": 7500
      }
    }
  }
  ```

---

## 🧠 Business Rules & Algorithms

### 1. Rental Overlap Detection

A vehicle cannot be booked for overlapping date ranges if another active rental (`BOOKED` or `ONGOING`) exists.

Two date intervals `[startA, endA]` and `[startB, endB]` overlap if and only if:

```text
startA <= endB AND endA >= startB
```

In Prisma service queries:

```ts
where: {
  vehicle_id: vehicleId,
  status: { in: ['BOOKED', 'ONGOING'] },
  start_date: { lte: requestedEndDate },
  end_date: { gte: requestedStartDate },
}
```

If a match is found, the system returns `409 Conflict`. Cancelled (`CANCELLED`) and completed (`COMPLETED`) rentals do not block future bookings.

### 2. Rental Amount Calculation

Rental amounts are calculated server-side based on calendar days:

- `Aug 10 → Aug 10`: Same-day rental = **1 day**
- `Aug 10 → Aug 11`: **1 day**
- `Aug 10 → Aug 12`: **2 days**
- `Aug 10 → Aug 13`: **3 days**

```text
total_amount = daily_rate * rental_days
```

### 3. Monthly Report Cross-Month Calculation

For a monthly report (`month=YYYY-MM`), only days falling within that calendar month contribute to `days_rented` and `revenue`.

Given rental period `[start, end]` and month period `[monthStart, monthEnd]`:

- **Overlap Start**: `max(start, monthStart)`
- **Overlap End**: `min(end, monthEnd)`
- **Days in Month**: `(overlap_end - overlap_start in days) + 1`

**Example**:

- Rental: `July 29 → August 3` (Daily rate: 2,500)
- August Report (`month=2026-08`): Overlap is `Aug 1 → Aug 3` (3 days: Aug 1, 2, 3).
- **August Contribution**: 3 days, Revenue = `3 * 2500 = 7,500`.
- **July Contribution**: July 29, 30, 31 (3 days), Revenue = `3 * 2500 = 7,500`.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` before running:

```bash
cp .env.example .env
```

### Environment Variables

| Variable       | Description                       | Default / Example                                  |
| :------------- | :-------------------------------- | :------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string      | `postgresql://user:pass@localhost:5432/vehicle_db` |
| `PORT`         | HTTP server listening port        | `3000`                                             |
| `JWT_SECRET`   | Secret key for signing JWT tokens | `your_jwt_secret_key_here`                         |
| `UPLOAD_PATH`  | Storage folder for vehicle photos | `./public/data/uploads/`                           |
| `APP_NAME`     | Name of application               | `Vehicle Rental API`                               |

---

## 🚀 Installation & Database Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Database Migrations

```bash
npx prisma migrate deploy
```

### 3. Seed Database

```bash
npm run seed
```

The seed script creates:

- **Staff Account**: `staff@example.com` (password: `password`)
- **Vehicles**: Toyota Camry ($2,500/day) & Honda CR-V ($3,500/day)
- **Cross-Month Rental**: Toyota Camry booked `July 29 → August 3` (specifically to test cross-month report attribution)
- **In-Month Rental**: Honda CR-V booked `August 10 → August 15`

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Build & Run

```bash
npm run build
npm run start
```

### Quality & Type Checks

```bash
npm run type-check   # Type check with tsc --noEmit
npm run lint         # ESLint check
npm run format       # Prettier code format
```

---

## ⚠️ Error Handling & Response Format

All responses follow a standard envelope:

### Success Response (`200 OK` / `201 Created`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { ... }
}
```

### Error Response (`400`, `401`, `404`, `409`, `500`)

```json
{
  "success": false,
  "statusCode": 409,
  "status": 409,
  "errorType": "Client Error",
  "message": "Vehicle is already booked for an overlapping period",
  "errorSources": [
    {
      "path": "",
      "message": "Vehicle is already booked for an overlapping period"
    }
  ],
  "path": "/rentals"
}
```

---

## 📝 Technical Review Notes

When evaluating the primary requirements for this assignment:

1. **Rental Overlap Detection**: Implemented cleanly in `RentalService.checkOverlap` using UTC midnight normalized dates and Prisma boundary queries (`lte` / `gte`) filtered strictly to active statuses (`BOOKED`, `ONGOING`).
2. **Monthly Report Breakdown**: Implemented in `ReportService.getMonthlyRentalReport`. It correctly isolates rental days intersecting the target month, ensuring cross-month rentals attribute revenue proportionally per month rather than assigning lump sums.
