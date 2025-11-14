import request from 'supertest';
import { app } from '../src/index';
import { connectDatabase } from '../src/config/database';
import { Lot } from '../src/models/Lot';
import { User } from '../src/models/User';
import jwt from 'jsonwebtoken';

describe('QR-Driven Lot Workflows', () => {
  let vendorToken: string;
  let depotStaffToken: string;
  let trackWorkerToken: string;
  let inspectorToken: string;
  let testLot: any;
  let testVendor: any;

  beforeAll(async () => {
    await connectDatabase();
    
    // Create test users
    testVendor = new User({
      id: '24VEN999',
      firstName: 'Test',
      lastName: 'Vendor',
      role: 'vendor',
      dateOfBirth: '1990-01-01',
      password: 'testpass123',
      isFirstLogin: false
    });
    await testVendor.save();

    const depotStaff = new User({
      id: '24DEP999',
      firstName: 'Test',
      lastName: 'Depot',
      role: 'depot-staff',
      dateOfBirth: '1990-01-01',
      password: 'testpass123',
      isFirstLogin: false
    });
    await depotStaff.save();

    const trackWorker = new User({
      id: '24TRK999',
      firstName: 'Test',
      lastName: 'Worker',
      role: 'track-worker',
      dateOfBirth: '1990-01-01',
      password: 'testpass123',
      isFirstLogin: false
    });
    await trackWorker.save();

    const inspector = new User({
      id: '24INS999',
      firstName: 'Test',
      lastName: 'Inspector',
      role: 'inspector',
      dateOfBirth: '1990-01-01',
      password: 'testpass123',
      isFirstLogin: false
    });
    await inspector.save();

    // Generate tokens
    const jwtSecret = process.env.JWT_SECRET || 'test-secret';
    vendorToken = jwt.sign({ id: testVendor.id, role: 'vendor' }, jwtSecret);
    depotStaffToken = jwt.sign({ id: depotStaff.id, role: 'depot-staff' }, jwtSecret);
    trackWorkerToken = jwt.sign({ id: trackWorker.id, role: 'track-worker' }, jwtSecret);
    inspectorToken = jwt.sign({ id: inspector.id, role: 'inspector' }, jwtSecret);

    // Create test lot
    testLot = new Lot({
      id: 'LOT999999',
      partName: 'Test Part',
      factoryName: 'Test Factory',
      lotNumber: 'TEST001',
      supplyDate: new Date(),
      manufacturingDate: new Date(),
      warrantyPeriod: '5 years',
      status: 'pending',
      vendorId: testVendor.id,
      auditTrail: [],
      qrTokens: []
    });
    await testLot.save();
  });

  afterAll(async () => {
    // Cleanup
    await Lot.deleteMany({ id: { $regex: /^LOT999|^TEST/ } });
    await User.deleteMany({ id: { $regex: /^24(VEN|DEP|TRK|INS)999/ } });
  });

  describe('POST /api/lots/:lotId/generate-qr', () => {
    it('should generate ephemeral QR code for vendor', async () => {
      const response = await request(app)
        .post(`/api/lots/${testLot.id}/generate-qr`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('lotId', testLot.id);
      expect(response.body.data).toHaveProperty('qrData');
      expect(response.body.data).toHaveProperty('qrImageDataUrl');
      expect(response.body.data).toHaveProperty('qrToken');
      expect(response.body.data).toHaveProperty('expiresAt');

      // Verify QR image is not stored in database
      const updatedLot = await Lot.findOne({ id: testLot.id });
      expect(updatedLot.qrCode).toBeUndefined(); // Should not store image
      expect(updatedLot.qrTokens).toHaveLength(1); // Should store token
      expect(updatedLot.auditTrail).toHaveLength(1); // Should have audit entry
    });

    it('should reject non-vendor users', async () => {
      const response = await request(app)
        .post(`/api/lots/${testLot.id}/generate-qr`)
        .set('Authorization', `Bearer ${depotStaffToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should reject vendor accessing other vendor lots', async () => {
      const otherVendor = new User({
        id: '24VEN888',
        firstName: 'Other',
        lastName: 'Vendor',
        role: 'vendor',
        dateOfBirth: '1990-01-01',
        password: 'testpass123',
        isFirstLogin: false
      });
      await otherVendor.save();

      const otherVendorToken = jwt.sign({ id: otherVendor.id, role: 'vendor' }, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .post(`/api/lots/${testLot.id}/generate-qr`)
        .set('Authorization', `Bearer ${otherVendorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');

      await User.deleteOne({ id: otherVendor.id });
    });
  });

  describe('GET /api/lots/:lotId?token=', () => {
    it('should access lot with valid token', async () => {
      // First generate a QR code
      const qrResponse = await request(app)
        .post(`/api/lots/${testLot.id}/generate-qr`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      const token = qrResponse.body.data.qrToken;

      // Access lot with token
      const response = await request(app)
        .get(`/api/lots/${testLot.id}?token=${token}`)
        .set('Authorization', `Bearer ${depotStaffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testLot.id);
    });

    it('should reject expired token', async () => {
      // Create a lot with expired token
      const expiredLot = new Lot({
        id: 'LOT888888',
        partName: 'Expired Test Part',
        factoryName: 'Test Factory',
        lotNumber: 'EXPIRED001',
        supplyDate: new Date(),
        manufacturingDate: new Date(),
        warrantyPeriod: '5 years',
        status: 'pending',
        vendorId: testVendor.id,
        auditTrail: [],
        qrTokens: [{
          token: 'expired123',
          generatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
          expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          generatedBy: testVendor.id
        }]
      });
      await expiredLot.save();

      const response = await request(app)
        .get(`/api/lots/${expiredLot.id}?token=expired123`)
        .set('Authorization', `Bearer ${depotStaffToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');

      await Lot.deleteOne({ id: expiredLot.id });
    });
  });

  describe('PUT /api/lots/:id/status', () => {
    it('should update lot status with audit trail', async () => {
      const response = await request(app)
        .put(`/api/lots/${testLot.id}/status`)
        .set('Authorization', `Bearer ${depotStaffToken}`)
        .send({
          status: 'accepted',
          notes: 'Sample check passed',
          sampleCheck: {
            visual: true,
            dimensions: true,
            material: true,
            finish: true
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('accepted');

      // Verify audit trail
      const updatedLot = await Lot.findOne({ id: testLot.id });
      expect(updatedLot.auditTrail).toHaveLength(2); // QR generation + status update
      expect(updatedLot.auditTrail[1].action).toBe('status_updated');
      expect(updatedLot.auditTrail[1].metadata.newStatus).toBe('accepted');

      // Verify user history
      const depotUser = await User.findOne({ id: '24DEP999' });
      expect(depotUser.history).toHaveLength(1);
      expect(depotUser.history[0].action).toBe('update_lot_status');
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .put(`/api/lots/${testLot.id}/status`)
        .set('Authorization', `Bearer ${depotStaffToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid status');
    });
  });

  describe('POST /api/lots/:lotId/install', () => {
    it('should record installation for track worker', async () => {
      const response = await request(app)
        .post(`/api/lots/${testLot.id}/install`)
        .set('Authorization', `Bearer ${trackWorkerToken}`)
        .send({
          location: 'Section A',
          section: 'Track 1',
          installationDate: new Date().toISOString(),
          notes: 'Installation completed successfully'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify audit trail
      const updatedLot = await Lot.findOne({ id: testLot.id });
      const installEntry = updatedLot.auditTrail.find(entry => entry.action === 'installation_recorded');
      expect(installEntry).toBeDefined();
      expect(installEntry.metadata.location).toBe('Section A');
    });

    it('should reject non-track-worker users', async () => {
      const response = await request(app)
        .post(`/api/lots/${testLot.id}/install`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          location: 'Section A',
          section: 'Track 1'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/lots/:lotId/inspection', () => {
    it('should record inspection for inspector', async () => {
      const response = await request(app)
        .post(`/api/lots/${testLot.id}/inspection`)
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          condition: 'good',
          notes: 'Inspection passed',
          photos: ['photo1.jpg', 'photo2.jpg'],
          nextInspectionDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify audit trail
      const updatedLot = await Lot.findOne({ id: testLot.id });
      const inspectionEntry = updatedLot.auditTrail.find(entry => entry.action === 'inspection_recorded');
      expect(inspectionEntry).toBeDefined();
      expect(inspectionEntry.metadata.condition).toBe('good');
    });

    it('should reject invalid condition', async () => {
      const response = await request(app)
        .post(`/api/lots/${testLot.id}/inspection`)
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          condition: 'invalid_condition'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid condition is required');
    });
  });

  describe('POST /api/lots/:lotId/replacement-request', () => {
    it('should create replacement request', async () => {
      const response = await request(app)
        .post(`/api/lots/${testLot.id}/replacement-request`)
        .set('Authorization', `Bearer ${trackWorkerToken}`)
        .send({
          reason: 'defective',
          description: 'Part shows signs of wear',
          photos: ['defect1.jpg'],
          priority: 'high'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reason).toBe('defective');
      expect(response.body.data.status).toBe('pending');

      // Verify audit trail
      const updatedLot = await Lot.findOne({ id: testLot.id });
      const replacementEntry = updatedLot.auditTrail.find(entry => entry.action === 'replacement_requested');
      expect(replacementEntry).toBeDefined();
      expect(replacementEntry.metadata.reason).toBe('defective');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post(`/api/lots/${testLot.id}/replacement-request`)
        .set('Authorization', `Bearer ${trackWorkerToken}`)
        .send({
          reason: 'defective'
          // Missing description
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });
});
