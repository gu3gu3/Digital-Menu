const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');
const { generateUniqueSlug } = require('../utils/slugGenerator');

const router = express.Router();

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

// @desc    Login user (Admin or Mesero)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
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

// @desc    Register new restaurant with admin user
// @route   POST /api/auth/register
// @access  Public
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

    // Get default free plan
    const planGratuito = await prisma.plan.findUnique({
      where: { nombre: 'Plan Gratuito' }
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

// Routes
router.post('/login', login);
router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authenticate, resendVerification);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router; 