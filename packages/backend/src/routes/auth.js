const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');
const { generateUniqueSlug } = require('../utils/slugGenerator');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: admin@restaurant.com
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Contraseña del usuario
 *           example: password123
 *         role:
 *           type: string
 *           enum: [ADMINISTRADOR, MESERO]
 *           default: ADMINISTRADOR
 *           description: Rol del usuario
 *     
 *     UserData:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *         nombre:
 *           type: string
 *           description: Nombre del usuario
 *         apellido:
 *           type: string
 *           description: Apellido del usuario
 *         telefono:
 *           type: string
 *           description: Teléfono del usuario
 *         role:
 *           type: string
 *           enum: [ADMINISTRADOR, MESERO]
 *           description: Rol del usuario
 *         restaurante:
 *           $ref: '#/components/schemas/RestauranteData'
 *     
 *     RestauranteData:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del restaurante
 *         nombre:
 *           type: string
 *           description: Nombre del restaurante
 *         descripcion:
 *           type: string
 *           description: Descripción del restaurante
 *         logoUrl:
 *           type: string
 *           description: URL del logo del restaurante
 *         bannerUrl:
 *           type: string
 *           description: URL del banner del restaurante
 *         plan:
 *           $ref: '#/components/schemas/PlanData'
 *     
 *     PlanData:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           description: Nombre del plan de suscripción
 *         limiteProductos:
 *           type: integer
 *           description: Límite de productos permitidos
 *         limiteOrdenes:
 *           type: integer
 *           description: Límite de órdenes mensuales
 *         limiteMesas:
 *           type: integer
 *           description: Límite de mesas
 *         limiteMeseros:
 *           type: integer
 *           description: Límite de meseros
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login exitoso
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/UserData'
 *             token:
 *               type: string
 *               description: JWT token para autenticación
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - nombre
 *         - restaurante
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email del administrador
 *           example: admin@restaurant.com
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Contraseña
 *           example: password123
 *         nombre:
 *           type: string
 *           minLength: 2
 *           description: Nombre del administrador
 *           example: Juan
 *         apellido:
 *           type: string
 *           minLength: 2
 *           description: Apellido del administrador
 *           example: Pérez
 *         telefono:
 *           type: string
 *           description: Teléfono del administrador
 *           example: +1234567890
 *         restaurante:
 *           type: object
 *           required:
 *             - nombre
 *           properties:
 *             nombre:
 *               type: string
 *               minLength: 2
 *               description: Nombre del restaurante
 *               example: Restaurante El Buen Sabor
 *             descripcion:
 *               type: string
 *               description: Descripción del restaurante
 *               example: Cocina tradicional con ingredientes frescos
 *             telefono:
 *               type: string
 *               description: Teléfono del restaurante
 *               example: +1234567890
 *             direccion:
 *               type: string
 *               description: Dirección del restaurante
 *               example: Calle Principal 123, Ciudad
 *             email:
 *               type: string
 *               format: email
 *               description: Email del restaurante
 *               example: contacto@restaurant.com
 */

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  }),
  role: Joi.string().valid('ADMINISTRADOR', 'MESERO').default('ADMINISTRADOR')
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  nombre: Joi.string().min(2).required(),
  apellido: Joi.string().min(2).optional(),
  telefono: Joi.string().optional(),
  restaurante: Joi.object({
    nombre: Joi.string().min(2).required(),
    descripcion: Joi.string().optional(),
    telefono: Joi.string().optional(),
    direccion: Joi.string().optional(),
    email: Joi.string().email().optional()
  }).required()
});

const emailVerificationSchema = Joi.object({
  token: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'La contraseña actual es requerida'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'La nueva contraseña debe tener al menos 6 caracteres',
    'any.required': 'La nueva contraseña es requerida'
  })
});

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'El token es requerido'
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

// Utility function to generate JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Utility function to generate email verification token
const generateEmailVerificationToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'email_verification' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Utility function to generate password reset token
const generatePasswordResetToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // Token válido por 1 hora
  );
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión como administrador o mesero
 *     description: Autentica a un usuario (administrador o mesero) y devuelve un token JWT junto con los datos del usuario y restaurante
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Datos de entrada inválidos
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
 *                   example: El email es requerido
 *       401:
 *         description: Credenciales inválidas o usuario inactivo
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
 *                   example: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const login = async (req, res) => {
  console.log('--- Admin/Mesero Login: Intento recibido ---');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Definido' : '!!! NO DEFINIDO !!!');

  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password, role } = value;

    // Find user based on role
    let user;
    if (role === 'ADMINISTRADOR') {
      user = await prisma.usuarioAdmin.findUnique({
        where: { email },
        include: { restaurante: { include: { plan: true } } }
      });
    } else {
      user = await prisma.usuarioMesero.findUnique({
        where: { email },
        include: { restaurante: { include: { plan: true } } }
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Check if user is active
    if (!user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo. Contacte al administrador.'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Update last login
    if (role === 'ADMINISTRADOR') {
      await prisma.usuarioAdmin.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    } else {
      await prisma.usuarioMesero.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    }

    // Generate token
    const token = generateToken(user.id, role);

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      telefono: user.telefono,
      role,
      restaurante: {
        id: user.restaurante.id,
        nombre: user.restaurante.nombre,
        descripcion: user.restaurante.descripcion,
        logoUrl: user.restaurante.logoUrl,
        bannerUrl: user.restaurante.bannerUrl,
        plan: {
          nombre: user.restaurante.plan.nombre,
          limiteProductos: user.restaurante.plan.limiteProductos,
          limiteOrdenes: user.restaurante.plan.limiteOrdenes,
          limiteMesas: user.restaurante.plan.limiteMesas,
          limiteMeseros: user.restaurante.plan.limiteMeseros
        }
      }
    };

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo restaurante con usuario administrador
 *     description: Crea un nuevo restaurante con un usuario administrador asociado y lo asigna al plan gratuito por defecto
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registro exitoso
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
 *                   example: Registro exitoso. Se ha enviado un email de verificación.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserData'
 *                     token:
 *                       type: string
 *                       description: JWT token para autenticación
 *       400:
 *         description: Datos de entrada inválidos
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
 *                   example: El nombre es requerido
 *       409:
 *         description: El email ya está registrado
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
 *                   example: El email ya está registrado
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const register = async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password, nombre, apellido, telefono, restaurante } = value;

    // Check if user already exists
    const existingAdmin = await prisma.usuarioAdmin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Get default free plan (buscar por precio 0 para mayor flexibilidad)
    const planGratuito = await prisma.plan.findFirst({
      where: { 
        precio: 0,
        activo: true
      },
      orderBy: { createdAt: 'asc' } // Tomar el más antiguo si hay varios
    });

    if (!planGratuito) {
      return res.status(500).json({
        success: false,
        error: 'Plan gratuito no encontrado. Contacte al soporte.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate unique slug for restaurant
    const restauranteSlug = await generateUniqueSlug(restaurante.nombre);

    // Create restaurant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create restaurant
      const newRestaurante = await tx.restaurante.create({
        data: {
          nombre: restaurante.nombre,
          slug: restauranteSlug,
          descripcion: restaurante.descripcion,
          telefono: restaurante.telefono,
          direccion: restaurante.direccion,
          email: restaurante.email,
          planId: planGratuito.id,
          activo: true
        }
      });

      // Create admin user
      const newAdmin = await tx.usuarioAdmin.create({
        data: {
          email,
          password: hashedPassword,
          nombre,
          apellido,
          telefono,
          restauranteId: newRestaurante.id,
          activo: true,
          emailVerificado: false
        },
        include: {
          restaurante: {
            include: { plan: true }
          }
        }
      });

      return newAdmin;
    });

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(result.id, result.email);
    
    // Send verification and welcome emails
    try {
      await emailService.sendVerificationEmail(
        result.email, 
        verificationToken, 
        result.nombre
      );
      
      await emailService.sendWelcomeEmail(
        result.email,
        result.nombre,
        result.restaurante.nombre
      );
      
      console.log(`📧 Emails enviados a ${result.email}`);
    } catch (emailError) {
      console.error('⚠️ Error enviando emails (registro continuará):', emailError.message);
    }

    // Generate auth token
    const token = generateToken(result.id, 'ADMINISTRADOR');

    // Prepare user data for response
    const userData = {
      id: result.id,
      email: result.email,
      nombre: result.nombre,
      apellido: result.apellido,
      telefono: result.telefono,
      role: 'ADMINISTRADOR',
      emailVerificado: result.emailVerificado,
      restaurante: {
        id: result.restaurante.id,
        nombre: result.restaurante.nombre,
        slug: result.restaurante.slug,
        descripcion: result.restaurante.descripcion,
        plan: {
          nombre: result.restaurante.plan.nombre,
          limiteProductos: result.restaurante.plan.limiteProductos,
          limiteOrdenes: result.restaurante.plan.limiteOrdenes,
          limiteMesas: result.restaurante.plan.limiteMesas,
          limiteMeseros: result.restaurante.plan.limiteMeseros
        }
      }
    };

    res.status(201).json({
      success: true,
      message: 'Registro exitoso. ¡Bienvenido a Digital Menu!',
      data: {
        user: userData,
        token,
        menuUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu/${result.restaurante.slug}`
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { error, value } = emailVerificationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Token de verificación requerido'
      });
    }

    const { token } = value;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'email_verification') {
      return res.status(400).json({
        success: false,
        error: 'Token de verificación inválido'
      });
    }

    // Update user email verification status
    const updatedUser = await prisma.usuarioAdmin.update({
      where: { 
        id: decoded.userId,
        email: decoded.email 
      },
      data: {
        emailVerificado: true
      }
    });

    res.json({
      success: true,
      message: 'Email verificado exitosamente'
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        error: 'El token de verificación ha expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        error: 'Token de verificación inválido'
      });
    }

    console.error('Error en verificación de email:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.emailVerificado) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está verificado'
      });
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken(user.id, user.email);
    
    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.nombre
      );
      console.log(`📧 Email de verificación reenviado a ${user.email}`);
    } catch (emailError) {
      console.error('Error reenviando email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Error enviando email de verificación'
      });
    }

    res.json({
      success: true,
      message: 'Email de verificación reenviado'
    });

  } catch (error) {
    console.error('Error al reenviar verificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
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
    const userId = req.user.id;

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
    const userId = req.user.id;

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

// @desc    Request password reset
// @route   POST /api/auth/request-password-reset
// @access  Public
const requestPasswordReset = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = requestPasswordResetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email } = value;

    // Find user by email
    const user = await prisma.usuarioAdmin.findUnique({
      where: { email },
      include: {
        restaurante: true
      }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
      });
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken(user.id, user.email);
    
    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.nombre,
        user.restaurante?.nombre || 'tu restaurante'
      );
      console.log(`📧 Email de recuperación enviado a ${user.email}`);
    } catch (emailError) {
      console.error('Error enviando email de recuperación:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Error enviando email de recuperación'
      });
    }

    res.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
    });

  } catch (error) {
    console.error('Error en solicitud de recuperación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { token, newPassword } = value;

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify token type
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }

    // Find user
    const user = await prisma.usuarioAdmin.findUnique({
      where: { 
        id: decoded.userId,
        email: decoded.email 
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.usuarioAdmin.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log(`🔐 Contraseña restablecida para usuario: ${user.email}`);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes with Swagger documentation

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de administrador de restaurante
 *     description: Autentica a un administrador de restaurante y devuelve un token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin_login:
 *               summary: Login de administrador
 *               value:
 *                 email: "admin@bellavista.com"
 *                 password: "demo123456"
 *                 role: "ADMINISTRADOR"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Datos inválidos o rol incorrecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Email no verificado o cuenta inactiva
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo administrador de restaurante
 *     description: Crea una nueva cuenta de administrador con su restaurante asociado
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             new_restaurant:
 *               summary: Registro completo
 *               value:
 *                 email: "admin@nuevorestaurante.com"
 *                 password: "password123"
 *                 nombre: "Juan"
 *                 apellido: "Pérez"
 *                 telefono: "+1234567890"
 *                 restaurante:
 *                   nombre: "Nuevo Restaurante"
 *                   descripcion: "Cocina tradicional"
 *                   telefono: "+1234567890"
 *                   direccion: "Calle Principal 123"
 *                   email: "contacto@nuevorestaurante.com"
 *     responses:
 *       201:
 *         description: Registro exitoso
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
 *                   example: "Registro exitoso. Se ha enviado un email de verificación."
 *       400:
 *         description: Datos inválidos o email ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verificar email de usuario
 *     description: Verifica el email del usuario usando el token enviado por correo
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de verificación enviado por email
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Reenviar email de verificación
 *     description: Reenvía el email de verificación al usuario
 *     tags: [Auth]
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *                 example: "admin@restaurant.com"
 *     responses:
 *       200:
 *         description: Email de verificación reenviado
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/resend-verification', authenticate, resendVerification);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     description: Devuelve la información del usuario y restaurante autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
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
 *                     user:
 *                       $ref: '#/components/schemas/UserData'
 *       401:
 *         description: Token inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Invalida el token de autenticación actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
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
router.post('/logout', authenticate, logout);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Cambiar contraseña
 *     description: Permite al usuario cambiar su contraseña actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
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
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nueva contraseña
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       400:
 *         description: Datos inválidos o contraseña actual incorrecta
 *       401:
 *         description: Token inválido
 */
router.put('/change-password', authenticate, changePassword);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     description: Permite actualizar la información personal del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 description: Nombre del usuario
 *                 example: "Juan Carlos"
 *               apellido:
 *                 type: string
 *                 minLength: 2
 *                 description: Apellido del usuario
 *                 example: "Pérez González"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *                 example: "admin@restaurant.com"
 *               telefono:
 *                 type: string
 *                 description: Teléfono del usuario
 *                 example: "+1234567890"
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
 *                   $ref: '#/components/schemas/UserData'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido
 *       409:
 *         description: Email ya existe
 */
router.put('/profile', authenticate, updateProfile);

// Routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', authenticate, resendVerification);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.put('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);
router.get('/me', authenticate, getMe);

module.exports = router; 