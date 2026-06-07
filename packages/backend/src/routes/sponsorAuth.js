const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { prisma } = require('../config/database');

const router = express.Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().required().messages({
    'any.required': 'La contraseña es requerida'
  })
});

// Utility function to generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId, role: 'SPONSOR' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/sponsor/auth/login
// @desc    Iniciar sesión como Sponsor
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password } = value;

    const sponsor = await prisma.usuarioSponsor.findUnique({
      where: { email }
    });

    if (!sponsor) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    if (!sponsor.activo) {
      return res.status(401).json({
        success: false,
        error: 'Tu cuenta ha sido desactivada. Contacta al soporte.'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, sponsor.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // We don't have lastLogin in UsuarioSponsor, so we skip it.
    // However, if we need it in the future, we can add it to schema.prisma.

    const token = generateToken(sponsor.id);

    const sponsorData = {
      id: sponsor.id,
      email: sponsor.email,
      nombreEmpresa: sponsor.nombreEmpresa,
      contactoName: sponsor.contactoName,
      logoUrl: sponsor.logoUrl,
      role: 'SPONSOR'
    };

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: sponsorData,
        token
      }
    });

  } catch (error) {
    console.error('Error en login sponsor:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al iniciar sesión'
    });
  }
});

module.exports = router;
