const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { prisma } = require('../config/database');

const router = express.Router();

// Validation schemas
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'La contraseña actual es requerida'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'La nueva contraseña debe tener al menos 6 caracteres',
    'any.required': 'La nueva contraseña es requerida'
  })
});

const updateProfileSchema = Joi.object({
  nombre: Joi.string().min(2).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  apellido: Joi.string().min(2).optional(),
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido'
  }),
  telefono: Joi.string().optional()
});

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
        // FIXED: Create notification only if it doesn't already exist
        const existingNotification = await prisma.notificacionUsuario.findUnique({
          where: { notificationKey: notificacion.notificationKey },
        });

        if (!existingNotification) {
          await prisma.notificacionUsuario.create({
            data: {
            titulo: notificacion.titulo,
            mensaje: notificacion.mensaje,
            tipo: notificacion.tipo,
            restauranteId: notificacion.restauranteId,
            notificationKey: notificacion.notificationKey,
          }
        });
        }
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
          nombre: formatPlanName(admin.restaurante.plan.nombre),
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

const formatPlanName = (name) => {
  const lowerCaseName = name.toLowerCase();
  if (lowerCaseName.includes('gratuito')) return 'Plan Gratuito';
  if (lowerCaseName.includes('basico')) return 'Plan Básico';
  if (lowerCaseName.includes('platinium')) return 'Plan Platinium';
  if (lowerCaseName.includes('gold')) return 'Plan Gold';
  // Capitalize first letter for any other plan
  return name.charAt(0).toUpperCase() + name.slice(1);
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

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private (Admin)
const changePassword = async (req, res) => {
  try {
    // Validate input
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { currentPassword, newPassword } = value;
    const userId = req.user.userId;

    // Get current user
    const user = await prisma.usuarioAdmin.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña actual es incorrecta'
      });
    }

    // Check if new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.usuarioAdmin.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin)
const updateProfile = async (req, res) => {
  try {
    // Validate input
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { nombre, apellido, email, telefono } = value;
    const userId = req.user.userId;

    // Check if email is being changed and already exists
    const existingUser = await prisma.usuarioAdmin.findFirst({
      where: {
        email: email,
        id: { not: userId }
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un usuario con este email'
      });
    }

    // Update profile
    const updatedUser = await prisma.usuarioAdmin.update({
      where: { id: userId },
      data: {
        nombre,
        apellido,
        email,
        telefono
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        restauranteId: true,
        restaurante: {
          select: {
            id: true,
            nombre: true,
            slug: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes
router.get('/stats', authenticate, requireAdmin, getStats);
router.get('/dashboard', authenticate, requireAdmin, getDashboard);
router.put('/change-password', authenticate, requireAdmin, changePassword);
router.put('/profile', authenticate, requireAdmin, updateProfile);

module.exports = router; 