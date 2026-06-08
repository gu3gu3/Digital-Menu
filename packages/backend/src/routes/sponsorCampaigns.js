const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/sponsor/campaigns/metrics
// @desc    Obtener métricas agregadas de Splashes y Banners
// @access  Private (SPONSOR)
router.get('/metrics', authenticateToken, requireRole(['SPONSOR']), async (req, res) => {
  try {
    const campaigns = await prisma.campanaAnuncio.findMany({
      where: { sponsorId: req.user.id },
      include: {
        metricas: {
          include: {
            restaurante: true
          }
        }
      }
    });

    const pointsMap = {};
    const chartData = [];

    campaigns.forEach(camp => {
      let campVistas = 0;
      let campClics = 0;

      camp.metricas.forEach(m => {
        if (m.tipo === 'VISTA') campVistas++;
        if (m.tipo === 'CLICK') campClics++;

        if (m.restauranteId && m.restaurante) {
          if (!pointsMap[m.restauranteId]) {
            pointsMap[m.restauranteId] = {
              name: m.restaurante.nombre,
              clicks: 0
            };
          }
          if (m.tipo === 'CLICK') {
            pointsMap[m.restauranteId].clicks++;
          }
        }
      });

      if (camp.activo) {
        chartData.push({
          name: camp.nombre,
          Vistas: campVistas,
          Clics: campClics
        });
      }
    });

    let topPuntosVenta = Object.values(pointsMap)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const maxClicks = topPuntosVenta.length > 0 ? topPuntosVenta[0].clicks : 0;
    topPuntosVenta = topPuntosVenta.map(p => ({
      ...p,
      percent: maxClicks > 0 ? Math.round((p.clicks / maxClicks) * 100) : 0
    }));

    const calculateMetrics = (campList) => {
      let vistas = 0;
      let clics = 0;
      campList.forEach(camp => {
        vistas += camp.metricas.filter(m => m.tipo === 'VISTA').length;
        clics += camp.metricas.filter(m => m.tipo === 'CLICK').length;
      });
      const ctr = vistas > 0 ? ((clics / vistas) * 100).toFixed(2) : 0;
      return { vistas, clics, ctr: parseFloat(ctr) };
    };

    const splashes = campaigns.filter(c => c.position === 'SPLASH' || !c.position);
    const banners = campaigns.filter(c => c.position && c.position !== 'SPLASH');

    const splashMetrics = calculateMetrics(splashes);
    const bannerMetrics = calculateMetrics(banners);

    res.json({
      success: true,
      data: {
        splash: splashMetrics,
        banner: bannerMetrics,
        chartData,
        topPuntosVenta
      }
    });
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    res.status(500).json({ success: false, error: 'Error al obtener métricas' });
  }
});

// @route   GET /api/sponsor/campaigns
// @desc    Obtener lista de campañas del sponsor
// @access  Private (SPONSOR)
router.get('/', authenticateToken, requireRole(['SPONSOR']), async (req, res) => {
  try {
    const campaigns = await prisma.campanaAnuncio.findMany({
      where: { sponsorId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, error: 'Error al obtener campañas' });
  }
});

// @route   POST /api/sponsor/campaigns
// @desc    Crear nueva campaña
// @access  Private (SPONSOR)
router.post('/', authenticateToken, requireRole(['SPONSOR']), async (req, res) => {
  try {
    const { nombre, activo, fechaInicio, fechaFin, splashImageUrl, bannerImageUrl, targetUrl, position } = req.body;

    if (!nombre || !fechaInicio || !fechaFin) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    // Solo 1 Splash activo a la vez: si este es un SPLASH activo, desactivamos los demás
    const positionValue = position || 'TOP';
    if (activo !== false && positionValue === 'SPLASH') {
      await prisma.campanaAnuncio.updateMany({
        where: { sponsorId: req.user.id, position: 'SPLASH', activo: true },
        data: { activo: false }
      });
    }

    const newCampaign = await prisma.campanaAnuncio.create({
      data: {
        nombre,
        activo: activo ?? true,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        splashImageUrl,
        bannerImageUrl,
        targetUrl,
        position: positionValue,
        sponsorId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Campaña creada exitosamente',
      data: newCampaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, error: 'Error al crear la campaña' });
  }
});

// @route   PUT /api/sponsor/campaigns/:id
// @desc    Actualizar campaña
// @access  Private (SPONSOR)
router.put('/:id', authenticateToken, requireRole(['SPONSOR']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, activo, fechaInicio, fechaFin, splashImageUrl, bannerImageUrl, targetUrl, position } = req.body;

    const existingCampaign = await prisma.campanaAnuncio.findFirst({
      where: { id, sponsorId: req.user.id }
    });

    if (!existingCampaign) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }

    // Solo 1 Splash activo a la vez
    const positionValue = position || existingCampaign.position;
    const isNowActive = activo !== undefined ? activo : existingCampaign.activo;
    
    if (isNowActive && positionValue === 'SPLASH') {
      await prisma.campanaAnuncio.updateMany({
        where: { 
          sponsorId: req.user.id, 
          position: 'SPLASH', 
          activo: true,
          id: { not: id } // Excluir la actual
        },
        data: { activo: false }
      });
    }

    const updatedCampaign = await prisma.campanaAnuncio.update({
      where: { id },
      data: {
        nombre: nombre || existingCampaign.nombre,
        activo: isNowActive,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : existingCampaign.fechaInicio,
        fechaFin: fechaFin ? new Date(fechaFin) : existingCampaign.fechaFin,
        splashImageUrl: splashImageUrl !== undefined ? splashImageUrl : existingCampaign.splashImageUrl,
        bannerImageUrl: bannerImageUrl !== undefined ? bannerImageUrl : existingCampaign.bannerImageUrl,
        targetUrl: targetUrl !== undefined ? targetUrl : existingCampaign.targetUrl,
        position: positionValue
      }
    });

    res.json({
      success: true,
      message: 'Campaña actualizada exitosamente',
      data: updatedCampaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la campaña' });
  }
});

// @route   DELETE /api/sponsor/campaigns/:id
// @desc    Eliminar campaña
// @access  Private (SPONSOR)
router.delete('/:id', authenticateToken, requireRole(['SPONSOR']), async (req, res) => {
  try {
    const { id } = req.params;

    const existingCampaign = await prisma.campanaAnuncio.findFirst({
      where: { id, sponsorId: req.user.id }
    });

    if (!existingCampaign) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }

    await prisma.campanaAnuncio.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Campaña eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar la campaña' });
  }
});

module.exports = router;
