const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { prisma } = require('../config/database');

const router = express.Router();

// @desc    Get admin stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's restaurant with plan info
    const admin = await prisma.usuarioAdmin.findUnique({
      where: { id: userId },
      include: { 
        restaurante: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!admin || !admin.restaurante) {
      return res.status(404).json({
        success: false,
        error: 'Restaurante no encontrado'
      });
    }

    const restauranteId = admin.restaurante.id;

    // Fecha de hoy para filtrar órdenes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get statistics
    const [productos, categorias, mesas, meseros, ordenes, ordenesHoy] = await Promise.all([
      // Count productos
      prisma.producto.count({
        where: { restauranteId }
      }),
      // Count categorias
      prisma.categoria.count({
        where: { restauranteId }
      }),
      // Count mesas
      prisma.mesa.count({
        where: { restauranteId }
      }),
      // Count meseros
      prisma.usuarioMesero.count({
        where: { restauranteId }
      }),
      // Count total ordenes
      prisma.orden.count({
        where: { restauranteId }
      }),
      // Count ordenes today
      prisma.orden.count({
        where: {
          restauranteId,
          fechaOrden: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        productos,
        categorias,
        mesas,
        meseros,
        ordenes,
        ordenesHoy,
        plan: {
          nombre: admin.restaurante.plan.nombre,
          limiteProductos: admin.restaurante.plan.limiteProductos,
          limiteMesas: admin.restaurante.plan.limiteMesas,
          limiteMeseros: admin.restaurante.plan.limiteMeseros,
          limiteOrdenes: admin.restaurante.plan.limiteOrdenes
        }
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

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboard = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Dashboard del administrador - implementar próximamente',
      data: {
        stats: {
          totalProducts: 0,
          totalOrders: 0,
          totalTables: 0,
          totalStaff: 0
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes
router.get('/stats', authenticate, requireAdmin, getStats);
router.get('/dashboard', authenticate, requireAdmin, getDashboard);

module.exports = router; 