const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken } = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');

// Get feedback eligibility status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const admin = req.user;

    // Obtener la última sugerencia del restaurante
    const ultimaSugerencia = await prisma.sugerencia.findFirst({
      where: {
        restauranteId: admin.restauranteId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!ultimaSugerencia) {
      return res.json({ success: true, data: { canSubmit: true, daysRemaining: 0 } });
    }

    const treintaDiasEnMs = 30 * 24 * 60 * 60 * 1000;
    const tiempoTranscurrido = new Date() - new Date(ultimaSugerencia.createdAt);
    
    if (tiempoTranscurrido < treintaDiasEnMs) {
      const diasRestantes = Math.ceil((treintaDiasEnMs - tiempoTranscurrido) / (1000 * 60 * 60 * 24));
      return res.json({ 
        success: true, 
        data: { 
          canSubmit: false, 
          daysRemaining: diasRestantes,
          lastSubmit: ultimaSugerencia.createdAt
        } 
      });
    }

    res.json({ success: true, data: { canSubmit: true, daysRemaining: 0 } });
  } catch (error) {
    console.error('Error fetching feedback status:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estado de sugerencias' });
  }
});

// Submit new feedback
router.post('/', authenticateToken, async (req, res) => {
  try {
    const admin = req.user;
    const { mensaje } = req.body;

    if (!mensaje || mensaje.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'El mensaje es requerido' });
    }

    if (mensaje.length > 500) {
      return res.status(400).json({ success: false, error: 'El mensaje no debe exceder 500 caracteres' });
    }

    // Verificar si ya envió uno recientemente
    const ultimaSugerencia = await prisma.sugerencia.findFirst({
      where: { restauranteId: admin.restauranteId },
      orderBy: { createdAt: 'desc' }
    });

    if (ultimaSugerencia) {
      const treintaDiasEnMs = 30 * 24 * 60 * 60 * 1000;
      if (new Date() - new Date(ultimaSugerencia.createdAt) < treintaDiasEnMs) {
        return res.status(429).json({ success: false, error: 'Solo puedes enviar una sugerencia cada 30 días' });
      }
    }

    // Obtener datos del restaurante
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: admin.restauranteId }
    });

    // Guardar en la base de datos
    await prisma.sugerencia.create({
      data: {
        mensaje,
        restauranteId: admin.restauranteId
      }
    });

    // Enviar email a comentarios@menuview.app
    try {
      await emailService.sendFeedbackEmail(
        restaurante.nombre,
        admin.email,
        mensaje
      );
    } catch (emailError) {
      console.error('Error al enviar correo de feedback:', emailError);
      // No fallamos la petición si el correo falla, ya se guardó en BD
    }

    res.json({ success: true, message: '¡Gracias por tu sugerencia!' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, error: 'Error al procesar la sugerencia' });
  }
});

module.exports = router;
