const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @route   POST /api/partner/login
// @desc    Autenticar partner
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const partner = await prisma.usuarioPartner.findUnique({
      where: { email }
    });

    if (!partner || !partner.activo) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas o cuenta inactiva' });
    }

    const isPasswordValid = await bcrypt.compare(password, partner.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    await prisma.usuarioPartner.update({
      where: { id: partner.id },
      data: { lastLogin: new Date() }
    });

    const token = generateToken(partner.id, 'PARTNER');

    res.json({
      success: true,
      data: {
        token,
        partner: {
          id: partner.id,
          nombreAgencia: partner.nombreAgencia,
          email: partner.email,
          porcentajeComision: partner.porcentajeComision
        }
      }
    });

  } catch (error) {
    console.error('Error login partner:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// @route   GET /api/partner/restaurantes
// @desc    Obtener restaurantes de este partner
// @access  Private (PARTNER)
router.get('/restaurantes', authenticate, requireRole(['PARTNER']), async (req, res) => {
  try {
    const partnerId = req.user.userId;
    
    const restaurantes = await prisma.restaurante.findMany({
      where: { partnerId },
      include: {
        plan: true,
        suscripcion: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular días restantes de comisión para cada restaurante
    const now = new Date();
    const result = restaurantes.map(rest => {
      let isCommissionActive = false;
      let daysLeft = 0;
      
      if (rest.fechaAsignacionPartner) {
        const expiresAt = new Date(rest.fechaAsignacionPartner);
        expiresAt.setMonth(expiresAt.getMonth() + 6);
        
        if (now < expiresAt) {
          isCommissionActive = true;
          daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        }
      }
      
      return {
        ...rest,
        isCommissionActive,
        daysLeftForCommission: daysLeft
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching partner restaurantes:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// @route   GET /api/partner/stats
// @desc    Obtener ganancias proyectadas del partner
// @access  Private (PARTNER)
router.get('/stats', authenticate, requireRole(['PARTNER']), async (req, res) => {
  try {
    const partnerId = req.user.userId;
    
    const restaurantes = await prisma.restaurante.findMany({
      where: { partnerId },
      include: {
        plan: true,
        suscripcion: true
      }
    });

    const now = new Date();
    let totalMonthlyComission = 0;
    let activeCommissionsCount = 0;
    let expiredCommissionsCount = 0;

    restaurantes.forEach(rest => {
      // Check if commission is active (within 6 months)
      let isCommissionActive = false;
      if (rest.fechaAsignacionPartner) {
        const expiresAt = new Date(rest.fechaAsignacionPartner);
        expiresAt.setMonth(expiresAt.getMonth() + 6);
        if (now < expiresAt) {
          isCommissionActive = true;
        }
      }

      // Check if subscription is active
      const hasActiveSub = rest.suscripcion && rest.suscripcion.estado === 'ACTIVA';
      
      if (isCommissionActive && hasActiveSub && rest.plan) {
        activeCommissionsCount++;
        totalMonthlyComission += (rest.plan.precio * (req.user.porcentajeComision / 100));
      } else if (!isCommissionActive) {
        expiredCommissionsCount++;
      }
    });

    res.json({
      success: true,
      data: {
        totalMonthlyComission,
        activeCommissionsCount,
        expiredCommissionsCount,
        totalRestaurants: restaurantes.length,
        porcentajeComision: req.user.porcentajeComision
      }
    });
  } catch (error) {
    console.error('Error fetching partner stats:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
