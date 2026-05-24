const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');
const { authenticateSuperAdmin } = require('../middleware/superAdminAuth');

// @route   GET /api/super-admin/partners
// @desc    Obtener lista de partners/agencias
// @access  Private (SUPERADMIN)
router.get('/', authenticateSuperAdmin, async (req, res) => {
  try {
    const partners = await prisma.usuarioPartner.findMany({
      include: {
        restaurantes: {
          include: {
            plan: true,
            suscripcion: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular estadísticas globales de comisiones
    const now = new Date();
    
    const result = partners.map(partner => {
      let activeCommissionsCount = 0;
      let expiredCommissionsCount = 0;
      let totalMonthlyComission = 0;

      partner.restaurantes.forEach(rest => {
        let isCommissionActive = false;
        if (rest.fechaAsignacionPartner) {
          const expiresAt = new Date(rest.fechaAsignacionPartner);
          expiresAt.setMonth(expiresAt.getMonth() + 6);
          if (now < expiresAt) {
            isCommissionActive = true;
          }
        }

        const hasActiveSub = rest.suscripcion && rest.suscripcion.estado === 'ACTIVA';
        
        if (isCommissionActive && hasActiveSub && rest.plan) {
          activeCommissionsCount++;
          totalMonthlyComission += (rest.plan.precio * (partner.porcentajeComision / 100));
        } else if (!isCommissionActive) {
          expiredCommissionsCount++;
        }
      });

      // Quitamos el array de restaurantes para no sobrecargar si no se pide detalle (o lo dejamos si se necesita)
      const { password, ...partnerData } = partner;
      return {
        ...partnerData,
        stats: {
          activeCommissionsCount,
          expiredCommissionsCount,
          totalMonthlyComission,
          totalRestaurants: partner.restaurantes.length
        }
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching partners (superadmin):', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// @route   POST /api/super-admin/partners
// @desc    Crear un partner/agencia
// @access  Private (SUPERADMIN)
router.post('/', authenticateSuperAdmin, async (req, res) => {
  try {
    const { email, password, nombreAgencia, nombreContacto, telefono, porcentajeComision } = req.body;
    
    const existing = await prisma.usuarioPartner.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const partner = await prisma.usuarioPartner.create({
      data: {
        email,
        password: hashedPassword,
        nombreAgencia,
        nombreContacto,
        telefono,
        porcentajeComision: porcentajeComision || 30
      }
    });

    const { password: _, ...partnerData } = partner;
    res.json({ success: true, data: partnerData });
  } catch (error) {
    console.error('Error creating partner (superadmin):', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
