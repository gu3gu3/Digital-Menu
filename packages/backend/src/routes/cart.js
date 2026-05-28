const express = require('express');
const { prisma, Prisma } = require('../config/database');
const Joi = require('joi');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

const findOrCreateCart = async (sesionId) => {
  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: {
      restaurante: true,
      mesa: true
    }
  });

  if (!sesion) throw new Error('Sesión no válida');

  // Check if session is active
  if (!sesion.activa) {
    throw new Error('La sesión está cerrada. No se pueden realizar nuevos pedidos.');
  }

  // Look for any active order in this SESION
  const activeOrder = await prisma.orden.findFirst({
    where: {
      sesionId: sesion.id,
      estado: {
        in: ['CARRITO', 'ENVIADA', 'RECIBIDA', 'CONFIRMADA', 'EN_PREPARACION', 'LISTA']
      }
    },
    include: { 
      items: { include: { producto: true } },
      mesa: true,
      sesion: true 
    },
    orderBy: { createdAt: 'desc' }
  });

  // If there's an active order, handle it based on state and session validity
  if (activeOrder) {
    // If it's in CARRITO state, anyone can add to it
    if (activeOrder.estado === 'CARRITO') {
      // Update the order to link it to the current active session if it was orphaned
      if (!activeOrder.sesionId || (activeOrder.sesion && !activeOrder.sesion.activa)) {
        await prisma.orden.update({
          where: { id: activeOrder.id },
          data: { sesionId: sesionId }
        });
      }
      return activeOrder;
    }
    // If it's beyond CARRITO state, check if we can still add items
    if (['ENVIADA', 'RECIBIDA', 'CONFIRMADA', 'EN_PREPARACION', 'LISTA'].includes(activeOrder.estado)) {
      // Update the order to link it to the current active session for tracking
      if (!activeOrder.sesionId || (activeOrder.sesion && !activeOrder.sesion.activa)) {
        await prisma.orden.update({
          where: { id: activeOrder.id },
          data: { sesionId: sesionId }
        });
      }
      return activeOrder;
    }
  }

  // Retry logic to handle race conditions on order creation
  for (let i = 0; i < 5; i++) {
    try {
      // Use a transaction to ensure atomicity
      return await prisma.$transaction(async (tx) => {
        const lastOrder = await tx.orden.findFirst({
      where: { restauranteId: sesion.restauranteId },
      orderBy: { numeroOrden: 'desc' },
    });
    const newOrderNumber = (lastOrder?.numeroOrden || 0) + 1;

        return await tx.orden.create({
        data: {
          numeroOrden: newOrderNumber,
          estado: 'CARRITO',
          subtotal: 0,
          total: 0,
          restaurante: { connect: { id: sesion.restauranteId } },
          mesa: { connect: { id: sesion.mesaId } },
          sesion: { connect: { id: sesionId } },
        },
        include: { items: { include: { producto: true } } }
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        if (i === 4) throw new Error('No se pudo crear la orden después de varios intentos. Por favor, intenta de nuevo.');
        // Add a small delay before retrying
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        continue;
      } else {
        // For any other error, throw it immediately.
        throw e;
      }
    }
  }
};

const calculateTotals = async (items, restauranteId) => {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  let impuestos = 0;
  let servicio = 0;

  if (restauranteId) {
    const restaurante = await prisma.restaurante.findUnique({ where: { id: restauranteId } });
    if (restaurante && restaurante.configuracion) {
      const config = typeof restaurante.configuracion === 'string' ? JSON.parse(restaurante.configuracion) : restaurante.configuracion;
      if (config.iva) impuestos = subtotal * (config.iva / 100);
      if (config.servicio) servicio = subtotal * (config.servicio / 100);
    }
  }

  const total = subtotal + impuestos + servicio;
  return { subtotal, impuestos, servicio, total };
};

/**
 * @swagger
 * /api/cart/{sesionId}:
 *   get:
 *     summary: Obtener carrito de compras
 *     description: Obtiene o crea un carrito de compras para la sesión especificada
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión de mesa
 *         example: "clm123456789"
 *     responses:
 *       200:
 *         description: Carrito obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Sesión inválida o error en la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:sesionId', async (req, res) => {
  try {
    const cart = await findOrCreateCart(req.params.sesionId);
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:sesionId/add', async (req, res) => {
  const { productoId, cantidad, notas } = req.body;
  const { sesionId } = req.params;

  try {
    const cart = await findOrCreateCart(sesionId);
    const producto = await prisma.producto.findUnique({ where: { id: productoId } });
    if (!producto) throw new Error('Producto no encontrado');

    const existingItem = cart.items.find(item => item.productoId === productoId);

    if (existingItem) {
      await prisma.itemOrden.update({
        where: { id: existingItem.id },
        data: {
          cantidad: existingItem.cantidad + cantidad,
          subtotal: producto.precio * (existingItem.cantidad + cantidad),
        },
      });
    } else {
      await prisma.itemOrden.create({
        data: {
          ordenId: cart.id,
          productoId,
          cantidad,
          notas,
          precioUnitario: producto.precio,
          subtotal: producto.precio * cantidad,
        },
      });
    }

    const updatedCart = await prisma.orden.findUnique({ where: { id: cart.id }, include: { items: true } });
    const newTotals = await calculateTotals(updatedCart.items, cart.restauranteId);
    
    const finalCart = await prisma.orden.update({
        where: { id: cart.id },
        data: { subtotal: newTotals.subtotal, impuestos: newTotals.impuestos, servicio: newTotals.servicio, total: newTotals.total },
        include: { items: { include: { producto: true } } },
    });

    res.json({ success: true, data: finalCart });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:sesionId/item/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { cantidad } = req.body;

    try {
        const item = await prisma.itemOrden.findUnique({ where: { id: itemId }, include: { producto: true } });
        if (!item) throw new Error('Ítem no encontrado');

        if (cantidad <= 0) {
            await prisma.itemOrden.delete({ where: { id: itemId } });
        } else {
            await prisma.itemOrden.update({
                where: { id: itemId },
                data: { cantidad, subtotal: item.producto.precio * cantidad },
            });
        }
        
        const updatedCart = await prisma.orden.findUnique({ where: { id: item.ordenId }, include: { items: true } });
        const newTotals = await calculateTotals(updatedCart.items, updatedCart.restauranteId);

        const finalCart = await prisma.orden.update({
            where: { id: item.ordenId },
            data: { subtotal: newTotals.subtotal, impuestos: newTotals.impuestos, servicio: newTotals.servicio, total: newTotals.total },
            include: { items: { include: { producto: true } } },
        });

        res.json({ success: true, data: finalCart });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});


/**
 * @swagger
 * /api/cart/{sesionId}/confirm:
 *   post:
 *     summary: Confirmar orden
 *     description: Confirma el carrito y lo convierte en una orden enviada al restaurante
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión de mesa
 *         example: "clm123456789"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notas:
 *                 type: string
 *                 description: Notas adicionales para la orden
 *                 example: "Sin cebolla en las hamburguesas"
 *               nombreCliente:
 *                 type: string
 *                 description: Nombre del cliente
 *                 example: "Juan Pérez"
 *               nombreClienteFactura:
 *                 type: string
 *                 description: Nombre para facturación
 *                 example: "Juan Carlos Pérez"
 *     responses:
 *       200:
 *         description: Orden confirmada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orden:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Carrito vacío o error en la confirmación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:sesionId/confirm', async (req, res) => {
  const { sesionId } = req.params;
  const { notas, nombreCliente, nombreClienteFactura, items } = req.body;
  try {
    const cart = await findOrCreateCart(sesionId);
    
    // Procesar items si vienen en el request (Local Cart)
    if (items && Array.isArray(items) && items.length > 0) {
      const clienteActual = nombreClienteFactura || nombreCliente || 'Anónimo';
      
      for (const item of items) {
        const producto = await prisma.producto.findUnique({ where: { id: item.productoId } });
        if (!producto) continue;

        const existingItem = cart.items.find(i => i.productoId === item.productoId);
        
        // Hacemos el binding del usuario que pidió el producto
        const itemNotasStr = item.notas ? `${item.notas} (Por: ${clienteActual})` : `(Por: ${clienteActual})`;

        if (existingItem) {
          await prisma.itemOrden.update({
            where: { id: existingItem.id },
            data: {
              cantidad: existingItem.cantidad + item.cantidad,
              subtotal: producto.precio * (existingItem.cantidad + item.cantidad),
              notas: existingItem.notas ? `${existingItem.notas} | ${itemNotasStr}` : itemNotasStr
            },
          });
        } else {
          await prisma.itemOrden.create({
            data: {
              ordenId: cart.id,
              productoId: item.productoId,
              cantidad: item.cantidad,
              notas: itemNotasStr,
              precioUnitario: producto.precio,
              subtotal: producto.precio * item.cantidad,
            },
          });
        }
      }
      
      // Actualizamos los items del carrito para calcular totales correctamente
      const updatedCartItems = await prisma.itemOrden.findMany({ where: { ordenId: cart.id } });
      cart.items = updatedCartItems;
    }

    if (!cart.items || cart.items.length === 0) throw new Error('El carrito está vacío');
    
    const newTotals = await calculateTotals(cart.items, cart.restauranteId);
    
    // Append customer name and notes to existing ones if any
    let finalNotas = cart.notas || '';
    if (notas) {
      finalNotas = finalNotas ? `${finalNotas}\n---\n${notas}` : notas;
    }
    
    let finalNombreCliente = cart.nombreClienteFactura || '';
    const clienteName = nombreClienteFactura || nombreCliente;
    if (clienteName) {
      // Evitar duplicar el nombre si el mismo cliente confirma 2 veces
      if (!finalNombreCliente.includes(clienteName)) {
        finalNombreCliente = finalNombreCliente ? 
          `${finalNombreCliente}, ${clienteName}` : clienteName;
      }
    }
    
    const confirmedOrder = await prisma.orden.update({
      where: { id: cart.id },
      data: { 
        estado: 'ENVIADA', 
        notas: finalNotas,
        nombreClienteFactura: finalNombreCliente,
        subtotal: newTotals.subtotal,
        impuestos: newTotals.impuestos,
        servicio: newTotals.servicio,
        total: newTotals.total
      },
      include: { 
        items: { include: { producto: true } },
        mesa: true,
        sesion: true
      }
    });
    res.json({ success: true, data: { orden: confirmedOrder } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});



module.exports = router; 