# QR-Driven Lot Workflows - Implementation Guide

## Overview

This implementation adds comprehensive QR-driven lot workflow features to the existing IRFIS (Indian Railways Fittings Identification System). The system enables vendors to generate ephemeral QR codes, while depot staff, track workers, and inspectors can scan these codes to perform various actions with full audit trails.

## Key Features Implemented

### ✅ **Ephemeral QR Code Generation**
- Vendors can generate QR codes that are **never stored in the database**
- QR images are generated in-memory and returned as data URLs
- Optional short-lived tokens for additional security
- Full audit logging of QR generation events

### ✅ **Role-Based Workflows**
- **Vendors**: Generate ephemeral QR codes for their lots
- **Depot Staff**: Scan QR codes, perform sample checks, accept/hold lots
- **Track Workers**: Scan QR codes, record installations, request replacements
- **Inspectors**: Scan QR codes, record inspections with photos

### ✅ **Comprehensive Audit Trails**
- Every action is logged in `lots.auditTrail`
- User actions are tracked in `users.history`
- Includes timestamps, actor information, and metadata

### ✅ **Camera Scanner Component**
- Browser-based QR code scanning using device camera
- Fallback manual input for lot IDs
- Mobile-friendly interface

## API Endpoints Added

### QR Generation
```http
POST /api/lots/:lotId/generate-qr
Authorization: Bearer <vendor-token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "lotId": "LOT123",
    "qrData": "{\"type\":\"lot\",\"lotId\":\"LOT123\",...}",
    "qrImageDataUrl": "data:image/png;base64,...",
    "qrToken": "abc123",
    "expiresAt": "2025-09-30T12:34:56Z"
  }
}
```

### Lot Access with Token
```http
GET /api/lots/:lotId?token=<token>
Authorization: Bearer <any-valid-token>
```

### Status Updates
```http
PUT /api/lots/:lotId/status
Authorization: Bearer <depot-staff-token>
Content-Type: application/json

{
  "status": "accepted",
  "notes": "Sample check passed",
  "sampleCheck": {
    "visual": true,
    "dimensions": true,
    "material": true,
    "finish": true
  }
}
```

### Installation Recording
```http
POST /api/lots/:lotId/install
Authorization: Bearer <track-worker-token>
Content-Type: application/json

{
  "location": "Section A",
  "section": "Track 1",
  "installationDate": "2024-01-15T10:30:00Z",
  "notes": "Installation completed"
}
```

### Inspection Recording
```http
POST /api/lots/:lotId/inspection
Authorization: Bearer <inspector-token>
Content-Type: application/json

{
  "condition": "good",
  "notes": "Inspection passed",
  "photos": ["photo1.jpg", "photo2.jpg"],
  "nextInspectionDue": "2024-02-15T10:30:00Z"
}
```

### Replacement Requests
```http
POST /api/lots/:lotId/replacement-request
Authorization: Bearer <track-worker-token>
Content-Type: application/json

{
  "reason": "defective",
  "description": "Part shows signs of wear",
  "photos": ["defect1.jpg"],
  "priority": "high"
}
```

## Database Changes

### New Fields Added

**Lots Collection:**
```javascript
{
  // ... existing fields
  auditTrail: [{
    timestamp: Date,
    actorId: String,
    actorName: String,
    action: String,
    details: String,
    metadata: Mixed
  }],
  qrTokens: [{
    token: String,
    generatedAt: Date,
    expiresAt: Date,
    generatedBy: String
  }]
}
```

**Users Collection:**
```javascript
{
  // ... existing fields
  history: [{
    timestamp: Date,
    action: String,
    targetType: String, // 'lot', 'part', 'inspection', 'installation'
    targetId: String,
    details: String,
    metadata: Mixed
  }]
}
```

**New Collection - ReplacementRequests:**
```javascript
{
  id: String,
  lotId: String,
  partId: String, // optional
  requestedBy: String,
  requestedByRole: String,
  reason: String,
  description: String,
  photos: [String],
  status: String, // 'pending', 'approved', 'rejected', 'completed'
  reviewedBy: String, // optional
  reviewedAt: Date, // optional
  reviewNotes: String, // optional
  priority: String, // 'low', 'medium', 'high', 'urgent'
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Components Added

### QrModal Component
- Displays ephemeral QR codes
- Print functionality with optimized layout
- Download PNG functionality
- Copy payload to clipboard
- Clear warning about ephemeral nature

### CameraScanner Component
- Browser camera integration
- QR code scanning (mock implementation)
- Manual input fallback
- Mobile-responsive design

### Updated VendorDashboard
- Integrated QrModal for QR generation
- Uses new ephemeral QR API endpoint

### New DepotDashboard
- Camera scanner integration
- Sample check form
- Accept/Hold lot functionality
- Real-time lot status updates

## Installation & Setup

### 1. Run Database Migration
```bash
cd server
npm run migrate:audit
```

### 2. Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd "../irfis-railway-fittings-identification-system-main 2"
npm install
```

### 3. Start Development Servers
```bash
# Backend (Terminal 1)
cd server
npm run dev

# Frontend (Terminal 2)
cd "../irfis-railway-fittings-identification-system-main 2"
npm run dev
```

### 4. Run Tests
```bash
cd server
npm test
npm run test:coverage
```

## Security Features

### ✅ **Ephemeral QR Images**
- QR images are **never stored** in database
- Generated in-memory and returned as data URLs
- No persistent image storage

### ✅ **Token-Based Access**
- Optional short-lived tokens (24 hours TTL)
- Token validation with expiration checks
- Secure token generation using UUID

### ✅ **Role-Based Access Control**
- Vendors can only generate QR for their own lots
- Depot staff can only update lot status
- Track workers can only record installations
- Inspectors can only record inspections

### ✅ **Audit Trail Security**
- All actions are logged with timestamps
- Actor identification and authentication
- Immutable audit records

## Testing

### Unit Tests
- QR generation without database storage
- Token validation and expiration
- Role-based access control
- Audit trail creation
- Status update workflows

### Integration Tests
- Full workflow from QR generation to lot acceptance
- Cross-role permission validation
- Database migration verification

### E2E Test Scenarios
1. **Vendor generates QR → Depot scans and accepts**
2. **Track worker scans QR → Records installation**
3. **Inspector scans QR → Records inspection**
4. **Track worker requests replacement**

## Migration Guide

### For Existing Data
The migration script automatically:
- Adds `auditTrail` and `qrTokens` arrays to existing lots
- Adds `history` arrays to existing users
- Creates necessary database indexes
- Preserves all existing data

### Backward Compatibility
- Existing QR code functionality remains intact
- Old QR codes continue to work
- Gradual migration to new ephemeral system

## Performance Considerations

### Database Indexes
- `lots.auditTrail.timestamp` - Fast audit queries
- `lots.qrTokens.token` - Fast token lookups
- `lots.qrTokens.expiresAt` - Efficient cleanup
- `users.history.timestamp` - Fast user activity queries

### Memory Management
- QR images generated in-memory only
- Automatic cleanup of expired tokens
- Efficient audit trail storage

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Check browser permissions
   - Use manual input fallback
   - Verify HTTPS for camera access

2. **QR token expired**
   - Generate new QR code
   - Check system time synchronization

3. **Permission denied**
   - Verify user role and authentication
   - Check lot ownership (for vendors)

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
DEBUG=irfis:*
```

## Future Enhancements

### Planned Features
- Real QR code scanning library integration
- Bulk QR generation for multiple lots
- QR code analytics and usage tracking
- Mobile app integration
- Offline QR scanning capability

### Performance Optimizations
- QR code caching strategies
- Database query optimization
- Real-time updates via WebSocket
- Progressive web app features

## Support

For issues or questions:
1. Check the test suite for expected behavior
2. Review audit trails for action tracking
3. Verify role permissions and authentication
4. Check database migration status

---

**Note**: This implementation follows the ephemeral QR rule strictly - no QR images are ever stored in the database. All QR codes are generated on-demand and returned to the frontend for immediate use.
