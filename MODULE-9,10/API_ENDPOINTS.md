# IRFIS API Endpoints Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Login

```http
POST /auth/login
```

**Body:**

```json
{
  "userId": "24ADM001",
  "password": "admin123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "24ADM001",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "admin",
      "dateOfBirth": "1970-01-01",
      "isFirstLogin": false
    },
    "token": "jwt-token-here"
  }
}
```

### Change Password

```http
POST /auth/change-password
```

**Body:**

```json
{
  "oldPassword": "current-password",
  "newPassword": "new-password"
}
```

### Create User (Admin Only)

```http
POST /auth/create-user
```

**Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "role": "vendor",
  "dateOfBirth": "1990-01-01"
}
```

### Get Current User

```http
GET /auth/me
```

---

## 👥 User Management Endpoints

### Get All Users (Admin Only)

```http
GET /users?page=1&limit=10&role=vendor&search=john
```

### Get User Statistics (Admin Only)

```http
GET /users/stats
```

### Get User by ID

```http
GET /users/24VEN001
```

### Update User (Admin Only)

```http
PUT /users/24VEN001
```

**Body:**

```json
{
  "firstName": "Updated Name",
  "role": "admin"
}
```

### Delete User (Admin Only)

```http
DELETE /users/24VEN001
```

### Reset Password (Admin Only)

```http
POST /users/24VEN001/reset-password
```

---

## 📦 Lot Management Endpoints

### Create Lot (Vendor Only)

```http
POST /lots
```

**Body:**

```json
{
  "partName": "Rail Joint Connector",
  "factoryName": "Steel Industries Ltd",
  "lotNumber": "RJC2024001",
  "supplyDate": "2024-01-15",
  "manufacturingDate": "2024-01-10",
  "warrantyPeriod": "5 years"
}
```

### Get All Lots

```http
GET /lots?page=1&limit=10&status=pending
```

### Get Lot by ID

```http
GET /lots/LOT1234567890
```

### Update Lot Status (Depot Staff Only)

```http
PUT /lots/LOT1234567890/status
```

**Body:**

```json
{
  "status": "verified"
}
```

### Generate Parts from Lot (Admin/Vendor Only)

```http
POST /lots/LOT1234567890/generate-parts
```

**Body:**

```json
{
  "quantity": 10
}
```

### Get Parts in Lot

```http
GET /lots/LOT1234567890/parts?page=1&limit=10&installed=false
```

---

## 🔧 Parts Management Endpoints

### Get All Parts

```http
GET /parts?page=1&limit=10&isInstalled=false&lotNumber=RJC2024001
```

### Get Part by ID

```http
GET /parts/PART1234567890
```

### Install Part (Track Worker Only)

```http
POST /parts/PART1234567890/install
```

**Body:**

```json
{
  "location": "Station ABC",
  "section": "Track 1, KM 45.2",
  "installationDate": "2024-02-01"
}
```

### Get Installed Parts

```http
GET /parts/installed?page=1&limit=10&location=Station ABC
```

### Get Installation History

```http
GET /parts/installation-history/24TRK001?page=1&limit=10
```

---

## 🔍 Inspection Endpoints

### Create Inspection (Inspector Only)

```http
POST /inspections
```

**Body:**

```json
{
  "partId": "PART1234567890",
  "condition": "good",
  "notes": "Part in excellent condition",
  "photos": ["photo1.jpg", "photo2.jpg"]
}
```

### Get All Inspections

```http
GET /inspections?page=1&limit=10&condition=good&inspectorId=24INS001
```

### Get Inspection by ID

```http
GET /inspections/INS1234567890
```

### Get Part Inspection History

```http
GET /inspections/part/PART1234567890?page=1&limit=10
```

### Get Defect Reports

```http
GET /inspections/defects?page=1&limit=10
```

### Get Inspection Schedule

```http
GET /inspections/schedule?page=1&limit=10&days=30
```

---

## 📱 QR Code Endpoints

### Generate QR Code

```http
POST /qr/generate
```

**Body:**

```json
{
  "type": "lot",
  "id": "LOT1234567890"
}
```

### Scan QR Code

```http
POST /qr/scan
```

**Body:**

```json
{
  "qrData": "{\"type\":\"part\",\"id\":\"PART1234567890\",...}"
}
```

### Get Existing QR Code

```http
GET /qr/lot/LOT1234567890
GET /qr/part/PART1234567890
```

---

## 📸 File Upload Endpoints

### Upload Inspection Photos (Inspector Only)

```http
POST /upload/inspection-photos
```

**Form Data:**

- `photos`: Multiple image files (max 5, max 10MB each)

### Delete Photo (Inspector/Admin Only)

```http
DELETE /upload/inspection-photos/photo-filename.jpg
```

### Serve Photo

```http
GET /upload/inspection-photos/photo-filename.jpg
```

---

## 📊 Sample Data Flow

### 1. Vendor Creates Lot

```bash
# Login as vendor
POST /auth/login
{
  "userId": "24VEN001",
  "password": "rajesh@1985-03-15"
}

# Create lot
POST /lots
{
  "partName": "Rail Joint Connector",
  "factoryName": "Steel Industries Ltd",
  "lotNumber": "RJC2024001",
  "supplyDate": "2024-01-15",
  "manufacturingDate": "2024-01-10",
  "warrantyPeriod": "5 years"
}

# Generate parts from lot
POST /lots/LOT1234567890/generate-parts
{
  "quantity": 10
}
```

### 2. Depot Staff Verifies Lot

```bash
# Login as depot staff
POST /auth/login
{
  "userId": "24DEP001",
  "password": "priya@1988-07-22"
}

# Scan QR code
POST /qr/scan
{
  "qrData": "{\"type\":\"lot\",\"id\":\"LOT1234567890\",...}"
}

# Update lot status
PUT /lots/LOT1234567890/status
{
  "status": "verified"
}
```

### 3. Track Worker Installs Parts

```bash
# Login as track worker
POST /auth/login
{
  "userId": "24TRK001",
  "password": "amit@1990-12-05"
}

# Scan part QR code
POST /qr/scan
{
  "qrData": "{\"type\":\"part\",\"id\":\"PART1234567890\",...}"
}

# Install part
POST /parts/PART1234567890/install
{
  "location": "Station ABC",
  "section": "Track 1, KM 45.2"
}
```

### 4. Inspector Inspects Parts

```bash
# Login as inspector
POST /auth/login
{
  "userId": "24INS001",
  "password": "sunita@1982-09-18"
}

# Upload inspection photos
POST /upload/inspection-photos
# Form data with photos

# Create inspection
POST /inspections
{
  "partId": "PART1234567890",
  "condition": "good",
  "notes": "Part in excellent condition",
  "photos": ["photo1.jpg", "photo2.jpg"]
}
```

---

## 🚨 Error Responses

### Validation Error

```json
{
  "success": false,
  "message": "Validation error",
  "error": "userId is required"
}
```

### Authentication Error

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Authorization Error

```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### Not Found Error

```json
{
  "success": false,
  "message": "Lot not found"
}
```

---

## 📝 Notes

1. **User IDs** follow the format: `YYROLENUMBERS` (e.g., `24ADM001`)
2. **Default passwords** follow the format: `firstname@DOB`
3. **All dates** should be in ISO format: `2024-01-15`
4. **File uploads** are limited to images (JPEG, PNG, WebP) with max 10MB per file
5. **Pagination** is available on most list endpoints with `page` and `limit` parameters
6. **Role-based access** is enforced on all endpoints
