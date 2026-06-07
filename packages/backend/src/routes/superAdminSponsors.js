const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');
const { authenticateSuperAdmin } = require('../middleware/superAdminAuth');
// Import using dynamic import or if it's commonjs require. Wait, namecom.service.js is ES module?
// Let's check backend package.json "type": "module"? No, the backend is CommonJS based on view_file ("main": "src/index.js", no type field).
// Wait, I created namecom.service.js with `export const`. I should change it to module.exports since the backend is CommonJS.
const namecomService = require('../services/namecom.service');

// @route   GET /api/super-admin/sponsors
// @desc    Obtener lista de sponsors
// @access  Private (SUPERADMIN)
router.get('/', authenticateSuperAdmin, async (req, res) => {
  try {
    const sponsors = await prisma.usuarioSponsor.findMany({
      include: {
        restaurantesPatrocinados: {
          select: {
            id: true,
            nombre: true
          }
        },
        campanas: {
          select: {
            id: true,
            nombre: true,
            activo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Quitar password de los resultados
    const result = sponsors.map(sponsor => {
      const { password, ...sponsorData } = sponsor;
      return {
        ...sponsorData,
        stats: {
          totalRestaurants: sponsor.restaurantesPatrocinados.length,
          totalCampanas: sponsor.campanas.length,
          activeCampanas: sponsor.campanas.filter(c => c.activo).length
        }
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching sponsors (superadmin):', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// @route   POST /api/super-admin/sponsors
// @desc    Crear un sponsor
// @access  Private (SUPERADMIN)
router.post('/', authenticateSuperAdmin, async (req, res) => {
  try {
    const { email, password, nombreEmpresa, contactoName, telefono, slug, logoUrl, cargo } = req.body;
    
    // Validar unicidad de email
    const existingEmail = await prisma.usuarioSponsor.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, error: 'El email ya está registrado' });
    }

    // Validar unicidad de slug
    if (slug) {
      const existingSlug = await prisma.usuarioSponsor.findUnique({ where: { slug } });
      if (existingSlug) {
        return res.status(400).json({ success: false, error: 'El slug ya está en uso' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sponsor = await prisma.usuarioSponsor.create({
      data: {
        email,
        password: hashedPassword,
        nombreEmpresa,
        contactoName,
        telefono,
        slug,
        logoUrl,
        cargo
      }
    });

    // 🚀 Integración Name.com: Crear subdominio
    let subdomainResult = null;
    if (slug) {
      subdomainResult = await namecomService.createSponsorSubdomain(slug);
      if (!subdomainResult.success) {
        console.warn(`Sponsor creado, pero falló la creación del subdominio para ${slug}: ${subdomainResult.message}`);
        // No fallamos la petición completa, solo advertimos
      }
    }

    const { password: _, ...sponsorData } = sponsor;
    res.json({ 
      success: true, 
      data: sponsorData, 
      subdomain: subdomainResult ? subdomainResult.success : false,
      subdomainMessage: subdomainResult ? subdomainResult.message : 'No slug provided'
    });
  } catch (error) {
    console.error('Error creating sponsor (superadmin):', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// @route   POST /api/super-admin/sponsors/:id/reset-password
// @desc    Resetear contraseña de un sponsor
// @access  Private (SUPERADMIN)
router.post('/:id/reset-password', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Generar contraseña aleatoria (por ejemplo: "Sponsor2024!") o fija para propósitos de prueba
    const newPassword = Math.random().toString(36).slice(-8) + '1aA!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sponsor = await prisma.usuarioSponsor.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({ 
      success: true, 
      message: 'Contraseña reseteada con éxito',
      newPassword,
      email: sponsor.email
    });
  } catch (error) {
    console.error('Error resetting sponsor password:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// @route   POST /api/super-admin/sponsors/assign-restaurant
// @desc    Asignar un restaurante a un sponsor (o remover asignación)
// @access  Private (SUPERADMIN)
router.post('/assign-restaurant', authenticateSuperAdmin, async (req, res) => {
  try {
    const { restauranteId, sponsorId } = req.body;
    
    if (!restauranteId) {
      return res.status(400).json({ success: false, error: 'Restaurante ID es requerido' });
    }

    // Verificar que el restaurante existe
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: restauranteId }
    });

    if (!restaurante) {
      return res.status(404).json({ success: false, error: 'Restaurante no encontrado' });
    }

    if (sponsorId) {
      // Verificar que el sponsor existe
      const sponsor = await prisma.usuarioSponsor.findUnique({
        where: { id: sponsorId }
      });

      if (!sponsor) {
        return res.status(404).json({ success: false, error: 'Sponsor no encontrado' });
      }

      // Asignar el sponsor
      await prisma.restaurante.update({
        where: { id: restauranteId },
        data: {
          sponsors: {
            set: [{ id: sponsorId }]
          }
        }
      });
    } else {
      // Remover la asignación si sponsorId es null o vacío
      await prisma.restaurante.update({
        where: { id: restauranteId },
        data: {
          sponsors: {
            set: []
          }
        }
      });
    }

    res.json({ success: true, message: 'Asignación de Sponsor actualizada correctamente' });
  } catch (error) {
    console.error('Error assigning sponsor:', error);
    res.status(500).json({ success: false, error: 'Error del servidor al asignar sponsor' });
  }
});

module.exports = router;
