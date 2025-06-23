// Endpoint corregido para renovación de suscripciones
router.put('/renew/:id', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validar entrada
    const { error, value } = renewSubscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { meses, planId, monto, metodoPago, referenciaPago, notas } = value;

    // Verificar que la suscripción existe
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { id },
      include: { 
        restaurante: {
          include: {
            plan: true
          }
        },
        historialPagos: true
      }
    });

    if (!suscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    // Si se especifica un planId, verificar que existe
    let nuevoPlan = suscripcion.restaurante.plan;
    if (planId && planId !== suscripcion.restaurante.planId) {
      nuevoPlan = await prisma.plan.findUnique({
        where: { id: planId }
      });

      if (!nuevoPlan) {
        return res.status(400).json({
          success: false,
          message: 'Plan especificado no encontrado'
        });
      }
    }

    // Calcular nueva fecha de vencimiento
    let fechaBase;
    if (suscripcion.estado === 'VENCIDA' || suscripcion.estado === 'SUSPENDIDA') {
      fechaBase = new Date();
    } else {
      fechaBase = new Date(suscripcion.fechaVencimiento);
    }
    
    const nuevaFechaVencimiento = new Date(fechaBase);
    nuevaFechaVencimiento.setMonth(nuevaFechaVencimiento.getMonth() + meses);

    // Calcular monto automáticamente si no se especifica
    const montoCalculado = monto || (nuevoPlan.precio * meses);

    // Transacción para renovar suscripción
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar suscripción - SOLO campos que existen
      const suscripcionActualizada = await tx.suscripcion.update({
        where: { id },
        data: {
          estado: 'ACTIVA',
          fechaVencimiento: nuevaFechaVencimiento
        },
        include: {
          restaurante: {
            include: {
              plan: true
            }
          }
        }
      });

      // Si hay cambio de plan, actualizar el restaurante
      if (planId && planId !== suscripcion.restaurante.planId) {
        await tx.restaurante.update({
          where: { id: suscripcion.restauranteId },
          data: { planId: planId }
        });
      }

      // Crear registro de pago
      const pago = await tx.historialPago.create({
        data: {
          suscripcionId: id,
          monto: montoCalculado,
          mesesPagados: meses,
          metodoPago: metodoPago || 'Renovación Manual',
          referenciaPago,
          procesadoPor: req.superUser.id,
          notas
        }
      });

      // Crear notificación
      const tipoNotificacion = planId && planId !== suscripcion.restaurante.planId ? 'UPGRADE_PLAN' : 'PAGO_CONFIRMADO';
      const tituloNotificacion = planId && planId !== suscripcion.restaurante.planId 
        ? 'Plan Actualizado y Renovado'
        : 'Suscripción Renovada';
      
      let mensajeNotificacion = `Su suscripción ha sido renovada por ${meses} mes(es) hasta el ${nuevaFechaVencimiento.toLocaleDateString()}.`;
      
      if (planId && planId !== suscripcion.restaurante.planId) {
        mensajeNotificacion = `Su plan ha sido actualizado a "${nuevoPlan.nombre}" y renovado por ${meses} mes(es) hasta el ${nuevaFechaVencimiento.toLocaleDateString()}.`;
      }

      await tx.notificacionUsuario.create({
        data: {
          restauranteId: suscripcion.restauranteId,
          tipo: tipoNotificacion,
          titulo: tituloNotificacion,
          mensaje: mensajeNotificacion,
          enviadaPorId: req.superUser.id
        }
      });

      return { suscripcionActualizada, pago };
    });

    res.json({
      success: true,
      message: `Suscripción renovada exitosamente por ${meses} mes(es)`,
      data: resultado
    });

  } catch (error) {
    console.error('Error renovando suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}); 