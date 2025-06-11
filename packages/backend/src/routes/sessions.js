const express = require('express');
const { prisma } = require('../config/database');
const Joi = require('joi');
const crypto = require('crypto');

const router = express.Router();

// Validation schemas
const createSessionSchema = Joi.object({
  mesaNumero: Joi.string().required(),
  restauranteSlug: Joi.string().required(),
  clienteNombre: Joi.string().optional().max(100),
  clienteTelefono: Joi.string().optional().max(20),
  numeroPersonas: Joi.number().integer().min(1).max(20).default(1)
});

const updateSessionSchema = Joi.object({
  clienteNombre: Joi.string().optional().max(100),
  clienteTelefono: Joi.string().optional().max(20),
  numeroPersonas: Joi.number().integer().min(1).max(20),
  metadata: Joi.object().optional()
});

// Utility function to generate session token
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// @desc    Create new table session (Public endpoint for QR scan)
// @route   POST /api/sessions
// @access  Public
const createSession = async (req, res) => {
  try {
    const { error, value } = createSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { mesaNumero, restauranteSlug, clienteNombre, clienteTelefono, numeroPersonas } = value;

    // Find restaurant by slug
    const restaurante = await prisma.restaurante.findUnique({
      where: { slug: restauranteSlug }
    });

    if (!restaurante || !restaurante.activo) {
      return res.status(404).json({
        success: false,
        error: 'Restaurante no encontrado o inactivo'
      });
    }

    // Find mesa by numero and restaurant
    const mesa = await prisma.mesa.findFirst({
      where: {
        numero: mesaNumero,
        restauranteId: restaurante.id,
        activa: true
      }
    });

    if (!mesa) {
      return res.status(404).json({
        success: false,
        error: 'Mesa no encontrada o inactiva'
      });
    }

    // Check for existing active session on this table
    const existingSession = await prisma.sesion.findFirst({
      where: {
        mesaId: mesa.id,
        estado: 'ACTIVA'
      }
    });

    if (existingSession) {
      // Update last activity and return existing session
      const updatedSession = await prisma.sesion.update({
        where: { id: existingSession.id },
        data: { 
          ultimaActividad: new Date(),
          ...(clienteNombre && { clienteNombre }),
          ...(clienteTelefono && { clienteTelefono }),
          ...(numeroPersonas && { numeroPersonas })
        },
        include: {
          mesa: {
            select: { numero: true, nombre: true, capacidad: true }
          },
          restaurante: {
            select: { nombre: true, slug: true }
          }
        }
      });

      return res.json({
        success: true,
        data: { 
          sesion: updatedSession,
          isExisting: true 
        },
        message: 'Sesión activa encontrada y actualizada'
      });
    }

    // Create new session
    const sessionToken = generateSessionToken();
    
    const nuevaSesion = await prisma.sesion.create({
      data: {
        mesaId: mesa.id,
        restauranteId: restaurante.id,
        sessionToken,
        clienteNombre,
        clienteTelefono,
        numeroPersonas
      },
      include: {
        mesa: {
          select: { numero: true, nombre: true, capacidad: true }
        },
        restaurante: {
          select: { nombre: true, slug: true }
        }
      }
    });

    res.json({
      success: true,
      data: { 
        sesion: nuevaSesion,
        isExisting: false 
      },
      message: 'Sesión creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando sesión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get session by token (Public endpoint)
// @route   GET /api/sessions/:token
// @access  Public
const getSession = async (req, res) => {
  try {
    const { token } = req.params;

    const sesion = await prisma.sesion.findUnique({
      where: { sessionToken: token },
      include: {
        mesa: {
          select: { numero: true, nombre: true, capacidad: true }
        },
        restaurante: {
          select: { nombre: true, slug: true, descripcion: true }
        },
        ordenes: {
          where: {
            estado: {
              in: ['ENVIADA', 'RECIBIDA', 'CONFIRMADA', 'EN_PREPARACION', 'LISTA']
            }
          },
          select: {
            id: true,
            numeroOrden: true,
            estado: true,
            total: true,
            fechaOrden: true
          }
        }
      }
    });

    if (!sesion) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    // Update last activity if session is active
    if (sesion.estado === 'ACTIVA') {
      await prisma.sesion.update({
        where: { id: sesion.id },
        data: { ultimaActividad: new Date() }
      });
    }

    res.json({
      success: true,
      data: { sesion }
    });

  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Update session (Public endpoint)
// @route   PUT /api/sessions/:token
// @access  Public
const updateSession = async (req, res) => {
  try {
    const { token } = req.params;
    const { error, value } = updateSessionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const sesion = await prisma.sesion.findUnique({
      where: { sessionToken: token }
    });

    if (!sesion) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    if (sesion.estado !== 'ACTIVA') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden actualizar sesiones activas'
      });
    }

    const sesionActualizada = await prisma.sesion.update({
      where: { id: sesion.id },
      data: {
        ...value,
        ultimaActividad: new Date()
      },
      include: {
        mesa: {
          select: { numero: true, nombre: true, capacidad: true }
        },
        restaurante: {
          select: { nombre: true, slug: true }
        }
      }
    });

    res.json({
      success: true,
      data: { sesion: sesionActualizada },
      message: 'Sesión actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando sesión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Close session (Public endpoint)
// @route   POST /api/sessions/:token/close
// @access  Public
const closeSession = async (req, res) => {
  try {
    const { token } = req.params;

    const sesion = await prisma.sesion.findUnique({
      where: { sessionToken: token }
    });

    if (!sesion) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    if (sesion.estado === 'CERRADA') {
      return res.status(400).json({
        success: false,
        error: 'La sesión ya está cerrada'
      });
    }

    const sesionCerrada = await prisma.sesion.update({
      where: { id: sesion.id },
      data: {
        estado: 'CERRADA',
        finSesion: new Date(),
        ultimaActividad: new Date()
      }
    });

    res.json({
      success: true,
      data: { sesion: sesionCerrada },
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('Error cerrando sesión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get all sessions for restaurant (Admin endpoint)
// @route   GET /api/sessions/restaurant/all
// @access  Private (Admin)
const getRestaurantSessions = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { estado, mesaId, limit = 50, offset = 0 } = req.query;

    const whereClause = {
      restauranteId
    };

    if (estado) {
      whereClause.estado = estado;
    }

    if (mesaId) {
      whereClause.mesaId = mesaId;
    }

    const sesiones = await prisma.sesion.findMany({
      where: whereClause,
      include: {
        mesa: {
          select: { numero: true, nombre: true }
        },
        _count: {
          select: { ordenes: true }
        }
      },
      orderBy: { inicioSesion: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.sesion.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        sesiones,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error obteniendo sesiones del restaurante:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get session statistics for restaurant (Admin endpoint)
// @route   GET /api/sessions/restaurant/stats
// @access  Private (Admin)
const getSessionStats = async (req, res) => {
  try {
    const { restauranteId } = req.user;

    const stats = await prisma.sesion.groupBy({
      by: ['estado'],
      where: { restauranteId },
      _count: { _all: true }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await prisma.sesion.count({
      where: {
        restauranteId,
        inicioSesion: {
          gte: today
        }
      }
    });

    const activeSessions = await prisma.sesion.findMany({
      where: {
        restauranteId,
        estado: 'ACTIVA'
      },
      include: {
        mesa: {
          select: { numero: true, nombre: true }
        }
      }
    });

    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat.estado.toLowerCase()] = stat._count._all;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        estadisticas: formattedStats,
        sesionesHoy: todayStats,
        sesionesActivas: activeSessions,
        totalSesionesActivas: activeSessions.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de sesiones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Import authentication middleware only for admin routes
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// Public routes (for customers scanning QR)
router.post('/', createSession);
router.get('/:token', getSession);
router.put('/:token', updateSession);
router.post('/:token/close', closeSession);

// Admin routes (for restaurant management)
router.get('/restaurant/all', authenticate, requireAdmin, getRestaurantSessions);
router.get('/restaurant/stats', authenticate, requireAdmin, getSessionStats);

module.exports = router; 