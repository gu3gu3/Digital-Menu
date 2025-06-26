const express = require('express');
const QRCode = require('qrcode');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { prisma } = require('../config/database');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const tableSchema = Joi.object({
  numero: Joi.number().integer().required().min(1).max(999),
  nombre: Joi.string().optional().max(50),
  capacidad: Joi.number().integer().min(1).max(20).default(4)
});

const updateTableSchema = Joi.object({
  numero: Joi.number().integer().optional().min(1).max(999),
  nombre: Joi.string().optional().max(50),
  capacidad: Joi.number().integer().min(1).max(20),
  activa: Joi.boolean().optional()
});

/**
 * @swagger
 * /api/tables:
 *   get:
 *     summary: Obtener todas las mesas del restaurante
 *     description: Recupera la lista completa de mesas con información de sesiones activas y órdenes pendientes
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mesas obtenida exitosamente
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
 *                     mesas:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Table'
 *                           - type: object
 *                             properties:
 *                               estaActiva:
 *                                 type: boolean
 *                                 description: Si la mesa tiene sesiones activas
 *                                 example: true
 *                               ordenesActivas:
 *                                 type: integer
 *                                 description: Número de órdenes activas en la mesa
 *                                 example: 2
 *                     total:
 *                       type: integer
 *                       description: Número total de mesas
 *                       example: 15
 *             example:
 *               success: true
 *               data:
 *                 mesas:
 *                   - id: 1
 *                     numero: 1
 *                     nombre: "Mesa Principal"
 *                     capacidad: 4
 *                     qrCodeUrl: "table-1-1-1671234567890"
 *                     activa: true
 *                     estaActiva: true
 *                     ordenesActivas: 2
 *                     restauranteId: 1
 *                     creadoEn: "2023-12-17T10:00:00.000Z"
 *                     actualizadoEn: "2023-12-17T10:00:00.000Z"
 *                 total: 15
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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
    // Una mesa está activa solo cuando tiene órdenes ENVIADAS (no solo sesiones activas)
    const mesasWithStatus = mesas.map(mesa => ({
      ...mesa,
      estaActiva: mesa._count.ordenes > 0, // Solo activa si tiene órdenes reales (no solo carrito)
      ordenesActivas: mesa._count.ordenes,
      sesionesActivas: mesa._count.sesiones, // Mantener info de sesiones para referencia
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

/**
 * @swagger
 * /api/tables:
 *   post:
 *     summary: Crear nueva mesa
 *     description: Crea una nueva mesa en el restaurante con código QR automático
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *             properties:
 *               numero:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 999
 *                 description: Número de la mesa
 *                 example: 5
 *               nombre:
 *                 type: string
 *                 maxLength: 50
 *                 description: Nombre personalizado de la mesa (opcional)
 *                 example: "Mesa VIP"
 *               capacidad:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 4
 *                 description: Capacidad de personas de la mesa
 *                 example: 6
 *           example:
 *             numero: 5
 *             nombre: "Mesa VIP"
 *             capacidad: 6
 *     responses:
 *       200:
 *         description: Mesa creada exitosamente
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
 *                     mesa:
 *                       $ref: '#/components/schemas/Table'
 *                     qrUrl:
 *                       type: string
 *                       description: URL pública del menú con mesa específica
 *                       example: "https://menuview.app/menu/bella-vista?mesa=5"
 *                     qrCodeImage:
 *                       type: string
 *                       description: Imagen del código QR en formato data URL
 *                       example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *                 message:
 *                   type: string
 *                   example: "Mesa creada exitosamente"
 *       400:
 *         description: Error de validación o mesa duplicada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               numeroRequerido:
 *                 summary: Número requerido
 *                 value:
 *                   success: false
 *                   error: "\"numero\" is required"
 *               mesaDuplicada:
 *                 summary: Mesa duplicada
 *                 value:
 *                   success: false
 *                   error: "Ya existe una mesa con este número"
 *               limitePlan:
 *                 summary: Límite del plan alcanzado
 *                 value:
 *                   success: false
 *                   error: "Has alcanzado el límite de 10 mesas para el plan Básico"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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
    const { numero, nombre, capacidad } = value;

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
    const qrUrl = `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/menu/${restauranteSlug}?mesa=${numero}`;

    // Create table
    const mesa = await prisma.mesa.create({
      data: {
        numero,
        nombre,
        capacidad,
        qrCodeUrl: qrCode,
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
      value.qrCodeUrl = newQrCode;
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

    const mesa = await prisma.mesa.findFirst({
      where: {
        id,
        restauranteId,
      },
      include: {
        restaurante: {
          select: { slug: true }
        }
      }
    });

    if (!mesa) {
      return res.status(404).json({ success: false, error: 'Mesa no encontrada' });
    }

    const qrUrl = `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/menu/${mesa.restaurante.slug}?mesa=${mesa.numero}`;

    const qrCodeImage = await QRCode.toDataURL(qrUrl, {
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
        qrUrl,
        qrCodeImage
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

    const restaurante = await prisma.restaurante.findUnique({
      where: { id: restauranteId },
      select: { nombre: true, slug: true }
    });
    
    const mesas = await prisma.mesa.findMany({
      where: { restauranteId },
      orderBy: { numero: 'asc' },
      select: { id: true, numero: true, nombre: true }
    });

    if (mesas.length === 0) {
      return res.status(404).json({ success: false, error: 'No se encontraron mesas para este restaurante.' });
    }

    const qrCodes = await Promise.all(
      mesas.map(async (mesa) => {
        const qrUrl = `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/menu/${restaurante.slug}?mesa=${mesa.numero}`;
        
        try {
          const qrCodeImage = await QRCode.toDataURL(qrUrl, {
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
            qrCodeImage: qrCodeImage
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
          nombre: restaurante.nombre
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

// Routes with Swagger documentation

/**
 * @swagger
 * /api/tables:
 *   get:
 *     summary: Obtener mesas del restaurante
 *     description: Devuelve todas las mesas del restaurante con su estado actual
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mesas obtenida exitosamente
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
 *                     mesas:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Table'
 *                           - type: object
 *                             properties:
 *                               estaActiva:
 *                                 type: boolean
 *                                 description: Si la mesa tiene órdenes activas (ENVIADA, RECIBIDA, etc.)
 *                               ordenesActivas:
 *                                 type: integer
 *                                 description: Número de órdenes activas en la mesa
 *                               sesionesActivas:
 *                                 type: integer
 *                                 description: Número de sesiones activas (usuarios que escanearon QR)
 *                     total:
 *                       type: integer
 *                       description: Total de mesas
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.get('/', authenticate, requireAdmin, getTables);

/**
 * @swagger
 * /api/tables:
 *   post:
 *     summary: Crear nueva mesa
 *     description: Crea una nueva mesa y genera su código QR automáticamente
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *             properties:
 *               numero:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 description: Número identificador de la mesa
 *                 example: "1"
 *               nombre:
 *                 type: string
 *                 maxLength: 50
 *                 description: Nombre descriptivo de la mesa
 *                 example: "Mesa Principal"
 *               descripcion:
 *                 type: string
 *                 maxLength: 255
 *                 description: Descripción adicional de la mesa
 *                 example: "Mesa junto a la ventana"
 *               capacidad:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 4
 *                 description: Capacidad máxima de personas
 *                 example: 6
 *           examples:
 *             mesa_basica:
 *               summary: Mesa básica
 *               value:
 *                 numero: "1"
 *                 capacidad: 4
 *             mesa_completa:
 *               summary: Mesa con todos los datos
 *               value:
 *                 numero: "5"
 *                 nombre: "Mesa VIP"
 *                 descripcion: "Mesa privada para ocasiones especiales"
 *                 capacidad: 8
 *     responses:
 *       201:
 *         description: Mesa creada exitosamente
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
 *                     mesa:
 *                       $ref: '#/components/schemas/Table'
 *                     qrUrl:
 *                       type: string
 *                       description: URL del menú para esta mesa
 *                       example: "https://menuview.app/menu/bella-vista?mesa=1"
 *                     qrCodeImage:
 *                       type: string
 *                       description: Imagen QR en formato Data URL
 *                       example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *                 message:
 *                   type: string
 *                   example: "Mesa creada exitosamente"
 *       400:
 *         description: Datos inválidos o límite de plan alcanzado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   examples:
 *                     limite_plan:
 *                       value: "Has alcanzado el límite de 10 mesas para el plan Básico"
 *                     numero_duplicado:
 *                       value: "Ya existe una mesa con este número"
 *                     validacion:
 *                       value: "\"numero\" is required"
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.post('/', authenticate, requireAdmin, createTable);

/**
 * @swagger
 * /api/tables/{id}:
 *   put:
 *     summary: Actualizar mesa
 *     description: Actualiza los datos de una mesa existente
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la mesa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 description: Nuevo número de la mesa
 *               nombre:
 *                 type: string
 *                 maxLength: 50
 *                 description: Nuevo nombre de la mesa
 *               descripcion:
 *                 type: string
 *                 maxLength: 255
 *                 description: Nueva descripción de la mesa
 *               capacidad:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 description: Nueva capacidad de la mesa
 *               activa:
 *                 type: boolean
 *                 description: Estado activo/inactivo de la mesa
 *           examples:
 *             actualizar_capacidad:
 *               summary: Cambiar capacidad
 *               value:
 *                 capacidad: 8
 *             desactivar_mesa:
 *               summary: Desactivar mesa
 *               value:
 *                 activa: false
 *     responses:
 *       200:
 *         description: Mesa actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Table'
 *                 message:
 *                   type: string
 *                   example: "Mesa actualizada exitosamente"
 *       400:
 *         description: Datos inválidos o número duplicado
 *       404:
 *         description: Mesa no encontrada
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.put('/:id', authenticate, requireAdmin, updateTable);

/**
 * @swagger
 * /api/tables/{id}:
 *   delete:
 *     summary: Eliminar mesa
 *     description: Elimina una mesa del sistema (solo si no tiene órdenes activas)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la mesa
 *     responses:
 *       200:
 *         description: Mesa eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Mesa eliminada exitosamente"
 *       400:
 *         description: Mesa tiene órdenes activas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "No se puede eliminar una mesa con órdenes activas"
 *       404:
 *         description: Mesa no encontrada
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.delete('/:id', authenticate, requireAdmin, deleteTable);

/**
 * @swagger
 * /api/tables/{id}/qr:
 *   get:
 *     summary: Obtener código QR de mesa
 *     description: Genera y devuelve el código QR para una mesa específica
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la mesa
 *     responses:
 *       200:
 *         description: Código QR generado exitosamente
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
 *                     qrUrl:
 *                       type: string
 *                       description: URL del menú para esta mesa
 *                       example: "https://menuview.app/menu/bella-vista?mesa=1"
 *                     qrCodeImage:
 *                       type: string
 *                       description: Imagen QR en formato Data URL (base64)
 *                       example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *       404:
 *         description: Mesa no encontrada
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 *       500:
 *         description: Error generando código QR
 */
router.get('/:id/qr', authenticate, requireAdmin, getTableQR);

/**
 * @swagger
 * /api/tables/qr/all:
 *   get:
 *     summary: Obtener códigos QR de todas las mesas
 *     description: Genera y devuelve los códigos QR para todas las mesas del restaurante
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Códigos QR generados exitosamente
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
 *                     restaurant:
 *                       type: object
 *                       properties:
 *                         nombre:
 *                           type: string
 *                           example: "Bella Vista"
 *                     qrCodes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mesa:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               numero:
 *                                 type: string
 *                               nombre:
 *                                 type: string
 *                           qrUrl:
 *                             type: string
 *                             description: URL del menú para esta mesa
 *                           qrCodeImage:
 *                             type: string
 *                             description: Imagen QR en formato Data URL
 *                           error:
 *                             type: string
 *                             description: Error si no se pudo generar el QR
 *                     total:
 *                       type: integer
 *                       description: Total de códigos QR generados
 *       404:
 *         description: No se encontraron mesas
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.get('/qr/all', authenticate, requireAdmin, getAllQRCodes);

module.exports = router; 