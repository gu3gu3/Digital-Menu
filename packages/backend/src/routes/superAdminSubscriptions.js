const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const { authenticateSuperAdmin } = require('../middleware/superAdminAuth');

const router = express.Router();
const prisma = new PrismaClient();

// Esquemas de validación
const updateSubscriptionSchema = Joi.object({
  planId: Joi.string().optional(),
  estado: Joi.string().valid('ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'CANCELADA', 'BLOQUEADA').optional(),
  fechaVencimiento: Joi.date().optional(),
  notasAdmin: Joi.string().optional()
});

const processPaymentSchema = Joi.object({
  monto: Joi.number().positive().required(),
  mesesPagados: Joi.number().integer().min(1).max(12).required(),
  metodoPago: Joi.string().optional(),
  referenciaPago: Joi.string().optional(),
  notas: Joi.string().optional()
});

const sendNotificationSchema = Joi.object({
  restauranteIds: Joi.array().items(Joi.string()).min(1).required(),
  tipo: Joi.string().valid('RENOVACION_PROXIMA', 'SUSCRIPCION_VENCIDA', 'CUENTA_SUSPENDIDA', 'PAGO_CONFIRMADO', 'UPGRADE_PLAN', 'BIENVENIDA').required(),
  titulo: Joi.string().min(1).required(),
  mensaje: Joi.string().min(1).required()
});

const planSchema = Joi.object({
  nombre: Joi.string().min(3).required(),
  precio: Joi.number().min(0).required(),
  limiteProductos: Joi.number().integer().min(-1).required(),
  limiteCategorias: Joi.number().integer().min(-1).required(),
  limiteMeseros: Joi.number().integer().min(-1).required(),
  limiteMesas: Joi.number().integer().min(-1).required(),
  limiteOrdenes: Joi.number().integer().min(-1).required(),
  soporteEmail: Joi.boolean().required(),
  soporteChat: Joi.boolean().required(),
  analiticas: Joi.boolean().required(),
  activo: Joi.boolean().optional()
});

const updatePlanSchema = Joi.object({
  nombre: Joi.string().min(3).optional(),
  precio: Joi.number().min(0).optional(),
  limiteProductos: Joi.number().integer().min(-1).optional(),
  limiteCategorias: Joi.number().integer().min(-1).optional(),
  limiteMeseros: Joi.number().integer().min(-1).optional(),
  limiteMesas: Joi.number().integer().min(-1).optional(),
  limiteOrdenes: Joi.number().integer().min(-1).optional(),
  soporteEmail: Joi.boolean().optional(),
  soporteChat: Joi.boolean().optional(),
  analiticas: Joi.boolean().optional(),
  activo: Joi.boolean().optional()
});

/**
 * GET /api/super-admin/subscriptions
 * Obtener todas las suscripciones con filtros
 */
router.get('/', authenticateSuperAdmin, async (req, res) => {
  try {
    const {
      estado,
      planId,
      vencenEn, // días
      page = 1,
      limit = 20,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (planId) {
      where.restaurante = {
        planId: planId
      };
    }

    // Filtro por vencimiento próximo
    if (vencenEn) {
      const diasVencimiento = parseInt(vencenEn);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + diasVencimiento);
      
      where.fechaVencimiento = {
        lte: fechaLimite
      };
      where.estado = 'ACTIVA'; // Solo activas que vencen pronto
    }

    // Filtro de búsqueda por nombre de restaurante
    if (search) {
      where.restaurante = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Obtener suscripciones
    const [suscripciones, total] = await Promise.all([
      prisma.suscripcion.findMany({
        where,
        include: {
          restaurante: {
            select: {
              id: true,
              nombre: true,
              email: true,
              slug: true,
              activo: true,
              createdAt: true,
              plan: {
                select: {
                  id: true,
                  nombre: true,
                  precio: true
                }
              }
            }
          },
          historialPagos: {
            orderBy: { fechaPago: 'desc' },
            take: 1
          }
        },
        orderBy: { fechaVencimiento: 'asc' },
        skip,
        take
      }),
      prisma.suscripcion.count({ where })
    ]);

    // Calcular días hasta vencimiento
    const suscripcionesConDias = suscripciones.map(sub => {
      const hoy = new Date();
      const vencimiento = new Date(sub.fechaVencimiento);
      const diasHastaVencimiento = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
      
      return {
        ...sub,
        diasHastaVencimiento,
        vencida: diasHastaVencimiento < 0,
        proximaAVencer: diasHastaVencimiento <= 7 && diasHastaVencimiento >= 0
      };
    });

    res.json({
      success: true,
      data: {
        suscripciones: suscripcionesConDias,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo suscripciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/super-admin/subscriptions/stats
 * Obtener estadísticas de suscripciones
 */
router.get('/stats', authenticateSuperAdmin, async (req, res) => {
  try {
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);
    
    const en30Dias = new Date();
    en30Dias.setDate(hoy.getDate() + 30);

    const [
      totalSuscripciones,
      suscripcionesActivas,
      suscripcionesVencidas,
      suscripcionesSuspendidas,
      proximasAVencer7Dias,
      proximasAVencer30Dias,
      ingresosMesActual,
      suscripcionesPorPlan
    ] = await Promise.all([
      // Total de suscripciones
      prisma.suscripcion.count(),
      
      // Suscripciones activas
      prisma.suscripcion.count({
        where: { estado: 'ACTIVA' }
      }),
      
      // Suscripciones vencidas
      prisma.suscripcion.count({
        where: { estado: 'VENCIDA' }
      }),
      
      // Suscripciones suspendidas
      prisma.suscripcion.count({
        where: { estado: 'SUSPENDIDA' }
      }),
      
      // Próximas a vencer en 7 días
      prisma.suscripcion.count({
        where: {
          estado: 'ACTIVA',
          fechaVencimiento: {
            lte: en7Dias,
            gte: hoy
          }
        }
      }),
      
      // Próximas a vencer en 30 días
      prisma.suscripcion.count({
        where: {
          estado: 'ACTIVA',
          fechaVencimiento: {
            lte: en30Dias,
            gte: hoy
          }
        }
      }),
      
      // Ingresos del mes actual
      prisma.historialPago.aggregate({
        where: {
          fechaPago: {
            gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1)
          }
        },
        _sum: {
          monto: true
        }
      }),
      
      // Suscripciones por plan
      prisma.restaurante.groupBy({
        by: ['planId'],
        _count: {
          id: true
        }
      })
    ]);

    // Obtener nombres de planes
    const planes = await prisma.plan.findMany({
      select: { id: true, nombre: true }
    });
    
    const planesMap = planes.reduce((acc, plan) => {
      acc[plan.id] = plan.nombre;
      return acc;
    }, {});

    const suscripcionesPorPlanConNombres = suscripcionesPorPlan.map(item => ({
      nombre: planesMap[item.planId] || 'Plan Desconocido',
      cantidad: item._count.id
    }));

    res.json({
      success: true,
      data: {
        resumen: {
          totalSuscripciones,
          suscripcionesActivas,
          suscripcionesVencidas,
          suscripcionesSuspendidas,
          proximasAVencer7Dias,
          proximasAVencer30Dias
        },
        ingresos: {
          mesActual: ingresosMesActual._sum.monto || 0
        },
        distribucionPorPlan: suscripcionesPorPlanConNombres
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/super-admin/subscriptions/plans
 * Obtener todos los planes disponibles
 */
router.get('/plans', authenticateSuperAdmin, async (req, res) => {
  try {
    const planes = await prisma.plan.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        precio: true,
        limiteProductos: true,
        limiteCategorias: true,
        limiteMeseros: true,
        limiteMesas: true,
        limiteOrdenes: true,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true
      },
      orderBy: { precio: 'asc' }
    });

    res.json({
      success: true,
      data: planes
    });

  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/super-admin/subscriptions/:id
 * Obtener detalles de una suscripción específica
 */
router.get('/:id', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const suscripcion = await prisma.suscripcion.findUnique({
      where: { id },
      include: { 
        restaurante: {
          include: {
            plan: true,
            usuariosAdmin: true,
            productos: true,
            mesas: true
          }
        },
        historialPagos: true
      }
    });

    if (!suscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    const { restaurante } = suscripcion;

    // Aplanar la estructura para un acceso más fácil en el frontend
    const dataAplanada = {
      id: suscripcion.id,
      estado: suscripcion.estado,
      fechaInicio: suscripcion.fechaInicio,
      fechaVencimiento: suscripcion.fechaVencimiento,
      renovacionAutomatica: suscripcion.renovacionAutomatica,
      createdAt: suscripcion.createdAt,
      updatedAt: suscripcion.updatedAt,
      notasAdmin: suscripcion.notasAdmin,
      restaurante: {
        id: restaurante.id,
        nombre: restaurante.nombre,
        slug: restaurante.slug,
        email: restaurante.email,
        activo: restaurante.activo,
        usuariosAdmin: restaurante.usuariosAdmin,
        plan: restaurante.plan
      },
      stats: {
        totalUsuariosAdmin: restaurante.usuariosAdmin.length,
        totalProductos: restaurante.productos.length,
        totalMesas: restaurante.mesas.length,
      totalPagos: suscripcion.historialPagos.length,
      montoTotalPagado: suscripcion.historialPagos.reduce((sum, pago) => sum + Number(pago.monto), 0)
      },
      historialPagos: suscripcion.historialPagos
    };

    res.json({
      success: true,
      data: dataAplanada
    });

  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/super-admin/subscriptions/:id
 * Actualizar suscripción
 */
router.put('/:id', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar entrada
    const { error, value } = updateSubscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Verificar que la suscripción existe
    const suscripcionExistente = await prisma.suscripcion.findUnique({
      where: { id },
      include: { restaurante: true }
    });

    if (!suscripcionExistente) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    // Actualizar suscripción
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar suscripción
      const suscripcionActualizada = await tx.suscripcion.update({
        where: { id },
        data: value,
        include: {
          restaurante: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          plan: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      // Si se cambió el plan, actualizar también el restaurante
      if (value.planId && value.planId !== suscripcionExistente.planId) {
        await tx.restaurante.update({
          where: { id: suscripcionExistente.restauranteId },
          data: { planId: value.planId }
        });
      }

      // Si se cambió el estado a SUSPENDIDA o BLOQUEADA, enviar notificación
      if (value.estado && ['SUSPENDIDA', 'BLOQUEADA'].includes(value.estado)) {
        await tx.notificacionUsuario.create({
          data: {
            restauranteId: suscripcionExistente.restauranteId,
            tipo: 'CUENTA_SUSPENDIDA',
            titulo: 'Cuenta Suspendida',
            mensaje: `Su cuenta ha sido ${value.estado.toLowerCase()} por el administrador del sistema.`,
            enviadaPorId: req.superUser.id
          }
        });
      }

      return suscripcionActualizada;
    });

    res.json({
      success: true,
      message: 'Suscripción actualizada exitosamente',
      data: resultado
    });

  } catch (error) {
    console.error('Error actualizando suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/super-admin/subscriptions/:id/process-payment
 * Procesar pago manual de suscripción
 */
router.post('/:id/process-payment', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar entrada
    const { error, value } = processPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { monto, mesesPagados, metodoPago, referenciaPago, notas } = value;

    // Verificar que la suscripción existe
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { id },
      include: { restaurante: true }
    });

    if (!suscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    // Calcular nueva fecha de vencimiento
    const fechaBase = suscripcion.estado === 'VENCIDA' ? new Date() : new Date(suscripcion.fechaVencimiento);
    const nuevaFechaVencimiento = new Date(fechaBase);
    nuevaFechaVencimiento.setMonth(nuevaFechaVencimiento.getMonth() + mesesPagados);

    // Transacción para actualizar suscripción y crear historial de pago
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear registro de pago
      const pago = await tx.historialPago.create({
        data: {
          suscripcionId: id,
          monto,
          mesesPagados,
          metodoPago,
          referenciaPago,
          procesadoPor: req.superUser.id,
          notas
        }
      });

      // Actualizar suscripción
      const suscripcionActualizada = await tx.suscripcion.update({
        where: { id },
        data: {
          estado: 'ACTIVA',
          fechaVencimiento: nuevaFechaVencimiento,
          fechaUltimoPago: new Date(),
          mesesPagados,
          montoUltimoPago: monto
        },
        include: {
          restaurante: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      });

      // Crear notificación de pago confirmado
      await tx.notificacionUsuario.create({
        data: {
          restauranteId: suscripcion.restauranteId,
          tipo: 'PAGO_CONFIRMADO',
          titulo: 'Pago Confirmado',
          mensaje: `Su pago de $${monto} por ${mesesPagados} mes(es) ha sido confirmado. Su suscripción está activa hasta ${nuevaFechaVencimiento.toLocaleDateString()}.`,
          enviadaPorId: req.superUser.id
        }
      });

      return { pago, suscripcionActualizada };
    });

    res.json({
      success: true,
      message: 'Pago procesado exitosamente',
      data: resultado
    });

  } catch (error) {
    console.error('Error procesando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/super-admin/subscriptions/send-notifications
 * Enviar notificaciones masivas
 */
router.post('/send-notifications', authenticateSuperAdmin, async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = sendNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { restauranteIds, tipo, titulo, mensaje } = value;

    // Crear notificaciones para todos los restaurantes especificados
    const notificaciones = await Promise.all(
      restauranteIds.map(restauranteId =>
        prisma.notificacionUsuario.create({
          data: {
            restauranteId,
            tipo,
            titulo,
            mensaje,
            enviadaPorId: req.superUser.id
          }
        })
      )
    );

    res.json({
      success: true,
      message: `${notificaciones.length} notificaciones enviadas exitosamente`,
      data: {
        notificacionesEnviadas: notificaciones.length,
        tipo,
        titulo
      }
    });

  } catch (error) {
    console.error('Error enviando notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/super-admin/subscriptions/:id/renew
 * Renovar suscripción por X meses
 */
router.post('/:id/renew', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar entrada
    const renewSchema = Joi.object({
      meses: Joi.number().integer().min(1).max(12).required(),
      planId: Joi.string().optional(), // Opcional para cambio de plan
      monto: Joi.number().positive().optional(),
      metodoPago: Joi.string().optional(),
      referenciaPago: Joi.string().optional(),
      notas: Joi.string().optional()
    });

    const { error, value } = renewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { meses, planId, monto, metodoPago, referenciaPago, notas } = value;

    // Verificar que la suscripción existe
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { id },
      include: { 
        restaurante: {
          include: {
            plan: true
          }
        },
        historialPagos: true
      }
    });

    if (!suscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    // Si se especifica un planId, verificar que existe
    let nuevoPlan = suscripcion.restaurante.plan;
    if (planId && planId !== suscripcion.restaurante.planId) {
      nuevoPlan = await prisma.plan.findUnique({
        where: { id: planId }
      });

      if (!nuevoPlan) {
        return res.status(400).json({
          success: false,
          message: 'Plan especificado no encontrado'
        });
      }
    }

    // Calcular nueva fecha de vencimiento
    let fechaBase;
    if (suscripcion.estado === 'VENCIDA' || suscripcion.estado === 'SUSPENDIDA') {
      // Si está vencida o suspendida, renovar desde hoy
      fechaBase = new Date();
    } else {
      // Si está activa, extender desde la fecha actual de vencimiento
      fechaBase = new Date(suscripcion.fechaVencimiento);
    }
    
    const nuevaFechaVencimiento = new Date(fechaBase);
    nuevaFechaVencimiento.setMonth(nuevaFechaVencimiento.getMonth() + meses);

    // Calcular monto automáticamente si no se especifica
    const montoCalculado = monto || (nuevoPlan.precio * meses);

    // Transacción para renovar suscripción
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar suscripción
      const suscripcionActualizada = await tx.suscripcion.update({
        where: { id },
        data: {
          estado: 'ACTIVA',
          fechaVencimiento: nuevaFechaVencimiento
        },
        include: {
          restaurante: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      });

      // Si hay cambio de plan, actualizar también el restaurante
      if (planId && planId !== suscripcion.restaurante.planId) {
        await tx.restaurante.update({
          where: { id: suscripcion.restauranteId },
          data: { planId: planId }
        });
      }

      // Crear registro de pago
      const pago = await tx.historialPago.create({
        data: {
          suscripcionId: id,
          monto: montoCalculado,
          mesesPagados: meses,
          metodoPago: metodoPago || 'Renovación Manual',
          referenciaPago,
          procesadoPor: req.superUser.id,
          notas
        }
      });

      // Crear notificación
      const tipoNotificacion = planId && planId !== suscripcion.restaurante.planId ? 'UPGRADE_PLAN' : 'PAGO_CONFIRMADO';
      const tituloNotificacion = planId && planId !== suscripcion.restaurante.planId 
        ? 'Plan Actualizado y Renovado'
        : 'Suscripción Renovada';
      
      let mensajeNotificacion = `Su suscripción ha sido renovada por ${meses} mes(es) hasta el ${nuevaFechaVencimiento.toLocaleDateString()}.`;
      
      if (planId && planId !== suscripcion.restaurante.planId) {
        mensajeNotificacion = `Su plan ha sido actualizado a "${nuevoPlan.nombre}" y renovado por ${meses} mes(es) hasta el ${nuevaFechaVencimiento.toLocaleDateString()}.`;
      }

      await tx.notificacionUsuario.create({
        data: {
          restauranteId: suscripcion.restauranteId,
          tipo: tipoNotificacion,
          titulo: tituloNotificacion,
          mensaje: mensajeNotificacion,
          enviadaPorId: req.superUser.id
        }
      });

      return { suscripcionActualizada, pago };
    });

    res.json({
      success: true,
      message: `Suscripción renovada exitosamente por ${meses} mes(es)`,
      data: resultado
    });

  } catch (error) {
    console.error('Error renovando suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/super-admin/subscriptions/sync-restaurant-plans
 * Sincronizar planes de restaurantes con sus suscripciones activas
 */
router.post('/sync-restaurant-plans', authenticateSuperAdmin, async (req, res) => {
  try {
    // Obtener todas las suscripciones activas
    const suscripciones = await prisma.suscripcion.findMany({
      where: { estado: 'ACTIVA' },
      include: {
        restaurante: {
          select: {
            id: true,
            nombre: true,
            planId: true
          }
        },
        plan: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    // Filtrar las que tienen plan diferente
    const desincronizadas = suscripciones.filter(
      suscripcion => suscripcion.restaurante.planId !== suscripcion.restaurante.planId
    );

    // Actualizar restaurantes
    const actualizaciones = [];
    
    for (const suscripcion of desincronizadas) {
      await prisma.restaurante.update({
        where: { id: suscripcion.restauranteId },
        data: { planId: suscripcion.restaurante.planId }
      });
      
      actualizaciones.push({
        restauranteId: suscripcion.restauranteId,
        restauranteNombre: suscripcion.restaurante.nombre,
        planAnterior: suscripcion.restaurante.planId,
        planNuevo: suscripcion.restaurante.planId,
        planNombre: suscripcion.plan.nombre
      });
    }

    res.json({
      success: true,
      message: `${actualizaciones.length} restaurantes sincronizados`,
      data: {
        actualizacionesRealizadas: actualizaciones.length,
        detalles: actualizaciones
      }
    });

  } catch (error) {
    console.error('Error sincronizando planes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ==================== GESTIÓN COMPLETA DE PLANES ====================

/**
 * GET /api/super-admin/subscriptions/plans/all
 * Obtener todos los planes (activos e inactivos) para administración
 */
router.get('/plans/all', authenticateSuperAdmin, async (req, res) => {
  try {
    const planes = await prisma.plan.findMany({
      select: {
        id: true,
        nombre: true,
        precio: true,
        limiteProductos: true,
        limiteCategorias: true,
        limiteMeseros: true,
        limiteMesas: true,
        limiteOrdenes: true,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            restaurantes: true
          }
        }
      },
      orderBy: { precio: 'asc' }
    });

    res.json({
      success: true,
      data: planes
    });

  } catch (error) {
    console.error('Error obteniendo todos los planes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/super-admin/subscriptions/plans
 * Crear nuevo plan
 */
router.post('/plans', authenticateSuperAdmin, async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = planSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Verificar que no existe un plan con el mismo nombre
    const planExistente = await prisma.plan.findUnique({
      where: { nombre: value.nombre }
    });

    if (planExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un plan con ese nombre'
      });
    }

    // Crear plan
    const nuevoPlan = await prisma.plan.create({
      data: value
    });

    res.status(201).json({
      success: true,
      message: 'Plan creado exitosamente',
      data: nuevoPlan
    });

  } catch (error) {
    console.error('Error creando plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/super-admin/subscriptions/plans/:id
 * Actualizar plan existente
 */
router.put('/plans/:id', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validar entrada
    const { error, value } = updatePlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Verificar que el plan existe
    const planExistente = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            restaurantes: true
          }
        }
      }
    });

    if (!planExistente) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
    if (value.nombre && value.nombre !== planExistente.nombre) {
      const nombreExistente = await prisma.plan.findUnique({
        where: { nombre: value.nombre }
      });

      if (nombreExistente) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un plan con ese nombre'
        });
      }
    }

    // Actualizar plan
    const planActualizado = await prisma.plan.update({
      where: { id },
      data: value
    });

    res.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      data: planActualizado
    });

  } catch (error) {
    console.error('Error actualizando plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/super-admin/subscriptions/plans/:id
 * Eliminar plan (solo si no tiene restaurantes o suscripciones activas)
 */
router.delete('/plans/:id', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            restaurantes: true
          }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Verificar que no tiene restaurantes o suscripciones activas
    if (plan._count.restaurantes > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un plan que tiene restaurantes asociados. Desactive el plan en su lugar.',
        data: {
          restaurantesAsociados: plan._count.restaurantes
        }
      });
    }

    // Eliminar plan
    await prisma.plan.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Plan eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/super-admin/subscriptions/plans/:id/toggle
 * Activar/Desactivar plan
 */
router.post('/plans/:id/toggle', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Alternar estado activo
    const planActualizado = await prisma.plan.update({
      where: { id },
      data: { activo: !plan.activo }
    });

    res.json({
      success: true,
      message: `Plan ${planActualizado.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: planActualizado
    });

  } catch (error) {
    console.error('Error alternando estado del plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/super-admin/subscriptions/plans/:id/usage
 * Obtener estadísticas de uso de un plan específico
 */
router.get('/plans/:id/usage', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Obtener estadísticas de uso
    const [restaurantesCount, ingresosTotales] = await Promise.all([
      prisma.restaurante.count({
        where: { planId: id }
      }),
      prisma.historialPago.aggregate({
        where: {
          suscripcion: {
            restaurante: {
              planId: id
            }
          }
        },
        _sum: {
          monto: true
        }
      })
    ]);

    // Obtener restaurantes recientes con este plan
    const restaurantesRecientes = await prisma.restaurante.findMany({
      where: { planId: id },
      select: {
        id: true,
        nombre: true,
        email: true,
        createdAt: true,
        activo: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      success: true,
      data: {
        plan,
        estadisticas: {
          restaurantesAsociados: restaurantesCount,
          ingresosTotales: ingresosTotales._sum.monto || 0
        },
        restaurantesRecientes
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas del plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/super-admin/subscriptions/restaurant/:id/complete
 * Eliminar completamente un restaurante y todas sus relaciones
 */
router.delete('/restaurant/:id/complete', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el restaurante existe
    const restaurante = await prisma.restaurante.findUnique({
      where: { id },
      include: {
        usuariosAdmin: true,
        usuariosMesero: true,
        mesas: true,
        categorias: {
          include: {
            productos: true
          }
        },
        ordenes: {
          include: {
            items: true
          }
        },
        sesiones: true,
        suscripcion: {
          include: {
            restaurante: {
              include: {
                plan: true
              }
            },
            historialPagos: true
          }
        },
        notificaciones: true,
        _count: {
          select: {
            usuariosAdmin: true,
            usuariosMesero: true,
            mesas: true,
            categorias: true,
            productos: true,
            ordenes: true,
            sesiones: true,
            notificaciones: true
          }
        }
      }
    });

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        message: 'Restaurante no encontrado'
      });
    }

    // Ejecutar eliminación en transacción para garantizar consistencia
    const resultado = await prisma.$transaction(async (tx) => {
      const stats = {
        itemsOrdenEliminados: 0,
        ordenesEliminadas: 0,
        productosEliminados: 0,
        categoriasEliminadas: 0,
        mesasEliminadas: 0,
        sesionesEliminadas: 0,
        usuariosMeseroEliminados: 0,
        usuariosAdminEliminados: 0,
        historialPagosEliminados: 0,
        suscripcionEliminada: false,
        notificacionesEliminadas: 0,
        restauranteEliminado: false
      };

      // 1. Eliminar items de órdenes
      const itemsOrden = await tx.itemOrden.deleteMany({
        where: {
          orden: {
            restauranteId: id
          }
        }
      });
      stats.itemsOrdenEliminados = itemsOrden.count;

      // 2. Eliminar órdenes
      const ordenes = await tx.orden.deleteMany({
        where: { restauranteId: id }
      });
      stats.ordenesEliminadas = ordenes.count;

      // 3. Eliminar productos
      const productos = await tx.producto.deleteMany({
        where: { restauranteId: id }
      });
      stats.productosEliminados = productos.count;

      // 4. Eliminar categorías
      const categorias = await tx.categoria.deleteMany({
        where: { restauranteId: id }
      });
      stats.categoriasEliminadas = categorias.count;

      // 5. Eliminar mesas
      const mesas = await tx.mesa.deleteMany({
        where: { restauranteId: id }
      });
      stats.mesasEliminadas = mesas.count;

      // 6. Eliminar sesiones
      const sesiones = await tx.sesion.deleteMany({
        where: { restauranteId: id }
      });
      stats.sesionesEliminadas = sesiones.count;

      // 7. Eliminar usuarios mesero
      const usuariosMesero = await tx.usuarioMesero.deleteMany({
        where: { restauranteId: id }
      });
      stats.usuariosMeseroEliminados = usuariosMesero.count;

      // 8. Eliminar usuarios admin
      const usuariosAdmin = await tx.usuarioAdmin.deleteMany({
        where: { restauranteId: id }
      });
      stats.usuariosAdminEliminados = usuariosAdmin.count;

      // 9. Eliminar historial de pagos (si existe suscripción)
      if (restaurante.suscripcion) {
        const historialPagos = await tx.historialPago.deleteMany({
          where: { suscripcionId: restaurante.suscripcion.id }
        });
        stats.historialPagosEliminados = historialPagos.count;

        // 10. Eliminar suscripción
        await tx.suscripcion.delete({
          where: { id: restaurante.suscripcion.id }
        });
        stats.suscripcionEliminada = true;
      }

      // 11. Eliminar notificaciones
      const notificaciones = await tx.notificacionUsuario.deleteMany({
        where: { restauranteId: id }
      });
      stats.notificacionesEliminadas = notificaciones.count;

      // 12. Finalmente, eliminar el restaurante
      await tx.restaurante.delete({
        where: { id }
      });
      stats.restauranteEliminado = true;

      return stats;
    });

    // Log de la operación para auditoría
    console.log(`🗑️ Restaurante eliminado completamente por Super Admin ${req.superUser.email}:`, {
      restauranteId: id,
      restauranteNombre: restaurante.nombre,
      eliminadoPor: req.superUser.id,
      fecha: new Date().toISOString(),
      estadisticas: resultado
    });

    res.json({
      success: true,
      message: `Restaurante "${restaurante.nombre}" y todas sus relaciones han sido eliminados completamente`,
      data: {
        restauranteEliminado: {
          id: restaurante.id,
          nombre: restaurante.nombre,
          email: restaurante.email
        },
        estadisticas: resultado,
        eliminadoPor: {
          id: req.superUser.id,
          email: req.superUser.email,
          nombre: req.superUser.nombre
        },
        fechaEliminacion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error eliminando restaurante completamente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar el restaurante',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/super-admin/subscriptions/auto-block-expired
 * Ejecutar bloqueo automático de suscripciones vencidas
 */
router.post('/auto-block-expired', authenticateSuperAdmin, async (req, res) => {
  try {
    const { 
      gracePeriodDays = 3, // Días de gracia después del vencimiento
      dryRun = false,      // Solo simular, no ejecutar cambios
      notifyUsers = true   // Enviar notificaciones a usuarios afectados
    } = req.body;

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - gracePeriodDays);

    // Buscar suscripciones vencidas que aún están activas
    const suscripcionesVencidas = await prisma.suscripcion.findMany({
      where: {
        estado: 'ACTIVA',
        fechaVencimiento: {
          lt: fechaLimite
        }
      },
      include: {
        restaurante: {
          select: {
            id: true,
            nombre: true,
            email: true,
            activo: true
          }
        },
        plan: {
          select: {
            id: true,
            nombre: true,
            precio: true
          }
        }
      }
    });

    if (suscripcionesVencidas.length === 0) {
      return res.json({
        success: true,
        message: 'No hay suscripciones que requieran bloqueo automático',
        data: {
          suscripcionesProcesadas: 0,
          suscripcionesBloqueadas: 0,
          restaurantesSuspendidos: 0,
          notificacionesEnviadas: 0,
          dryRun,
          gracePeriodDays
        }
      });
    }

    let resultado = {
      suscripcionesProcesadas: suscripcionesVencidas.length,
      suscripcionesBloqueadas: 0,
      restaurantesSuspendidos: 0,
      notificacionesEnviadas: 0,
      detalles: [],
      errores: []
    };

    if (!dryRun) {
      // Ejecutar bloqueos en transacción
      await prisma.$transaction(async (tx) => {
        for (const suscripcion of suscripcionesVencidas) {
          try {
            const diasVencida = Math.floor((new Date() - new Date(suscripcion.fechaVencimiento)) / (1000 * 60 * 60 * 24));

            // Actualizar suscripción a VENCIDA
            await tx.suscripcion.update({
              where: { id: suscripcion.id },
              data: { 
                estado: 'VENCIDA',
                notasAdmin: `Bloqueada automáticamente después de ${diasVencida} días de vencimiento. Período de gracia: ${gracePeriodDays} días.`
              }
            });

            // Suspender el restaurante si está activo
            let restauranteSuspendido = false;
            if (suscripcion.restaurante.activo) {
              await tx.restaurante.update({
                where: { id: suscripcion.restauranteId },
                data: { activo: false }
              });
              restauranteSuspendido = true;
              resultado.restaurantesSuspendidos++;
            }

            resultado.suscripcionesBloqueadas++;

            // Crear notificación si está habilitado
            if (notifyUsers) {
              await tx.notificacionUsuario.create({
                data: {
                  restauranteId: suscripcion.restauranteId,
                  tipo: 'SUSCRIPCION_VENCIDA',
                  titulo: 'Suscripción Vencida - Servicio Suspendido',
                  mensaje: `Su suscripción venció hace ${diasVencida} días y el servicio ha sido suspendido automáticamente. Para reactivar su cuenta, por favor renueve su suscripción o póngase en contacto con nuestro equipo de soporte.`,
                  enviadaPorId: req.superUser.id,
                  notificationKey: `auto-block-${suscripcion.id}`
                }
              });
              resultado.notificacionesEnviadas++;
            }

            resultado.detalles.push({
              restauranteId: suscripcion.restauranteId,
              restauranteNombre: suscripcion.restaurante.nombre,
              planNombre: suscripcion.plan.nombre,
              fechaVencimiento: suscripcion.fechaVencimiento,
              diasVencida,
              restauranteSuspendido,
              notificacionEnviada: notifyUsers
            });

          } catch (error) {
            resultado.errores.push({
              restauranteId: suscripcion.restauranteId,
              restauranteNombre: suscripcion.restaurante.nombre,
              error: error.message
            });
          }
        }
      });
    } else {
      // Modo simulación - solo generar reporte
      for (const suscripcion of suscripcionesVencidas) {
        const diasVencida = Math.floor((new Date() - new Date(suscripcion.fechaVencimiento)) / (1000 * 60 * 60 * 24));
        
        resultado.detalles.push({
          restauranteId: suscripcion.restauranteId,
          restauranteNombre: suscripcion.restaurante.nombre,
          planNombre: suscripcion.plan.nombre,
          fechaVencimiento: suscripcion.fechaVencimiento,
          diasVencida,
          restauranteSuspendido: suscripcion.restaurante.activo, // Se suspendería
          notificacionEnviada: notifyUsers,
          simulacion: true
        });
      }
    }

    // Log de la operación
    console.log(`🔒 Bloqueo automático ejecutado por Super Admin ${req.superUser.email}:`, {
      ejecutadoPor: req.superUser.id,
      fecha: new Date().toISOString(),
      dryRun,
      gracePeriodDays,
      resultado
    });

    res.json({
      success: true,
      message: dryRun 
        ? `Simulación completada: ${suscripcionesVencidas.length} suscripciones serían bloqueadas`
        : `Bloqueo automático completado: ${resultado.suscripcionesBloqueadas} suscripciones bloqueadas`,
      data: {
        ...resultado,
        dryRun,
        gracePeriodDays,
        ejecutadoPor: {
          id: req.superUser.id,
          email: req.superUser.email,
          nombre: req.superUser.nombre
        },
        fechaEjecucion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en bloqueo automático:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor en bloqueo automático',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/super-admin/subscriptions/:id/orders
 * Obtener órdenes de un restaurante específico para debugging
 */
router.get('/:id/orders', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      limit = 50, 
      offset = 0, 
      fecha, 
      estado,
      debug = false 
    } = req.query;

    // Verificar que la suscripción existe
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { id },
      include: { 
        restaurante: {
          select: {
            id: true,
            nombre: true,
            slug: true
          }
        }
      }
    });

    if (!suscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    // Build where clause para órdenes
    const where = {
      restauranteId: suscripcion.restaurante.id
    };

    if (estado) {
      where.estado = estado;
    }

    if (fecha) {
      // Crear fechas usando la zona horaria del servidor (America/Managua)
      // Esto evita problemas de timezone al parsear fechas
      const year = parseInt(fecha.split('-')[0]);
      const month = parseInt(fecha.split('-')[1]) - 1; // Los meses en JS van de 0-11
      const day = parseInt(fecha.split('-')[2]);
      
      const startDate = new Date(year, month, day, 0, 0, 0, 0);  // Inicio del día local
      const endDate = new Date(year, month, day + 1, 0, 0, 0, 0); // Inicio del día siguiente local
      
      where.createdAt = {
        gte: startDate,
        lt: endDate
      };
    }

    // Obtener órdenes con información detallada
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
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.orden.count({ where });

    // Si debug=true, incluir información del timezone para diagnosticar
    let debugInfo = {};
    if (debug === 'true') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      debugInfo = {
        timezone: {
          TZ: process.env.TZ || 'No configurado',
          serverTime: now.toISOString(),
          serverTimeLocal: now.toLocaleString('es-NI'),
          todayStart: todayStart.toISOString(),
          todayEnd: todayEnd.toISOString()
        },
        filtros: {
          fecha: fecha || 'No especificada',
          fechaParseada: fecha ? new Date(fecha).toISOString() : 'N/A',
          rangoCalculado: fecha ? {
            inicio: (() => {
              const year = parseInt(fecha.split('-')[0]);
              const month = parseInt(fecha.split('-')[1]) - 1;
              const day = parseInt(fecha.split('-')[2]);
              return new Date(year, month, day, 0, 0, 0, 0).toISOString();
            })(),
            fin: (() => {
              const year = parseInt(fecha.split('-')[0]);
              const month = parseInt(fecha.split('-')[1]) - 1;
              const day = parseInt(fecha.split('-')[2]);
              return new Date(year, month, day + 1, 0, 0, 0, 0).toISOString();
            })()
          } : 'N/A'
        },
        primerasOrdenes: orders.slice(0, 3).map(order => ({
          id: order.id,
          numeroOrden: order.numeroOrden,
          createdAt: order.createdAt.toISOString(),
          createdAtLocal: order.createdAt.toLocaleString('es-NI'),
          fechaOrden: order.fechaOrden ? order.fechaOrden.toISOString() : null,
          fechaOrdenLocal: order.fechaOrden ? order.fechaOrden.toLocaleString('es-NI') : null
        }))
      };
    }

    res.json({
      success: true,
      data: {
        restaurante: suscripcion.restaurante,
        orders,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        },
        ...(debug === 'true' && { debug: debugInfo })
      }
    });

  } catch (error) {
    console.error('Error obteniendo órdenes para debugging:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 