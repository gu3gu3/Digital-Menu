const express = require('express');
const { prisma } = require('../config/database');
const { authenticate, requireAdmin, requireStaff } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @desc    Obtener notificaciones para el restaurante
 * @route   GET /api/notifications
 * @access  Private (Admin & Staff)
 */
router.get('/', authenticate, requireStaff, async (req, res) => {
  try {
    const { restauranteId, role } = req.user;
    const { limit = 10, offset = 0 } = req.query;

    // Los meseros solo ven notificaciones de tipo CALL
    const whereClause = { restauranteId };
    if (role === 'MESERO') {
      whereClause.tipo = 'CALL';
    }

    const notifications = await prisma.notificacionUsuario.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const unreadCount = await prisma.notificacionUsuario.count({
      where: {
        ...whereClause,
        leida: false,
      },
    });
    
    const totalCount = await prisma.notificacionUsuario.count({
      where: whereClause,
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
            total: totalCount,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: totalCount > (parseInt(offset) + parseInt(limit))
        }
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});


/**
 * @desc    Marcar una notificación como leída
 * @route   POST /api/notifications/:id/read
 * @access  Private (Admin & Staff)
 */
router.post('/:id/read', authenticate, requireStaff, async (req, res) => {
    try {
        const { restauranteId, role } = req.user;
        const { id } = req.params;

        // Los meseros solo pueden marcar como leídas las notificaciones de tipo CALL
        const whereClause = { id, restauranteId };
        if (role === 'MESERO') {
            whereClause.tipo = 'CALL';
        }

        const notification = await prisma.notificacionUsuario.findFirst({
            where: whereClause
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
        }

        const updatedNotification = await prisma.notificacionUsuario.update({
            where: { id },
            data: { leida: true }
        });

        res.json({ success: true, data: updatedNotification });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});


/**
 * @desc    Marcar todas las notificaciones como leídas
 * @route   POST /api/notifications/read-all
 * @access  Private (Admin & Staff)
 */
router.post('/read-all', authenticate, requireStaff, async (req, res) => {
    try {
        const { restauranteId, role } = req.user;

        // Los meseros solo pueden marcar como leídas las notificaciones de tipo CALL
        const whereClause = { 
            restauranteId,
            leida: false
        };
        if (role === 'MESERO') {
            whereClause.tipo = 'CALL';
        }

        await prisma.notificacionUsuario.updateMany({
            where: whereClause,
            data: { leida: true }
        });

        res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });

    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

/**
 * @desc    Eliminar una notificación (solo Admin)
 * @route   DELETE /api/notifications/:id
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { restauranteId } = req.user;
        const { id } = req.params;

        // Primero, verificar que la notificación pertenece al restaurante del usuario
        const notification = await prisma.notificacionUsuario.findFirst({
            where: { id, restauranteId },
        });

        if (!notification) {
            // Si no se encuentra, o no pertenece al usuario, se devuelve 404 para no dar información
            return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
        }

        // Si se encontró y pertenece al usuario, se elimina
        await prisma.notificacionUsuario.delete({
            where: { id },
        });

        res.json({ success: true, message: 'Notificación eliminada correctamente' });

    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

module.exports = router; 