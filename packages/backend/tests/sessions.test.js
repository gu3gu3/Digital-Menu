const request = require('supertest');
const app = require('../src/index');

describe('Sessions API', () => {
  let testData;

  beforeEach(async () => {
    testData = await global.createTestData();
  });

  describe('POST /api/sessions', () => {
    it('should create a new session when QR is scanned', async () => {
      const sessionData = {
        mesaNumero: '1',
        restauranteSlug: 'test-restaurant',
        clienteNombre: 'Juan Pérez',
        numeroPersonas: 2
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(sessionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sesion).toMatchObject({
        mesaId: testData.mesa.id,
        restauranteId: testData.restaurante.id,
        clienteNombre: 'Juan Pérez',
        numeroPersonas: 2,
        estado: 'ACTIVA'
      });
      expect(response.body.data.sesion.sessionToken).toBeDefined();
      expect(response.body.data.isExisting).toBe(false);
    });

    it('should return existing session if table already has active session', async () => {
      // First, create a session
      const sessionData = {
        mesaNumero: '1',
        restauranteSlug: 'test-restaurant',
        clienteNombre: 'María García'
      };

      const firstResponse = await request(app)
        .post('/api/sessions')
        .send(sessionData)
        .expect(200);

      const firstSessionToken = firstResponse.body.data.sesion.sessionToken;

      // Try to create another session for the same table
      const secondResponse = await request(app)
        .post('/api/sessions')
        .send({
          ...sessionData,
          clienteNombre: 'Pedro López',
          numeroPersonas: 3
        })
        .expect(200);

      expect(secondResponse.body.success).toBe(true);
      expect(secondResponse.body.data.isExisting).toBe(true);
      expect(secondResponse.body.data.sesion.sessionToken).toBe(firstSessionToken);
      // Should update the session with new client info
      expect(secondResponse.body.data.sesion.clienteNombre).toBe('Pedro López');
      expect(secondResponse.body.data.sesion.numeroPersonas).toBe(3);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const sessionData = {
        mesaNumero: '1',
        restauranteSlug: 'non-existent-restaurant'
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(sessionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Restaurante no encontrado o inactivo');
    });

    it('should return 404 for non-existent table', async () => {
      const sessionData = {
        mesaNumero: '999',
        restauranteSlug: 'test-restaurant'
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(sessionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mesa no encontrada o inactiva');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /api/sessions/:token', () => {
    let sessionToken;

    beforeEach(async () => {
      // Create a session first
      const sessionData = {
        mesaNumero: '1',
        restauranteSlug: 'test-restaurant',
        clienteNombre: 'Test Client'
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(sessionData);

      sessionToken = response.body.data.sesion.sessionToken;
    });

    it('should get session by token', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sesion).toMatchObject({
        sessionToken,
        clienteNombre: 'Test Client',
        estado: 'ACTIVA'
      });
      expect(response.body.data.sesion.mesa).toBeDefined();
      expect(response.body.data.sesion.restaurante).toBeDefined();
    });

    it('should update last activity when getting session', async () => {
      const firstResponse = await request(app)
        .get(`/api/sessions/${sessionToken}`)
        .expect(200);

      const firstActivity = firstResponse.body.data.sesion.ultimaActividad;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      const secondResponse = await request(app)
        .get(`/api/sessions/${sessionToken}`)
        .expect(200);

      const secondActivity = secondResponse.body.data.sesion.ultimaActividad;

      expect(new Date(secondActivity).getTime()).toBeGreaterThan(new Date(firstActivity).getTime());
    });

    it('should return 404 for non-existent session token', async () => {
      const response = await request(app)
        .get('/api/sessions/non-existent-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Sesión no encontrada');
    });
  });

  describe('PUT /api/sessions/:token', () => {
    let sessionToken;

    beforeEach(async () => {
      const sessionData = {
        mesaNumero: '1',
        restauranteSlug: 'test-restaurant',
        clienteNombre: 'Test Client'
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(sessionData);

      sessionToken = response.body.data.sesion.sessionToken;
    });

    it('should update session information', async () => {
      const updateData = {
        clienteNombre: 'Updated Client',
        numeroPersonas: 4,
        metadata: { preferences: 'vegetarian' }
      };

      const response = await request(app)
        .put(`/api/sessions/${sessionToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sesion).toMatchObject({
        clienteNombre: 'Updated Client',
        numeroPersonas: 4
      });
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .put('/api/sessions/non-existent-token')
        .send({ clienteNombre: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Sesión no encontrada');
    });

    it('should not allow updating closed sessions', async () => {
      // First close the session
      await request(app)
        .post(`/api/sessions/${sessionToken}/close`)
        .expect(200);

      // Try to update
      const response = await request(app)
        .put(`/api/sessions/${sessionToken}`)
        .send({ clienteNombre: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Solo se pueden actualizar sesiones activas');
    });
  });

  describe('POST /api/sessions/:token/close', () => {
    let sessionToken;

    beforeEach(async () => {
      const sessionData = {
        mesaNumero: '1',
        restauranteSlug: 'test-restaurant'
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(sessionData);

      sessionToken = response.body.data.sesion.sessionToken;
    });

    it('should close an active session', async () => {
      const response = await request(app)
        .post(`/api/sessions/${sessionToken}/close`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sesion.estado).toBe('CERRADA');
      expect(response.body.data.sesion.finSesion).toBeDefined();
    });

    it('should return error when trying to close already closed session', async () => {
      // First close
      await request(app)
        .post(`/api/sessions/${sessionToken}/close`)
        .expect(200);

      // Try to close again
      const response = await request(app)
        .post(`/api/sessions/${sessionToken}/close`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('La sesión ya está cerrada');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .post('/api/sessions/non-existent-token/close')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Sesión no encontrada');
    });
  });

  describe('Session Statistics', () => {
    let adminToken;

    beforeEach(async () => {
      // Mock JWT token for admin
      const jwt = require('jsonwebtoken');
      adminToken = jwt.sign(
        { 
          userId: testData.admin.id, 
          role: 'ADMINISTRADOR',
          restauranteId: testData.restaurante.id 
        },
        process.env.JWT_SECRET
      );

      // Create some test sessions
      await global.testPrisma.sesion.createMany({
        data: [
          {
            mesaId: testData.mesa.id,
            restauranteId: testData.restaurante.id,
            sessionToken: 'token1',
            estado: 'ACTIVA'
          },
          {
            mesaId: testData.mesa.id,
            restauranteId: testData.restaurante.id,
            sessionToken: 'token2',
            estado: 'CERRADA'
          }
        ]
      });
    });

    it('should get session statistics for restaurant admin', async () => {
      const response = await request(app)
        .get('/api/sessions/restaurant/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estadisticas).toBeDefined();
      expect(response.body.data.sesionesHoy).toBeDefined();
      expect(response.body.data.totalSesionesActivas).toBe(1);
    });

    it('should get all sessions for restaurant admin', async () => {
      const response = await request(app)
        .get('/api/sessions/restaurant/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sesiones).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter sessions by estado', async () => {
      const response = await request(app)
        .get('/api/sessions/restaurant/all?estado=ACTIVA')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sesiones).toHaveLength(1);
      expect(response.body.data.sesiones[0].estado).toBe('ACTIVA');
    });

    it('should require authentication for admin endpoints', async () => {
      await request(app)
        .get('/api/sessions/restaurant/stats')
        .expect(401);

      await request(app)
        .get('/api/sessions/restaurant/all')
        .expect(401);
    });
  });
}); 