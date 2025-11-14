IRFIS – Frontend
IRFIS (Inspection Request & Fault Identification System) is a digital solution designed to streamline the inspection workflow between automotive industries, inspectors, and administrators. This repository contains the frontend of IRFIS, built with React and modern UI practices.

🚀 Features
✅ User Authentication (Login / Signup)
✅ Dashboard for Real-time Data Visualization
✅ Upload Parts & Inspection Requests
✅ QR Code Based Validation System
✅ Role-based Access Control (User, Inspector, Admin)
✅ Integration with Backend API
✅ Responsive & Modern UI

🛠️ Technology Stack
Technology	Purpose
React.js	Frontend Framework
HTML5 + CSS3	Layout & Styling
JavaScript	Frontend Logic
Axios / Fetch	API Communication
React Router	Navigation & Routing
📂 Project Structure
frontend/ ├── public/ ├── src/ │ ├── components/ │ ├── pages/ │ ├── services/ │ ├── App.js │ └── index.js ├── package.json ├── README.md

yaml Copy code

🔧 Setup & Installation
1️⃣ Clone the repository
git clone https://github.com/CU-2025/project-submission-exp-9-10-MehtaHimanshi.git
cd frontend
2️⃣ Install dependencies
sh
Copy code
npm install
3️⃣ Start the development server
sh
Copy code
npm start
The app will open at:

arduino
Copy code
http://localhost:3000/
🌐 Backend Integration
Make sure the backend server is running.
Update API base URL inside:

bash
Copy code
src/services/api.js
Example:

js
Copy code
export const BASE_URL = "http://localhost:5000/api";
✅ Future Enhancements
Dashboard Analytics

Email/Notification Alerts

Mobile App Version

Dark Mode Support

AI-based Inspection Suggestions

📝 License
This project is submitted as part of Chandigarh University academic work.
IRFIS Backend API
Indian Railways Fittings Identification System - Backend API Server

Features
User Management: Role-based authentication (Admin, Vendor, Depot Staff, Track Worker, Inspector)
Lot Management: Create and manage lots of railway fittings
QR Code System: Generate and scan QR codes for lots and individual parts
Installation Tracking: Track part installations with location data
Inspection System: Record inspections with condition assessments and photos
File Upload: Secure photo upload for inspections
RESTful API: Complete REST API with proper error handling
Tech Stack
Node.js with TypeScript
Express.js web framework
MongoDB with Mongoose ODM
JWT authentication
Multer for file uploads
QR Code generation
Joi for validation
Helmet for security
Rate limiting and CORS protection
API Endpoints
Authentication
POST /api/auth/login - User login
POST /api/auth/change-password - Change password
POST /api/auth/create-user - Create new user (Admin)
GET /api/auth/me - Get current user
Users
GET /api/users - Get all users (Admin)
GET /api/users/stats - Get user statistics (Admin)
GET /api/users/:id - Get user by ID
PUT /api/users/:id - Update user (Admin)
DELETE /api/users/:id - Delete user (Admin)
POST /api/users/:id/reset-password - Reset password (Admin)
Lots
POST /api/lots - Create new lot (Vendor)
GET /api/lots - Get all lots
GET /api/lots/:id - Get lot by ID
PUT /api/lots/:id/status - Update lot status (Depot Staff)
POST /api/lots/:id/generate-parts - Generate parts from lot
GET /api/lots/:id/parts - Get parts in a lot
Parts
GET /api/parts - Get all parts
GET /api/parts/:id - Get part by ID
POST /api/parts/:id/install - Install part (Track Worker)
GET /api/parts/installed - Get installed parts
GET /api/parts/installation-history/:workerId - Get installation history
Inspections
POST /api/inspections - Create inspection (Inspector)
GET /api/inspections - Get all inspections
GET /api/inspections/:id - Get inspection by ID
GET /api/inspections/part/:partId - Get part inspection history
GET /api/inspections/defects - Get defect reports
GET /api/inspections/schedule - Get inspection schedule
QR Codes
POST /api/qr/generate - Generate QR code
POST /api/qr/scan - Scan QR code
GET /api/qr/:type/:id - Get existing QR code
File Upload
POST /api/upload/inspection-photos - Upload inspection photos (Inspector)
DELETE /api/upload/inspection-photos/:filename - Delete photo
GET /api/upload/inspection-photos/:filename - Serve photo
Installation
Clone the repository

git clone <repository-url>
cd server
Install dependencies

npm install
Set up environment variables

cp env.example .env
Edit .env file with your configuration:

PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/irfis
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:5173
Start MongoDB

# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
Run the server

# Development
npm run dev

# Production
npm run build
npm start
Database Schema
Users
id: Unique user identifier (YYROLENUMBERS format)
firstName, lastName: User name
role: User role (admin, vendor, depot-staff, track-worker, inspector)
dateOfBirth: Date of birth
password: Hashed password
isFirstLogin: Boolean flag
Lots
id: Unique lot identifier
partName: Name of the part
factoryName: Manufacturer name
lotNumber: Lot number
supplyDate, manufacturingDate: Important dates
warrantyPeriod: Warranty duration
status: pending, verified, rejected
vendorId: Reference to vendor user
Parts
id: Unique part identifier
lotId: Reference to parent lot
partName, factoryName, lotNumber: Part details
manufacturingDate, supplyDate: Dates
warrantyExpiryDate: Calculated warranty expiry
isInstalled: Installation status
installationData: Location and installation details
Inspections
id: Unique inspection identifier
partId: Reference to inspected part
inspectorId: Reference to inspector user
condition: good, worn, replace
notes: Inspection notes
photos: Array of photo filenames
inspectionDate: Date of inspection
nextInspectionDue: Next inspection date
User Roles & Permissions
Admin
Full system access
User management
View all data
Vendor
Create and manage lots
Generate parts from lots
View own lots and parts
Depot Staff
Scan and verify lots
Update lot status
View all lots
Track Worker
Scan parts for installation
Install parts with location data
View installation history
Inspector
Scan parts for inspection
Record condition assessments
Upload inspection photos
View inspection history
Security Features
JWT-based authentication
Password hashing with bcrypt
Role-based access control
File upload validation
Rate limiting
CORS protection
Helmet security headers
Input validation with Joi
Development
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
API Documentation
The API follows RESTful conventions and returns JSON responses:

{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
Error responses:

{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
Contributing
Fork the repository
Create a feature branch
Make your changes
Add tests if applicable
Submit a pull request
License
MIT License - see LICENSE file for details
