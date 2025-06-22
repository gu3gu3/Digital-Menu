const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { prisma } = require('../config/database');

const router = express.Router();

// Validation schemas
const createMeseroSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  }),
  nombre: Joi.string().min(2).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  apellido: Joi.string().min(2).optional(),
  telefono: Joi.string().optional()
});

const updateMeseroSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  nombre: Joi.string().min(2).optional(),
  apellido: Joi.string().min(2).optional(),
  telefono: Joi.string().optional(),
  activo: Joi.boolean().optional()
});

// @desc    Get all meseros for restaurant
// @route   GET /api/staff/meseros
// @access  Private (Admin)
const getMeseros = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { activo, search, limit = 50, offset = 0 } = req.query;

    // Build where clause
    const where = {
      restauranteId: restauranteId
    };

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    if (search) {
      where.OR = [
        {
          nombre: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          apellido: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const [meseros, total] = await Promise.all([
      prisma.usuarioMesero.findMany({
        where,
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          activo: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.usuarioMesero.count({ where })
    ]);

    // Set no-cache headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: {
        meseros,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + meseros.length < total
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo meseros:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get single mesero
// @route   GET /api/staff/meseros/:id
// @access  Private (Admin)
const getMesero = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { id } = req.params;

    const mesero = await prisma.usuarioMesero.findFirst({
      where: {
        id: id,
        restauranteId: restauranteId
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!mesero) {
      return res.status(404).json({
        success: false,
        error: 'Mesero no encontrado'
      });
    }

    res.json({
      success: true,
      data: mesero
    });

  } catch (error) {
    console.error('Error obteniendo mesero:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Create new mesero
// @route   POST /api/staff/meseros
// @access  Private (Admin)
const createMesero = async (req, res) => {
  try {
    const { restauranteId, restaurante } = req.user;

    // Validate input
    const { error, value } = createMeseroSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password, nombre, apellido, telefono } = value;

    // Check plan limits
    const meseroCount = await prisma.usuarioMesero.count({
      where: { restauranteId }
    });

    if (meseroCount >= restaurante.plan.limiteMeseros) {
      return res.status(400).json({
        success: false,
        error: `Has alcanzado el límite de meseros para tu plan (${restaurante.plan.limiteMeseros}). Actualiza tu plan para agregar más meseros.`
      });
    }

    // Check if email already exists
    const existingMesero = await prisma.usuarioMesero.findUnique({
      where: { email }
    });

    if (existingMesero) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un mesero con este email'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create mesero
    const mesero = await prisma.usuarioMesero.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        telefono,
        restauranteId,
        activo: true
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Mesero creado exitosamente',
      data: mesero
    });

  } catch (error) {
    console.error('Error creando mesero:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Update mesero
// @route   PUT /api/staff/meseros/:id
// @access  Private (Admin)
const updateMesero = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateMeseroSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password, nombre, apellido, telefono, activo } = value;

    // Check if mesero exists and belongs to restaurant
    const existingMesero = await prisma.usuarioMesero.findFirst({
      where: {
        id: id,
        restauranteId: restauranteId
      }
    });

    if (!existingMesero) {
      return res.status(404).json({
        success: false,
        error: 'Mesero no encontrado'
      });
    }

    // Check if email is being changed and already exists
    if (email && email !== existingMesero.email) {
      const emailExists = await prisma.usuarioMesero.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          error: 'Ya existe un mesero con este email'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (email) updateData.email = email;
    if (nombre) updateData.nombre = nombre;
    if (apellido !== undefined) updateData.apellido = apellido;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (activo !== undefined) updateData.activo = activo;
    
    // Hash new password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Update mesero
    const mesero = await prisma.usuarioMesero.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Mesero actualizado exitosamente',
      data: mesero
    });

  } catch (error) {
    console.error('Error actualizando mesero:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Delete mesero
// @route   DELETE /api/staff/meseros/:id
// @access  Private (Admin)
const deleteMesero = async (req, res) => {
  try {
    const { restauranteId } = req.user;
    const { id } = req.params;

    // Check if mesero exists and belongs to restaurant
    const existingMesero = await prisma.usuarioMesero.findFirst({
      where: {
        id: id,
        restauranteId: restauranteId
      }
    });

    if (!existingMesero) {
      return res.status(404).json({
        success: false,
        error: 'Mesero no encontrado'
      });
    }

    // Delete mesero
    await prisma.usuarioMesero.delete({
      where: { id: id }
    });

    res.json({
      success: true,
      message: 'Mesero eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando mesero:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get staff statistics
// @route   GET /api/staff/stats
// @access  Private (Admin)
const getStaffStats = async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's restaurant with plan info to ensure consistency
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
        error: 'Restaurante no encontrado para el usuario'
      });
    }

    const restauranteId = admin.restaurante.id;

    const totalMeseros = await prisma.usuarioMesero.count({
      where: { restauranteId },
    });

    const meserosActivos = await prisma.usuarioMesero.count({
      where: { restauranteId, activo: true },
    });

    const limitePlan = admin.restaurante.plan.limiteMeseros;
    
    // Treat a limit of 0 as unlimited
    const disponibles = limitePlan === 0 
      ? Infinity 
      : Math.max(0, limitePlan - totalMeseros);

    // Set no-cache headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: {
        totalMeseros,
        meserosActivos,
        limitePlan,
        disponibles,
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas del personal:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Apply middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// Routes with Swagger documentation

/**
 * @swagger
 * /api/staff/meseros:
 *   get:
 *     summary: Obtener lista de meseros
 *     description: Devuelve todos los meseros del restaurante con paginación
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o email
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de meseros obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Staff'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.get('/meseros', getMeseros);

/**
 * @swagger
 * /api/staff/meseros/{id}:
 *   get:
 *     summary: Obtener mesero por ID
 *     description: Devuelve la información de un mesero específico
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del mesero
 *     responses:
 *       200:
 *         description: Mesero encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       404:
 *         description: Mesero no encontrado
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.get('/meseros/:id', getMesero);

/**
 * @swagger
 * /api/staff/meseros:
 *   post:
 *     summary: Crear nuevo mesero
 *     description: Crea un nuevo mesero para el restaurante
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nombre
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del mesero
 *                 example: "mesero@restaurant.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Contraseña del mesero
 *                 example: "password123"
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 description: Nombre del mesero
 *                 example: "Carlos"
 *               apellido:
 *                 type: string
 *                 description: Apellido del mesero
 *                 example: "González"
 *               telefono:
 *                 type: string
 *                 description: Teléfono del mesero
 *                 example: "+1234567890"
 *           examples:
 *             new_mesero:
 *               summary: Nuevo mesero
 *               value:
 *                 email: "carlos@bellavista.com"
 *                 password: "mesero123"
 *                 nombre: "Carlos"
 *                 apellido: "González"
 *                 telefono: "+1234567890"
 *     responses:
 *       201:
 *         description: Mesero creado exitosamente
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
 *                   example: "Mesero creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Datos inválidos o límite de plan alcanzado
 *       409:
 *         description: Email ya existe
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.post('/meseros', createMesero);

/**
 * @swagger
 * /api/staff/meseros/{id}:
 *   put:
 *     summary: Actualizar mesero
 *     description: Actualiza la información de un mesero existente
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del mesero
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del mesero
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Nueva contraseña (opcional)
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 description: Nombre del mesero
 *               apellido:
 *                 type: string
 *                 description: Apellido del mesero
 *               telefono:
 *                 type: string
 *                 description: Teléfono del mesero
 *               activo:
 *                 type: boolean
 *                 description: Estado activo del mesero
 *     responses:
 *       200:
 *         description: Mesero actualizado exitosamente
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
 *                   example: "Mesero actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Mesero no encontrado
 *       409:
 *         description: Email ya existe
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.put('/meseros/:id', updateMesero);

/**
 * @swagger
 * /api/staff/meseros/{id}:
 *   delete:
 *     summary: Eliminar mesero
 *     description: Elimina un mesero del restaurante
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del mesero
 *     responses:
 *       200:
 *         description: Mesero eliminado exitosamente
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
 *                   example: "Mesero eliminado exitosamente"
 *       404:
 *         description: Mesero no encontrado
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.delete('/meseros/:id', deleteMesero);

/**
 * @swagger
 * /api/staff/stats:
 *   get:
 *     summary: Obtener estadísticas del personal
 *     description: Devuelve estadísticas del personal del restaurante
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
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
 *                     totalMeseros:
 *                       type: integer
 *                       description: Total de meseros registrados
 *                       example: 5
 *                     meserosActivos:
 *                       type: integer
 *                       description: Meseros activos
 *                       example: 4
 *                     limitePlan:
 *                       type: integer
 *                       description: Límite del plan (0 = ilimitado)
 *                       example: 10
 *                     disponibles:
 *                       type: number
 *                       description: Meseros disponibles para crear
 *                       example: 5
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 *       404:
 *         description: Restaurante no encontrado
 */
router.get('/stats', getStaffStats);

module.exports = router; 