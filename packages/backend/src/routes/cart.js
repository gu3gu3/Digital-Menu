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

  // Look for any active order in this MESA (not just this session)
  const activeOrder = await prisma.orden.findFirst({
    where: {
      mesaId: sesion.mesaId,
      restauranteId: sesion.restauranteId,
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
    if (['ENVIADA', 'RECIBIDA', 'CONFIRMADA'].includes(activeOrder.estado)) {
      // Update the order to link it to the current active session for tracking
      if (!activeOrder.sesionId || (activeOrder.sesion && !activeOrder.sesion.activa)) {
        await prisma.orden.update({
          where: { id: activeOrder.id },
          data: { sesionId: sesionId }
        });
      }
      return activeOrder;
    }
    // If it's in preparation or later stages, don't allow new items
    throw new Error('Ya hay una orden en preparación en esta mesa. Por favor espera a que se complete antes de realizar un nuevo pedido.');
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

const calculateTotals = (items) => {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  return { subtotal, total: subtotal }; // Simplified totals
};

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
    const newTotals = calculateTotals(updatedCart.items);
    
    const finalCart = await prisma.orden.update({
        where: { id: cart.id },
        data: { subtotal: newTotals.subtotal, total: newTotals.total },
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
        const newTotals = calculateTotals(updatedCart.items);

        const finalCart = await prisma.orden.update({
            where: { id: item.ordenId },
            data: { subtotal: newTotals.subtotal, total: newTotals.total },
            include: { items: { include: { producto: true } } },
        });

        res.json({ success: true, data: finalCart });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});


router.post('/:sesionId/confirm', async (req, res) => {
  const { sesionId } = req.params;
  const { notas, nombreCliente, nombreClienteFactura } = req.body;
  try {
    const cart = await findOrCreateCart(sesionId);
    if (cart.items.length === 0) throw new Error('El carrito está vacío');
    
    // Append customer name and notes to existing ones if any
    let finalNotas = cart.notas || '';
    if (notas) {
      finalNotas = finalNotas ? `${finalNotas}\n---\n${notas}` : notas;
    }
    
    let finalNombreCliente = cart.nombreClienteFactura || '';
    const clienteName = nombreClienteFactura || nombreCliente;
    if (clienteName) {
      finalNombreCliente = finalNombreCliente ? 
        `${finalNombreCliente}, ${clienteName}` : clienteName;
    }
    
    const confirmedOrder = await prisma.orden.update({
      where: { id: cart.id },
      data: { 
        estado: 'ENVIADA', 
        notas: finalNotas,
        nombreClienteFactura: finalNombreCliente
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