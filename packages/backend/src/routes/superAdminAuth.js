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
 * POST /api/super-admin/auth/login
 * Login de super administrador
 */
router.post('/login', async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password } = value;

    // Buscar super usuario
    const superUser = await prisma.superUsuario.findUnique({
      where: { email }
    });

    if (!superUser || !superUser.activo) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, superUser.password);
    if (!isValidPassword) {
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
    const token = jwt.sign(
      {
        userId: superUser.id,
        email: superUser.email,
        role: 'SUPER_ADMIN'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

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
    console.error('Error en login de super admin:', error);
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
 * POST /api/super-admin/auth/logout
 * Logout (invalidar token del lado del cliente)
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
 * PUT /api/super-admin/auth/change-password
 * Cambiar contraseña del super administrador
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
 * PUT /api/super-admin/auth/profile
 * Actualizar perfil del super administrador
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