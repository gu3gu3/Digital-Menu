const express = require('express');
const QRCode = require('qrcode');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { prisma } = require('../config/database');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const tableSchema = Joi.object({
  numero: Joi.string().required().min(1).max(10),
  nombre: Joi.string().optional().max(50),
  descripcion: Joi.string().optional().max(255),
  capacidad: Joi.number().integer().min(1).max(20).default(4)
});

const updateTableSchema = Joi.object({
  numero: Joi.string().optional().min(1).max(10),
  nombre: Joi.string().optional().max(50),
  descripcion: Joi.string().optional().max(255),
  capacidad: Joi.number().integer().min(1).max(20),
  activa: Joi.boolean().optional()
});

// @desc    Get tables for restaurant
// @route   GET /api/tables
// @access  Private (Admin)
const getTables = async (req, res) => {
  try {
    const { restauranteId } = req.user;

    const mesas = await prisma.mesa.findMany({
      where: {
        restauranteId
      },
      orderBy: [
        { numero: 'asc' }
      ],
      include: {
        _count: {
          select: {
            sesiones: {
              where: {
                activa: true,
              }
            },
            ordenes: {
              where: {
                estado: {
                  notIn: ['CANCELADA', 'COMPLETADA']
                }
              }
            }
          }
        }
      }
    });

    // Transform data to include session status and active orders
    const mesasWithStatus = mesas.map(mesa => ({
      ...mesa,
      estaActiva: mesa._count.sesiones > 0,
      ordenesActivas: mesa._count.ordenes,
    }));

    res.json({
      success: true,
      data: {
        mesas: mesasWithStatus,
        total: mesas.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo mesas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Create new table
// @route   POST /api/tables
// @access  Private (Admin)
const createTable = async (req, res) => {
  try {
    const { error, value } = tableSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { restauranteId } = req.user;
    const { numero, nombre, descripcion, capacidad } = value;

    // Check plan limits
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: restauranteId },
      include: {
        plan: true,
        _count: {
          select: { mesas: true }
        }
      }
    });

    if (restaurante._count.mesas >= restaurante.plan.limiteMesas) {
      return res.status(400).json({
        success: false,
        error: `Has alcanzado el límite de ${restaurante.plan.limiteMesas} mesas para el plan ${restaurante.plan.nombre}`
      });
    }

    // Check if table number already exists
    const existingTable = await prisma.mesa.findFirst({
      where: {
        restauranteId,
        numero
      }
    });

    if (existingTable) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una mesa con este número'
      });
    }

    // Generate unique QR code
    const qrCode = `table-${restauranteId}-${numero}-${Date.now()}`;
    
    // Get restaurant slug for QR URL
    const restauranteSlug = restaurante.slug;
    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu/${restauranteSlug}?mesa=${numero}`;

    // Create table
    const mesa = await prisma.mesa.create({
      data: {
        numero,
        nombre,
        descripcion,
        capacidad,
        qrCode,
        restauranteId
      }
    });

    // Generate QR code image
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({
        success: true,
        data: {
          mesa,
          qrUrl,
          qrCodeImage: qrCodeDataURL
        },
        message: 'Mesa creada exitosamente'
      });
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
      res.json({
        success: true,
        data: {
          mesa,
          qrUrl,
          qrCodeImage: null
        },
        message: 'Mesa creada exitosamente (QR pendiente)'
      });
    }

  } catch (error) {
    console.error('Error creando mesa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private (Admin)
const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateTableSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { restauranteId } = req.user;

    // Check if table exists and belongs to restaurant
    const existingTable = await prisma.mesa.findFirst({
      where: {
        id,
        restauranteId
      },
      include: {
        restaurante: {
          select: { slug: true }
        }
      }
    });

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        error: 'Mesa no encontrada'
      });
    }

    // If updating numero, check for conflicts
    if (value.numero && value.numero !== existingTable.numero) {
      const conflictTable = await prisma.mesa.findFirst({
        where: {
          restauranteId,
          numero: value.numero,
          id: { not: id }
        }
      });

      if (conflictTable) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe una mesa con este número'
        });
      }
    }

    // If numero is being updated, regenerate QR code
    if (value.numero && value.numero !== existingTable.numero) {
      const restauranteSlug = existingTable.restaurante.slug;
      const newQrCode = `table-${restauranteId}-${value.numero}-${Date.now()}`;
      value.qrCode = newQrCode;
    }

    // Update table
    const mesa = await prisma.mesa.update({
      where: { id },
      data: value
    });

    res.json({
      success: true,
      data: { mesa },
      message: 'Mesa actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando mesa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (Admin)
const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { restauranteId } = req.user;

    // Check if table exists and belongs to restaurant
    const existingTable = await prisma.mesa.findFirst({
      where: {
        id,
        restauranteId
      },
      include: {
        _count: {
          select: {
            ordenes: {
              where: {
                estado: {
                  in: ['ENVIADA', 'RECIBIDA', 'CONFIRMADA', 'EN_PREPARACION']
                }
              }
            }
          }
        }
      }
    });

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        error: 'Mesa no encontrada'
      });
    }

    // Check if table has active orders
    if (existingTable._count.ordenes > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar una mesa con órdenes activas'
      });
    }

    await prisma.mesa.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Mesa eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando mesa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get table QR code
// @route   GET /api/tables/:id/qr
// @access  Private (Admin)
const getTableQR = async (req, res) => {
  try {
    const { id } = req.params;
    const { restauranteId } = req.user;

    // Get table and restaurant info
    const mesa = await prisma.mesa.findFirst({
      where: {
        id,
        restauranteId
      },
      include: {
        restaurante: {
          select: { slug: true, nombre: true }
        }
      }
    });

    if (!mesa) {
      return res.status(404).json({
        success: false,
        error: 'Mesa no encontrada'
      });
    }

    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu/${mesa.restaurante.slug}?mesa=${mesa.numero}`;

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      success: true,
      data: {
        mesa: {
          id: mesa.id,
          numero: mesa.numero,
          nombre: mesa.nombre
        },
        restaurant: {
          nombre: mesa.restaurante.nombre
        },
        qrUrl,
        qrCodeImage: qrCodeDataURL
      }
    });

  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get QR codes for all tables
// @route   GET /api/tables/qr/all
// @access  Private (Admin)
const getAllQRCodes = async (req, res) => {
  try {
    const { restauranteId } = req.user;

    // Get all active tables
    const mesas = await prisma.mesa.findMany({
      where: {
        restauranteId,
        activa: true
      },
      include: {
        restaurante: {
          select: { slug: true, nombre: true }
        }
      },
      orderBy: { numero: 'asc' }
    });

    if (mesas.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No hay mesas activas'
      });
    }

    // Generate QR codes for all tables
    const qrCodes = await Promise.all(
      mesas.map(async (mesa) => {
        const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu/${mesa.restaurante.slug}?mesa=${mesa.numero}`;
        
        try {
          const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          return {
            mesa: {
              id: mesa.id,
              numero: mesa.numero,
              nombre: mesa.nombre
            },
            qrUrl,
            qrCodeImage: qrCodeDataURL
          };
        } catch (error) {
          console.error(`Error generating QR for table ${mesa.numero}:`, error);
          return {
            mesa: {
              id: mesa.id,
              numero: mesa.numero,
              nombre: mesa.nombre
            },
            qrUrl,
            qrCodeImage: null,
            error: 'Error generando QR'
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        restaurant: {
          nombre: mesas[0].restaurante.nombre
        },
        qrCodes,
        total: qrCodes.length
      }
    });

  } catch (error) {
    console.error('Error generando QRs:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes
router.get('/', authenticate, requireAdmin, getTables);
router.post('/', authenticate, requireAdmin, createTable);
router.put('/:id', authenticate, requireAdmin, updateTable);
router.delete('/:id', authenticate, requireAdmin, deleteTable);
router.get('/:id/qr', authenticate, requireAdmin, getTableQR);
router.get('/qr/all', authenticate, requireAdmin, getAllQRCodes);

module.exports = router; 