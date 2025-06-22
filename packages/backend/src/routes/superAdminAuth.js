const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const { authenticateSuperAdmin } = require('../middleware/superAdminAuth');

const router = express.Router();
const prisma = new PrismaClient();

// Esquemas de validación
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const createSuperUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  nombre: Joi.string().min(2).required(),
  apellido: Joi.string().optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'La contraseña actual es requerida'
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
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
  })
});

/**
 * @swagger
 * /api/super-admin/auth/login:
 *   post:
 *     summary: Iniciar sesión como super administrador
 *     description: Autentica al super administrador del sistema
 *     tags: [Super Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del super administrador
 *                 example: "admin@menuview.app"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Contraseña del super administrador
 *                 example: "SuperAdmin123!"
 *           examples:
 *             super_admin_login:
 *               summary: Login de super admin
 *               value:
 *                 email: "admin@menuview.app"
 *                 password: "SuperAdmin123!"
 *     responses:
 *       200:
 *         description: Login exitoso
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
 *                   example: "Login exitoso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token para super admin
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         nombre:
 *                           type: string
 *                         apellido:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: "SUPER_ADMIN"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales incorrectas
 *       403:
 *         description: Cuenta inactiva
 */
router.post('/login', async (req, res) => {
  console.log('--- Super Admin Login: Intento recibido ---');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Definido' : '!!! NO DEFINIDO !!!');

  try {
    // Validar entrada
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      console.log('Error de validación de Joi.');
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password } = value;
    console.log(`Buscando super admin con email: ${email}`);

    // Buscar super usuario
    const superUser = await prisma.superUsuario.findUnique({
      where: { email }
    });

    if (!superUser || !superUser.activo) {
      console.log('Super admin no encontrado o inactivo.');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('Super admin encontrado. Comparando contraseñas...');
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, superUser.password);
    console.log(`Contraseña válida: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log('La contraseña no coincide.');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    await prisma.superUsuario.update({
      where: { id: superUser.id },
      data: { lastLogin: new Date() }
    });

    // Generar token JWT
    console.log('Contraseña correcta. Generando token JWT...');
    const token = jwt.sign(
      {
        userId: superUser.id,
        email: superUser.email,
        role: 'SUPER_ADMIN'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('Login de super admin exitoso.');
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: superUser.id,
          email: superUser.email,
          nombre: superUser.nombre,
          apellido: superUser.apellido,
          lastLogin: superUser.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('--- !!! ERROR CRÍTICO EN LOGIN DE SUPER ADMIN !!! ---');
    console.error('Mensaje de error:', error.message);
    console.error('Stack de error:', error.stack);
    console.error('--- FIN DEL REPORTE DE ERROR ---');
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/super-admin/auth/create-super-user
 * Crear nuevo super usuario (solo para desarrollo inicial)
 */
router.post('/create-super-user', async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = createSuperUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password, nombre, apellido } = value;

    // Verificar si ya existe un super usuario con ese email
    const existingSuperUser = await prisma.superUsuario.findUnique({
      where: { email }
    });

    if (existingSuperUser) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un super usuario con ese email'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear super usuario
    const superUser = await prisma.superUsuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido
      }
    });

    res.status(201).json({
      success: true,
      message: 'Super usuario creado exitosamente',
      data: {
        id: superUser.id,
        email: superUser.email,
        nombre: superUser.nombre,
        apellido: superUser.apellido
      }
    });

  } catch (error) {
    console.error('Error creando super usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/super-admin/auth/me
 * Obtener información del super usuario actual
 */
router.get('/me', authenticateSuperAdmin, async (req, res) => {
  try {
    const superUser = await prisma.superUsuario.findUnique({
      where: { id: req.superUser.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        lastLogin: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: superUser
    });

  } catch (error) {
    console.error('Error obteniendo perfil de super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/auth/logout:
 *   post:
 *     summary: Cerrar sesión de super administrador
 *     description: Invalida el token de autenticación del super administrador
 *     tags: [Super Admin Auth]
 *     security:
 *       - superAdminAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
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
 *                   example: "Logout exitoso"
 */
router.post('/logout', authenticateSuperAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout de super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/auth/change-password:
 *   put:
 *     summary: Cambiar contraseña del super administrador
 *     description: Permite al super administrador cambiar su contraseña
 *     tags: [Super Admin Auth]
 *     security:
 *       - superAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Contraseña actual
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nueva contraseña
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       400:
 *         description: Datos inválidos o contraseña actual incorrecta
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/change-password', authenticateSuperAdmin, async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { currentPassword, newPassword } = value;
    const userId = req.superUser.id;

    // Obtener usuario actual
    const superUser = await prisma.superUsuario.findUnique({
      where: { id: userId }
    });

    if (!superUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, superUser.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, superUser.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await prisma.superUsuario.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error cambiando contraseña de super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/auth/profile:
 *   put:
 *     summary: Actualizar perfil del super administrador
 *     description: Permite al super administrador actualizar su información personal
 *     tags: [Super Admin Auth]
 *     security:
 *       - superAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del super administrador
 *               apellido:
 *                 type: string
 *                 description: Apellido del super administrador
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del super administrador
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
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
 *                   example: "Perfil actualizado exitosamente"
 *                 data:
 *                   type: object
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Email ya existe
 */
router.put('/profile', authenticateSuperAdmin, async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { nombre, apellido, email } = value;
    const userId = req.superUser.id;

    // Verificar si el email está siendo cambiado y ya existe
    const existingSuperUser = await prisma.superUsuario.findFirst({
      where: {
        email: email,
        id: { not: userId }
      }
    });

    if (existingSuperUser) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un super usuario con este email'
      });
    }

    // Actualizar perfil
    const updatedSuperUser = await prisma.superUsuario.update({
      where: { id: userId },
      data: {
        nombre,
        apellido,
        email
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        activo: true,
        lastLogin: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedSuperUser
    });

  } catch (error) {
    console.error('Error actualizando perfil de super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/super-admin/auth/me
 * Obtener perfil actual del super administrador
 */
router.get('/me', authenticateSuperAdmin, async (req, res) => {
  try {
    const userId = req.superUser.id;

    const superUser = await prisma.superUsuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        activo: true,
        lastLogin: true,
        createdAt: true
      }
    });

    if (!superUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: superUser
    });

  } catch (error) {
    console.error('Error obteniendo perfil de super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 