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

module.exports = router; 