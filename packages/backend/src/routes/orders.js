const express = require('express');
const { authenticate, requireStaff } = require('../middleware/authMiddleware');
const { prisma } = require('../config/database');

const router = express.Router();

// @desc    Get orders for restaurant staff
// @route   GET /api/orders
// @access  Private (Staff)
const getOrders = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { 
      limit = 50, 
      offset = 0, 
      estado, 
      mesaId, 
      fecha, 
      search 
    } = req.query;

    // Build where clause
    const where = {
      restauranteId: restauranteId
    };

    if (estado) {
      where.estado = estado;
    }

    if (mesaId) {
      where.mesaId = mesaId;
    }

    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(fecha);
      endDate.setDate(endDate.getDate() + 1);
      
      where.fechaOrden = {
        gte: startDate,
        lt: endDate
      };
    }

    // Search functionality
    if (search) {
      where.OR = [
        {
          numeroOrden: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          nombreClienteFactura: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          mesa: {
            numero: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          items: {
            some: {
              producto: {
                nombre: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          }
        }
      ];
    }

    const orders = await prisma.orden.findMany({
      where,
      include: {
        mesa: true,
        sesion: true,
        mesero: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        items: {
          include: {
            producto: true
          }
        }
      },
      orderBy: {
        fechaOrden: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.orden.count({ where });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (Staff)
const getOrder = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { id } = req.params;

    const order = await prisma.orden.findFirst({
      where: {
        id: id,
        restauranteId: restauranteId
      },
      include: {
        mesa: true,
        sesion: true,
        mesero: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        items: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error obteniendo orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Staff)
const updateOrderStatus = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { id } = req.params;
    const { status, notas } = req.body;

    const validStatuses = ['ENVIADA', 'RECIBIDA', 'CONFIRMADA', 'EN_PREPARACION', 'LISTA', 'SERVIDA', 'COMPLETADA', 'CANCELADA'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    const order = await prisma.orden.findFirst({
      where: {
        id: id,
        restauranteId: restauranteId
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    const updatedOrder = await prisma.orden.update({
      where: { id: id },
      data: {
        estado: status,
        notas: notas || order.notas,
        updatedAt: new Date(),
        ...(status === 'COMPLETADA' && { fechaCompletada: new Date() })
      },
      include: {
        mesa: true,
        sesion: true,
        mesero: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        items: {
          include: {
            producto: true
          }
        }
      }
    });

    // Si la orden se marca como COMPLETADA, cerrar la sesión
    if (status === 'COMPLETADA' && updatedOrder.sesion) {
      await prisma.sesion.update({
        where: { id: updatedOrder.sesion.id },
        data: {
          estado: 'CERRADA',
          finSesion: new Date(),
          ultimaActividad: new Date()
        }
      });
    }

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error actualizando estado de orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Assign mesero to order
// @route   PUT /api/orders/:id/assign
// @access  Private (Staff)
const assignMeseroToOrder = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { id } = req.params;
    const { meseroId } = req.body;

    // Verificar que la orden existe y pertenece al restaurante
    const order = await prisma.orden.findFirst({
      where: {
        id: id,
        restauranteId: restauranteId
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Si se proporciona meseroId, verificar que el mesero existe y pertenece al restaurante
    if (meseroId) {
      const mesero = await prisma.usuarioMesero.findFirst({
        where: {
          id: meseroId,
          restauranteId: restauranteId,
          activo: true
        }
      });

      if (!mesero) {
        return res.status(404).json({
          success: false,
          error: 'Mesero no encontrado o inactivo'
        });
      }
    }

    const updatedOrder = await prisma.orden.update({
      where: { id: id },
      data: {
        meseroId: meseroId || null,
        updatedAt: new Date()
      },
      include: {
        mesa: true,
        sesion: true,
        mesero: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        items: {
          include: {
            producto: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error asignando mesero a orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Take order (assign current mesero to order)
// @route   PUT /api/orders/:id/take
// @access  Private (Mesero only)
const takeOrder = async (req, res) => {
  try {
    const { restauranteId, id: meseroId, role } = req.user;
    const { id } = req.params;

    // Solo meseros pueden tomar órdenes
    if (role !== 'MESERO') {
      return res.status(403).json({
        success: false,
        error: 'Solo los meseros pueden tomar órdenes'
      });
    }

    // Verificar que la orden existe y pertenece al restaurante
    const order = await prisma.orden.findFirst({
      where: {
        id: id,
        restauranteId: restauranteId
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar que la orden no esté ya asignada a otro mesero
    if (order.meseroId && order.meseroId !== meseroId) {
      return res.status(400).json({
        success: false,
        error: 'Esta orden ya está asignada a otro mesero'
      });
    }

    const updatedOrder = await prisma.orden.update({
      where: { id: id },
      data: {
        meseroId: meseroId,
        // Si la orden estaba en estado ENVIADA, cambiarla a RECIBIDA
        estado: order.estado === 'ENVIADA' ? 'RECIBIDA' : order.estado,
        updatedAt: new Date()
      },
      include: {
        mesa: true,
        sesion: true,
        mesero: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        items: {
          include: {
            producto: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Orden tomada exitosamente'
    });
  } catch (error) {
    console.error('Error tomando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private (Staff)
const getOrderStats = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { period = 'today' } = req.query;

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }

    const where = {
      restauranteId: restauranteId,
      fechaOrden: {
        gte: startDate,
        lt: endDate
      }
    };

    const [
      total,
      enviadas,
      recibidas,
      confirmadas,
      enPreparacion,
      listas,
      servidas,
      completadas,
      canceladas,
      totalVentas
    ] = await Promise.all([
      prisma.orden.count({ where }),
      prisma.orden.count({ where: { ...where, estado: 'ENVIADA' } }),
      prisma.orden.count({ where: { ...where, estado: 'RECIBIDA' } }),
      prisma.orden.count({ where: { ...where, estado: 'CONFIRMADA' } }),
      prisma.orden.count({ where: { ...where, estado: 'EN_PREPARACION' } }),
      prisma.orden.count({ where: { ...where, estado: 'LISTA' } }),
      prisma.orden.count({ where: { ...where, estado: 'SERVIDA' } }),
      prisma.orden.count({ where: { ...where, estado: 'COMPLETADA' } }),
      prisma.orden.count({ where: { ...where, estado: 'CANCELADA' } }),
      prisma.orden.aggregate({
        where: {
          ...where,
          estado: { not: 'CANCELADA' }
        },
        _sum: {
          total: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        enviadas,
        recibidas,
        confirmadas,
        enPreparacion,
        listas,
        servidas,
        completadas,
        canceladas,
        totalVentas: totalVentas._sum.total || 0,
        period
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get orders by mesa
// @route   GET /api/orders/mesa/:mesaId
// @access  Private (Staff)
const getOrdersByMesa = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { mesaId } = req.params;

    const orders = await prisma.orden.findMany({
      where: {
        restauranteId: restauranteId,
        mesaId: mesaId
      },
      include: {
        mesa: true,
        sesion: true,
        mesero: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        items: {
          include: {
            producto: true
          }
        }
      },
      orderBy: {
        fechaOrden: 'desc'
      }
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error obteniendo órdenes por mesa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get recent orders
// @route   GET /api/orders/recent
// @access  Private (Staff)
const getRecentOrders = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { limit = 10 } = req.query;

    const orders = await prisma.orden.findMany({
      where: {
        restauranteId: restauranteId
      },
      include: {
        mesa: true,
        sesion: true,
        mesero: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        items: {
          include: {
            producto: true
          }
        }
      },
      orderBy: {
        fechaOrden: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error obteniendo órdenes recientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Staff)
const deleteOrder = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { id } = req.params;

    const order = await prisma.orden.findFirst({
      where: {
        id: id,
        restauranteId: restauranteId
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Delete order items first
    await prisma.ordenItem.deleteMany({
      where: { ordenId: id }
    });

    // Delete order
    await prisma.orden.delete({
      where: { id: id }
    });

    res.json({
      success: true,
      message: 'Orden eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes
router.get('/', authenticate, requireStaff, getOrders);
router.get('/stats', authenticate, requireStaff, getOrderStats);
router.get('/recent', authenticate, requireStaff, getRecentOrders);
router.get('/mesa/:mesaId', authenticate, requireStaff, getOrdersByMesa);
router.get('/:id', authenticate, requireStaff, getOrder);
router.put('/:id/status', authenticate, requireStaff, updateOrderStatus);
router.put('/:id/assign', authenticate, requireStaff, assignMeseroToOrder);
router.put('/:id/take', authenticate, requireStaff, takeOrder);
router.delete('/:id', authenticate, requireStaff, deleteOrder);

module.exports = router; 