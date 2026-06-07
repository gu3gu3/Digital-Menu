const express = require('express');
const rateLimit = require('express-rate-limit');
const { prisma } = require('../config/database');

const router = express.Router();

// Límite estricto de IP: máximo 60 eventos de telemetría por minuto por IP (1 por segundo promedio)
// Esto previene que un curioso mande millones de clics falsos mediante scripts
const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, 
  message: { success: false, error: 'Demasiadas peticiones de telemetría.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Buffer temporal en memoria para agrupar los eventos
let metricsBuffer = [];

// Función para vaciar el buffer hacia la base de datos (Bulk Insert)
const flushMetrics = async () => {
  if (metricsBuffer.length === 0) return;

  const metricsToInsert = [...metricsBuffer];
  metricsBuffer = [];

  try {
    await prisma.metricaAnuncio.createMany({
      data: metricsToInsert,
      skipDuplicates: true
    });
    // console.log(`[Telemetría] ${metricsToInsert.length} eventos insertados exitosamente en la BD.`);
  } catch (error) {
    console.error('[Telemetría] Error al insertar métricas en bloque:', error);
  }
};

// Configurar el temporizador para vaciar cada 60 segundos (ajustado a petición)
setInterval(flushMetrics, 60 * 1000);

/**
 * @route   POST /api/telemetry/track
 * @desc    Registrar un evento de VISTA o CLICK (Fire-and-forget)
 * @access  Público (Protegido por Rate Limit)
 */
router.post('/track', telemetryLimiter, (req, res) => {
  // Responder inmediatamente (202 Accepted) para no bloquear al cliente
  res.status(202).json({ success: true, message: 'Evento encolado.' });

  const { campanaId, tipo, restauranteId } = req.body;

  // Validación básica
  if (!campanaId || typeof campanaId !== 'string' || campanaId.length > 30) {
    return;
  }

  if (tipo !== 'VISTA' && tipo !== 'CLICK') {
    return;
  }

  const userAgent = req.headers['user-agent'] || '';
  const dispositivo = /Mobile|Android|iP(hone|od|ad)/i.test(userAgent) ? 'MOBILE' : 'DESKTOP';

  metricsBuffer.push({
    campanaId,
    tipo,
    restauranteId: (typeof restauranteId === 'string' && restauranteId.length <= 30) ? restauranteId : null,
    dispositivo,
    createdAt: new Date()
  });

  // Si el buffer crece mucho, forzar flush inmediato
  if (metricsBuffer.length >= 100) {
    flushMetrics();
  }
});

module.exports = router;
