const express = require('express');
const { prisma } = require('../config/database');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Validation schemas
const addToCartSchema = Joi.object({
  productoId: Joi.string().required(),
  cantidad: Joi.number().integer().min(1).max(50).required(),
  notas: Joi.string().allow('').optional().max(500)
});

const updateCartItemSchema = Joi.object({
  cantidad: Joi.number().integer().min(0).max(50).required(),
  notas: Joi.string().allow('').optional().max(500)
});

const confirmOrderSchema = Joi.object({
  nombreClienteFactura: Joi.string().allow('').optional().max(100),
  notas: Joi.string().allow('').optional().max(1000)
});

// Utility functions
const calculateCartTotals = (cartItems) => {
  const subtotal = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.precio) * item.cantidad);
  }, 0);
  
  return {
    subtotal: subtotal.toFixed(2),
    total: subtotal.toFixed(2) // Por ahora sin impuestos/descuentos
  };
};

const validateSession = async (sessionToken) => {
  const sesion = await prisma.sesion.findUnique({
    where: { sessionToken },
    include: {
      mesa: { select: { id: true, numero: true, activa: true } },
      restaurante: { select: { id: true, activo: true } }
    }
  });

  if (!sesion) {
    throw new Error('Sesión no encontrada');
  }

  if (sesion.estado !== 'ACTIVA') {
    throw new Error('La sesión no está activa');
  }

  if (!sesion.mesa.activa || !sesion.restaurante.activo) {
    throw new Error('Mesa o restaurante no disponible');
  }

  return sesion;
};

// @desc    Get cart contents
// @route   GET /api/cart/:sessionToken
// @access  Public
const getCart = async (req, res) => {
  try {
    const { sessionToken } = req.params;
    
    const sesion = await validateSession(sessionToken);

    // Get cart from session metadata
    const cartItems = sesion.metadata?.cart || [];
    const totals = calculateCartTotals(cartItems);

    // Update last activity
    await prisma.sesion.update({
      where: { id: sesion.id },
      data: { ultimaActividad: new Date() }
    });

    res.json({
      success: true,
      data: {
        cart: cartItems,
        totals,
        itemCount: cartItems.reduce((count, item) => count + item.cantidad, 0)
      }
    });

  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(error.message.includes('no encontrada') || error.message.includes('no está activa') ? 404 : 500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/:sessionToken/add
// @access  Public
const addToCart = async (req, res) => {
  try {
    const { sessionToken } = req.params;
    const { error, value } = addToCartSchema.validate(req.body);

    if (error) {
      console.error('Validation error in addToCart:', error.details[0].message);
      console.error('Request body:', req.body);
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { productoId, cantidad, notas } = value;

    const sesion = await validateSession(sessionToken);

    // Validate product exists and is available
    const producto = await prisma.producto.findFirst({
      where: {
        id: productoId,
        restauranteId: sesion.restauranteId,
        disponible: true
      },
      include: {
        categoria: { select: { nombre: true, activa: true } }
      }
    });

    if (!producto || !producto.categoria.activa) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado o no disponible'
      });
    }

    // Get current cart
    const currentCart = sesion.metadata?.cart || [];
    
    // Check if item already exists in cart
    const existingItemIndex = currentCart.findIndex(item => item.productoId === productoId);
    
    let updatedCart;
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedCart = [...currentCart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        cantidad: updatedCart[existingItemIndex].cantidad + cantidad,
        notas: notas || updatedCart[existingItemIndex].notas,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new item
      const newItem = {
        id: uuidv4(),
        productoId,
        nombre: producto.nombre,
        precio: producto.precio.toString(),
        cantidad,
        notas: notas || '',
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedCart = [...currentCart, newItem];
    }

    // Calculate totals
    const totals = calculateCartTotals(updatedCart);

    // Update session with new cart
    const updatedSession = await prisma.sesion.update({
      where: { id: sesion.id },
      data: {
        metadata: {
          ...sesion.metadata,
          cart: updatedCart,
          totals
        },
        ultimaActividad: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        cart: updatedCart,
        totals,
        itemCount: updatedCart.reduce((count, item) => count + item.cantidad, 0)
      },
      message: 'Producto agregado al carrito'
    });

  } catch (error) {
    console.error('Error agregando al carrito:', error);
    res.status(error.message.includes('no encontrada') || error.message.includes('no está activa') ? 404 : 500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/:sessionToken/item/:itemId
// @access  Public
const updateCartItem = async (req, res) => {
  try {
    const { sessionToken, itemId } = req.params;
    const { error, value } = updateCartItemSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { cantidad, notas } = value;

    const sesion = await validateSession(sessionToken);

    // Get current cart
    const currentCart = sesion.metadata?.cart || [];
    
    // Find item to update
    const itemIndex = currentCart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item no encontrado en el carrito'
      });
    }

    let updatedCart;
    if (cantidad === 0) {
      // Remove item from cart
      updatedCart = currentCart.filter(item => item.id !== itemId);
    } else {
      // Update item
      updatedCart = [...currentCart];
      updatedCart[itemIndex] = {
        ...updatedCart[itemIndex],
        cantidad,
        notas: notas !== undefined ? notas : updatedCart[itemIndex].notas,
        updatedAt: new Date().toISOString()
      };
    }

    // Calculate totals
    const totals = calculateCartTotals(updatedCart);

    // Update session
    await prisma.sesion.update({
      where: { id: sesion.id },
      data: {
        metadata: {
          ...sesion.metadata,
          cart: updatedCart,
          totals
        },
        ultimaActividad: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        cart: updatedCart,
        totals,
        itemCount: updatedCart.reduce((count, item) => count + item.cantidad, 0)
      },
      message: cantidad === 0 ? 'Item removido del carrito' : 'Item actualizado'
    });

  } catch (error) {
    console.error('Error actualizando item del carrito:', error);
    res.status(error.message.includes('no encontrada') || error.message.includes('no está activa') ? 404 : 500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:sessionToken/item/:itemId
// @access  Public
const removeFromCart = async (req, res) => {
  try {
    const { sessionToken, itemId } = req.params;

    const sesion = await validateSession(sessionToken);

    // Get current cart
    const currentCart = sesion.metadata?.cart || [];
    
    // Remove item
    const updatedCart = currentCart.filter(item => item.id !== itemId);
    
    if (updatedCart.length === currentCart.length) {
      return res.status(404).json({
        success: false,
        error: 'Item no encontrado en el carrito'
      });
    }

    // Calculate totals
    const totals = calculateCartTotals(updatedCart);

    // Update session
    await prisma.sesion.update({
      where: { id: sesion.id },
      data: {
        metadata: {
          ...sesion.metadata,
          cart: updatedCart,
          totals
        },
        ultimaActividad: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        cart: updatedCart,
        totals,
        itemCount: updatedCart.reduce((count, item) => count + item.cantidad, 0)
      },
      message: 'Item removido del carrito'
    });

  } catch (error) {
    console.error('Error removiendo del carrito:', error);
    res.status(error.message.includes('no encontrada') || error.message.includes('no está activa') ? 404 : 500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/:sessionToken/clear
// @access  Public
const clearCart = async (req, res) => {
  try {
    const { sessionToken } = req.params;

    const sesion = await validateSession(sessionToken);

    // Update session with empty cart
    await prisma.sesion.update({
      where: { id: sesion.id },
      data: {
        metadata: {
          ...sesion.metadata,
          cart: [],
          totals: { subtotal: '0.00', total: '0.00' }
        },
        ultimaActividad: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        cart: [],
        totals: { subtotal: '0.00', total: '0.00' },
        itemCount: 0
      },
      message: 'Carrito vaciado'
    });

  } catch (error) {
    console.error('Error vaciando carrito:', error);
    res.status(error.message.includes('no encontrada') || error.message.includes('no está activa') ? 404 : 500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

// @desc    Confirm order from cart
// @route   POST /api/cart/:sessionToken/confirm
// @access  Public
const confirmOrder = async (req, res) => {
  try {
    const { sessionToken } = req.params;
    const { error, value } = confirmOrderSchema.validate(req.body);

    if (error) {
      console.error('Validation error in confirmOrder:', error.details[0].message);
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { nombreClienteFactura, notas } = value;

    const sesion = await validateSession(sessionToken);

    // Get cart from session
    const cartItems = sesion.metadata?.cart || [];
    
    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El carrito está vacío'
      });
    }

    // Validate all products are still available
    for (const item of cartItems) {
      const producto = await prisma.producto.findFirst({
        where: {
          id: item.productoId,
          disponible: true
        }
      });

      if (!producto) {
        return res.status(400).json({
          success: false,
          error: `El producto "${item.nombre}" ya no está disponible`
        });
      }
    }

    // Generate order number
    const timestamp = Date.now();
    const numeroOrden = `ORD-${sesion.mesa.numero}-${timestamp}`;

    // Calculate totals
    const totals = calculateCartTotals(cartItems);

    // Create order
    const orden = await prisma.orden.create({
      data: {
        numeroOrden,
        nombreClienteFactura,
        mesaId: sesion.mesaId,
        restauranteId: sesion.restauranteId,
        sesionId: sesion.id,
        subtotal: parseFloat(totals.subtotal),
        total: parseFloat(totals.total),
        notas,
        items: {
          create: cartItems.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: parseFloat(item.precio),
            subtotal: parseFloat(item.precio) * item.cantidad,
            notas: item.notas
          }))
        }
      },
      include: {
        items: {
          include: {
            producto: {
              select: { nombre: true }
            }
          }
        }
      }
    });

    // Clear cart from session
    await prisma.sesion.update({
      where: { id: sesion.id },
      data: {
        metadata: {
          ...sesion.metadata,
          cart: [],
          totals: { subtotal: '0.00', total: '0.00' },
          lastOrderId: orden.id
        },
        ultimaActividad: new Date()
      }
    });

    res.json({
      success: true,
      data: { orden },
      message: 'Pedido confirmado exitosamente'
    });

  } catch (error) {
    console.error('=== ERROR IN CONFIRM ORDER ===');
    console.error('Error confirmando pedido:', error);
    console.error('Error stack:', error.stack);
    res.status(error.message.includes('no encontrada') || error.message.includes('no está activa') ? 404 : 500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

// Routes
router.get('/:sessionToken', getCart);
router.post('/:sessionToken/add', addToCart);
router.put('/:sessionToken/item/:itemId', updateCartItem);
router.delete('/:sessionToken/item/:itemId', removeFromCart);
router.delete('/:sessionToken/clear', clearCart);
router.post('/:sessionToken/confirm', confirmOrder);

module.exports = router; 