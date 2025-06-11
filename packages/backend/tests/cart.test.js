const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Create test app without starting server
const createTestApp = () => {
  const app = express();
  
  // Basic middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Import routes
  const sessionRoutes = require('../src/routes/sessions');
  const cartRoutes = require('../src/routes/cart');
  
  // Register routes
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/cart', cartRoutes);
  
  return app;
};

describe('Cart API', () => {
  let testData;
  let sessionToken;
  let producto1, producto2;
  let app;

  beforeEach(async () => {
    app = createTestApp();
    testData = await global.createTestData();

    // Create test products
    const categoria = await global.testPrisma.categoria.create({
      data: {
        nombre: 'Platos Principales',
        descripcion: 'Categoría de prueba',
        restauranteId: testData.restaurante.id
      }
    });

    producto1 = await global.testPrisma.producto.create({
      data: {
        nombre: 'Ceviche de Pescado',
        descripcion: 'Ceviche fresco',
        precio: 25.50,
        categoriaId: categoria.id,
        restauranteId: testData.restaurante.id,
        disponible: true
      }
    });

    producto2 = await global.testPrisma.producto.create({
      data: {
        nombre: 'Arroz con Mariscos',
        descripcion: 'Arroz con mariscos frescos',
        precio: 35.00,
        categoriaId: categoria.id,
        restauranteId: testData.restaurante.id,
        disponible: true
      }
    });

    // Create a session
    const sessionResponse = await request(app)
      .post('/api/sessions')
      .send({
        mesaNumero: '1',
        restauranteSlug: 'test-restaurant',
        clienteNombre: 'Test Client'
      });

    // Debug response
    if (!sessionResponse.body.success) {
      console.error('Session creation failed:', sessionResponse.body);
      throw new Error(`Failed to create session: ${sessionResponse.body.error}`);
    }

    sessionToken = sessionResponse.body.data.sesion.sessionToken;
  });

  describe('GET /api/cart/:sessionToken', () => {
    it('should get empty cart initially', async () => {
      const response = await request(app)
        .get(`/api/cart/${sessionToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toEqual([]);
      expect(response.body.data.totals).toEqual({
        subtotal: '0.00',
        total: '0.00'
      });
      expect(response.body.data.itemCount).toBe(0);
    });

    it('should return 404 for invalid session token', async () => {
      const response = await request(app)
        .get('/api/cart/invalid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Sesión no encontrada');
    });
  });

  describe('POST /api/cart/:sessionToken/add', () => {
    it('should add item to cart', async () => {
      const itemData = {
        productoId: producto1.id,
        cantidad: 2,
        notas: 'Sin cebolla'
      };

      const response = await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send(itemData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toHaveLength(1);
      expect(response.body.data.cart[0]).toMatchObject({
        productoId: producto1.id,
        nombre: 'Ceviche de Pescado',
        precio: '25.5',
        cantidad: 2,
        notas: 'Sin cebolla'
      });
      expect(response.body.data.totals.subtotal).toBe('51.00');
      expect(response.body.data.itemCount).toBe(2);
    });

    it('should add quantity to existing item', async () => {
      // Add item first time
      await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto1.id,
          cantidad: 2
        });

      // Add same item again
      const response = await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto1.id,
          cantidad: 1,
          notas: 'Extra limón'
        });

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toHaveLength(1);
      expect(response.body.data.cart[0].cantidad).toBe(3);
      expect(response.body.data.cart[0].notas).toBe('Extra limón');
      expect(response.body.data.totals.subtotal).toBe('76.50');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: 'non-existent-id',
          cantidad: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Producto no encontrado o no disponible');
    });

    it('should not add unavailable product', async () => {
      // Make product unavailable
      await global.testPrisma.producto.update({
        where: { id: producto1.id },
        data: { disponible: false }
      });

      const response = await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto1.id,
          cantidad: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Producto no encontrado o no disponible');
    });
  });

  describe('PUT /api/cart/:sessionToken/item/:itemId', () => {
    let itemId;

    beforeEach(async () => {
      // Add item to cart first
      const response = await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto1.id,
          cantidad: 2
        });
      
      itemId = response.body.data.cart[0].id;
    });

    it('should update cart item quantity', async () => {
      const response = await request(app)
        .put(`/api/cart/${sessionToken}/item/${itemId}`)
        .send({
          cantidad: 3,
          notas: 'Actualizado'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart[0].cantidad).toBe(3);
      expect(response.body.data.cart[0].notas).toBe('Actualizado');
      expect(response.body.data.totals.subtotal).toBe('76.50');
    });

    it('should remove item when quantity is 0', async () => {
      const response = await request(app)
        .put(`/api/cart/${sessionToken}/item/${itemId}`)
        .send({
          cantidad: 0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toHaveLength(0);
      expect(response.body.data.totals.subtotal).toBe('0.00');
      expect(response.body.message).toBe('Item removido del carrito');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put(`/api/cart/${sessionToken}/item/non-existent-id`)
        .send({
          cantidad: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item no encontrado en el carrito');
    });
  });

  describe('DELETE /api/cart/:sessionToken/item/:itemId', () => {
    let itemId;

    beforeEach(async () => {
      // Add item to cart first
      const response = await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto1.id,
          cantidad: 2
        });
      
      itemId = response.body.data.cart[0].id;
    });

    it('should remove item from cart', async () => {
      const response = await request(app)
        .delete(`/api/cart/${sessionToken}/item/${itemId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toHaveLength(0);
      expect(response.body.data.totals.subtotal).toBe('0.00');
      expect(response.body.message).toBe('Item removido del carrito');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete(`/api/cart/${sessionToken}/item/non-existent-id`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item no encontrado en el carrito');
    });
  });

  describe('DELETE /api/cart/:sessionToken/clear', () => {
    beforeEach(async () => {
      // Add multiple items to cart
      await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto1.id,
          cantidad: 2
        });

      await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto2.id,
          cantidad: 1
        });
    });

    it('should clear entire cart', async () => {
      const response = await request(app)
        .delete(`/api/cart/${sessionToken}/clear`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toHaveLength(0);
      expect(response.body.data.totals).toEqual({
        subtotal: '0.00',
        total: '0.00'
      });
      expect(response.body.data.itemCount).toBe(0);
      expect(response.body.message).toBe('Carrito vaciado');
    });
  });

  describe('POST /api/cart/:sessionToken/confirm', () => {
    beforeEach(async () => {
      // Add items to cart
      await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto1.id,
          cantidad: 2,
          notas: 'Sin cebolla'
        });

      await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto2.id,
          cantidad: 1
        });
    });

    it('should confirm order from cart', async () => {
      const orderData = {
        nombreClienteFactura: 'Juan Pérez',
        notas: 'Mesa cerca de la ventana'
      };

      const response = await request(app)
        .post(`/api/cart/${sessionToken}/confirm`)
        .send(orderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orden).toBeDefined();
      expect(response.body.data.orden.numeroOrden).toMatch(/^ORD-1-\d+$/);
      expect(response.body.data.orden.nombreClienteFactura).toBe('Juan Pérez');
      expect(response.body.data.orden.notas).toBe('Mesa cerca de la ventana');
      expect(response.body.data.orden.subtotal).toBe('86.00');
      expect(response.body.data.orden.total).toBe('86.00');
      expect(response.body.data.orden.items).toHaveLength(2);

      // Verify cart is cleared after confirmation
      const cartResponse = await request(app)
        .get(`/api/cart/${sessionToken}`);
      expect(cartResponse.body.data.cart).toHaveLength(0);
    });

    it('should return error for empty cart', async () => {
      // Clear cart first
      await request(app)
        .delete(`/api/cart/${sessionToken}/clear`);

      const response = await request(app)
        .post(`/api/cart/${sessionToken}/confirm`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('El carrito está vacío');
    });

    it('should validate product availability before confirming', async () => {
      // Make one product unavailable
      await global.testPrisma.producto.update({
        where: { id: producto1.id },
        data: { disponible: false }
      });

      const response = await request(app)
        .post(`/api/cart/${sessionToken}/confirm`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('El producto "Ceviche de Pescado" ya no está disponible');
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate totals correctly with multiple items', async () => {
      // Add items with different quantities and prices
      await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto1.id, // $25.50
          cantidad: 3
        });

      await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto2.id, // $35.00
          cantidad: 2
        });

      const response = await request(app)
        .get(`/api/cart/${sessionToken}`);

      expect(response.body.data.totals.subtotal).toBe('146.50'); // (25.50 * 3) + (35.00 * 2)
      expect(response.body.data.itemCount).toBe(5); // 3 + 2
    });

    it('should handle decimal prices correctly', async () => {
      // Update product with decimal price
      await global.testPrisma.producto.update({
        where: { id: producto1.id },
        data: { precio: 12.99 }
      });

      await request(app)
        .post(`/api/cart/${sessionToken}/add`)
        .send({
          productoId: producto1.id,
          cantidad: 3
        });

      const response = await request(app)
        .get(`/api/cart/${sessionToken}`);

      expect(response.body.data.totals.subtotal).toBe('38.97'); // 12.99 * 3
    });
  });
}); 