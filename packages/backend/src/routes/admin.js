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
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ]);

    // Lógica para crear notificaciones de límite
    const plan = admin.restaurante.plan;
    const notificacionesACrear = [];

    const checkLimit = (count, limit, resourceName, resourceType) => {
      const notificationKeyLimit = `limit-${resourceType}-${restauranteId}`;
      const notificationKeyWarning = `limit-warning-${resourceType}-${restauranteId}`;

      if (limit > 0 && count >= limit) {
        notificacionesACrear.push({
          titulo: `Límite de ${resourceName} alcanzado`,
          mensaje: `Has alcanzado el límite de ${count}/${limit} ${resourceName.toLowerCase()} de tu plan ${plan.nombre}. Para agregar más, considera actualizar tu plan.`,
          tipo: 'WARNING',
          restauranteId: restauranteId,
          notificationKey: notificationKeyLimit
        });
      } else if (limit > 0 && count >= limit * 0.9) {
        notificacionesACrear.push({
          titulo: `Te acercas al límite de ${resourceName}`,
          mensaje: `Estás cerca de alcanzar el límite de ${count}/${limit} ${resourceName.toLowerCase()} de tu plan ${plan.nombre}.`,
          tipo: 'INFO',
          restauranteId: restauranteId,
          notificationKey: notificationKeyWarning
        });
      }
    };
    
    checkLimit(productos, plan.limiteProductos, 'Productos', 'productos');
    checkLimit(mesas, plan.limiteMesas, 'Mesas', 'mesas');
    checkLimit(meseros, plan.limiteMeseros, 'Meseros', 'meseros');
    checkLimit(ordenes, plan.limiteOrdenes, 'Órdenes', 'ordenes');
    
    if (notificacionesACrear.length > 0) {
      for (const notificacion of notificacionesACrear) {
        await prisma.notificacionUsuario.upsert({
          where: {
            notificationKey: notificacion.notificationKey,
          },
          update: {
            mensaje: notificacion.mensaje,
            leida: false, // Marcar como no leída si se actualiza
            createdAt: new Date(), // Actualizar la fecha para que aparezca como nueva
          },
          create: {
            titulo: notificacion.titulo,
            mensaje: notificacion.mensaje,
            tipo: notificacion.tipo,
            restauranteId: notificacion.restauranteId,
            notificationKey: notificacion.notificationKey,
          }
        });
      }
    }

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