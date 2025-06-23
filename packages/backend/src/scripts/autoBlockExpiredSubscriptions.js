const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script para bloqueo automático de suscripciones vencidas
 * Puede ejecutarse como cron job o manualmente
 */
async function autoBlockExpiredSubscriptions(options = {}) {
  try {
    const {
      gracePeriodDays = 3,
      dryRun = false,
      notifyUsers = true,
      logLevel = 'info' // 'silent', 'info', 'verbose'
    } = options;

    const log = (message, level = 'info') => {
      if (logLevel === 'silent') return;
      if (logLevel === 'verbose' || level === 'info') {
        console.log(`[${new Date().toISOString()}] ${message}`);
      }
    };

    log('🚀 Iniciando proceso de bloqueo automático de suscripciones vencidas...');
    log(`📋 Configuración: Período de gracia: ${gracePeriodDays} días, Modo: ${dryRun ? 'SIMULACIÓN' : 'EJECUCIÓN'}, Notificar: ${notifyUsers}`);

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - gracePeriodDays);

    // Buscar suscripciones vencidas que aún están activas
    const suscripcionesVencidas = await prisma.suscripcion.findMany({
      where: {
        estado: 'ACTIVA',
        fechaVencimiento: {
          lt: fechaLimite
        }
      },
      include: {
        restaurante: {
          select: {
            id: true,
            nombre: true,
            email: true,
            activo: true,
            slug: true
          }
        },
        plan: {
          select: {
            id: true,
            nombre: true,
            precio: true
          }
        }
      }
    });

    log(`📊 Encontradas ${suscripcionesVencidas.length} suscripciones vencidas que requieren bloqueo`);

    if (suscripcionesVencidas.length === 0) {
      log('✅ No hay suscripciones que requieran bloqueo automático');
      return {
        success: true,
        suscripcionesProcesadas: 0,
        suscripcionesBloqueadas: 0,
        restaurantesSuspendidos: 0,
        notificacionesEnviadas: 0,
        detalles: []
      };
    }

    let resultado = {
      suscripcionesProcesadas: suscripcionesVencidas.length,
      suscripcionesBloqueadas: 0,
      restaurantesSuspendidos: 0,
      notificacionesEnviadas: 0,
      detalles: [],
      errores: []
    };

    if (!dryRun) {
      // Ejecutar bloqueos en transacción
      log('🔒 Ejecutando bloqueos automáticos...');
      
      await prisma.$transaction(async (tx) => {
        for (const suscripcion of suscripcionesVencidas) {
          try {
            const diasVencida = Math.floor((new Date() - new Date(suscripcion.fechaVencimiento)) / (1000 * 60 * 60 * 24));

            log(`   Procesando: ${suscripcion.restaurante.nombre} (${diasVencida} días vencida)`, 'verbose');

            // Actualizar suscripción a VENCIDA
            await tx.suscripcion.update({
              where: { id: suscripcion.id },
              data: { 
                estado: 'VENCIDA',
                notasAdmin: `Bloqueada automáticamente el ${new Date().toISOString()} después de ${diasVencida} días de vencimiento. Período de gracia: ${gracePeriodDays} días.`
              }
            });

            // Suspender el restaurante si está activo
            let restauranteSuspendido = false;
            if (suscripcion.restaurante.activo) {
              await tx.restaurante.update({
                where: { id: suscripcion.restauranteId },
                data: { activo: false }
              });
              restauranteSuspendido = true;
              resultado.restaurantesSuspendidos++;
              log(`   ⏸️  Restaurante suspendido: ${suscripcion.restaurante.nombre}`, 'verbose');
            }

            resultado.suscripcionesBloqueadas++;

            // Crear notificación si está habilitado
            if (notifyUsers) {
              await tx.notificacionUsuario.create({
                data: {
                  restauranteId: suscripcion.restauranteId,
                  tipo: 'SUSCRIPCION_VENCIDA',
                  titulo: 'Suscripción Vencida - Servicio Suspendido',
                  mensaje: `Su suscripción al plan "${suscripcion.plan.nombre}" venció hace ${diasVencida} días y el servicio ha sido suspendido automáticamente. Para reactivar su cuenta, por favor renueve su suscripción contactando a nuestro equipo de soporte.`,
                  notificationKey: `auto-block-${suscripcion.id}-${new Date().toISOString().split('T')[0]}`
                }
              });
              resultado.notificacionesEnviadas++;
              log(`   📧 Notificación enviada a: ${suscripcion.restaurante.email}`, 'verbose');
            }

            resultado.detalles.push({
              restauranteId: suscripcion.restauranteId,
              restauranteNombre: suscripcion.restaurante.nombre,
              restauranteEmail: suscripcion.restaurante.email,
              planNombre: suscripcion.plan.nombre,
              fechaVencimiento: suscripcion.fechaVencimiento,
              diasVencida,
              restauranteSuspendido,
              notificacionEnviada: notifyUsers
            });

            log(`   ✅ Procesado exitosamente: ${suscripcion.restaurante.nombre}`, 'verbose');

          } catch (error) {
            log(`   ❌ Error procesando ${suscripcion.restaurante.nombre}: ${error.message}`, 'verbose');
            resultado.errores.push({
              restauranteId: suscripcion.restauranteId,
              restauranteNombre: suscripcion.restaurante.nombre,
              error: error.message
            });
          }
        }
      });
    } else {
      // Modo simulación - solo generar reporte
      log('🧪 Modo simulación - generando reporte...');
      
      for (const suscripcion of suscripcionesVencidas) {
        const diasVencida = Math.floor((new Date() - new Date(suscripcion.fechaVencimiento)) / (1000 * 60 * 60 * 24));
        
        resultado.detalles.push({
          restauranteId: suscripcion.restauranteId,
          restauranteNombre: suscripcion.restaurante.nombre,
          restauranteEmail: suscripcion.restaurante.email,
          planNombre: suscripcion.plan.nombre,
          fechaVencimiento: suscripcion.fechaVencimiento,
          diasVencida,
          restauranteSuspendido: suscripcion.restaurante.activo, // Se suspendería
          notificacionEnviada: notifyUsers,
          simulacion: true
        });

        log(`   📋 ${suscripcion.restaurante.nombre}: ${diasVencida} días vencida - ${suscripcion.restaurante.activo ? 'SE SUSPENDERÍA' : 'YA SUSPENDIDO'}`, 'verbose');
      }
    }

    // Resumen final
    log('');
    log('📈 RESUMEN DE EJECUCIÓN:');
    log(`   • Suscripciones procesadas: ${resultado.suscripcionesProcesadas}`);
    log(`   • Suscripciones bloqueadas: ${resultado.suscripcionesBloqueadas}`);
    log(`   • Restaurantes suspendidos: ${resultado.restaurantesSuspendidos}`);
    log(`   • Notificaciones enviadas: ${resultado.notificacionesEnviadas}`);
    if (resultado.errores.length > 0) {
      log(`   • Errores: ${resultado.errores.length}`);
    }
    log('');

    if (dryRun) {
      log('🧪 SIMULACIÓN COMPLETADA - No se realizaron cambios en la base de datos');
    } else {
      log('✅ BLOQUEO AUTOMÁTICO COMPLETADO');
    }

    return {
      success: true,
      ...resultado,
      fechaEjecucion: new Date().toISOString(),
      configuracion: {
        gracePeriodDays,
        dryRun,
        notifyUsers
      }
    };

  } catch (error) {
    console.error('❌ Error en bloqueo automático:', error);
    return {
      success: false,
      error: error.message,
      fechaEjecucion: new Date().toISOString()
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Función para enviar recordatorios antes del vencimiento
async function sendExpirationReminders(options = {}) {
  try {
    const {
      reminderDays = [7, 3, 1], // Enviar recordatorios 7, 3 y 1 día antes del vencimiento
      logLevel = 'info'
    } = options;

    const log = (message, level = 'info') => {
      if (logLevel === 'silent') return;
      if (logLevel === 'verbose' || level === 'info') {
        console.log(`[${new Date().toISOString()}] ${message}`);
      }
    };

    log('📧 Iniciando envío de recordatorios de vencimiento...');

    let totalRecordatorios = 0;

    for (const days of reminderDays) {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + days);
      fechaLimite.setHours(23, 59, 59, 999); // Final del día

      const fechaInicio = new Date(fechaLimite);
      fechaInicio.setHours(0, 0, 0, 0); // Inicio del día

      // Buscar suscripciones que vencen en X días
      const suscripcionesProximas = await prisma.suscripcion.findMany({
        where: {
          estado: 'ACTIVA',
          fechaVencimiento: {
            gte: fechaInicio,
            lte: fechaLimite
          }
        },
        include: {
          restaurante: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          plan: {
            select: {
              nombre: true,
              precio: true
            }
          }
        }
      });

      log(`📅 Suscripciones que vencen en ${days} día(s): ${suscripcionesProximas.length}`);

      for (const suscripcion of suscripcionesProximas) {
        // Verificar si ya se envió recordatorio para este día
        const notificacionExistente = await prisma.notificacionUsuario.findFirst({
          where: {
            restauranteId: suscripcion.restauranteId,
            notificationKey: `reminder-${days}d-${suscripcion.id}`
          }
        });

        if (!notificacionExistente) {
          await prisma.notificacionUsuario.create({
            data: {
              restauranteId: suscripcion.restauranteId,
              tipo: 'RENOVACION_PROXIMA',
              titulo: `Recordatorio: Su suscripción vence en ${days} día${days !== 1 ? 's' : ''}`,
              mensaje: `Su suscripción al plan "${suscripcion.plan.nombre}" vencerá el ${suscripcion.fechaVencimiento.toLocaleDateString()}. Para evitar interrupciones en el servicio, renueve su suscripción antes de la fecha de vencimiento.`,
              notificationKey: `reminder-${days}d-${suscripcion.id}`
            }
          });

          totalRecordatorios++;
          log(`   📧 Recordatorio enviado a: ${suscripcion.restaurante.nombre}`, 'verbose');
        }
      }
    }

    log(`✅ Envío de recordatorios completado: ${totalRecordatorios} recordatorios enviados`);

    return {
      success: true,
      recordatoriosEnviados: totalRecordatorios,
      fechaEjecucion: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error enviando recordatorios:', error);
    return {
      success: false,
      error: error.message,
      fechaEjecucion: new Date().toISOString()
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'block';
  
  const parseArgs = (args) => {
    const options = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        const value = args[i + 1];
        
        if (key === 'dry-run') {
          options.dryRun = true;
        } else if (key === 'no-notify') {
          options.notifyUsers = false;
        } else if (key === 'grace-days' && value) {
          options.gracePeriodDays = parseInt(value);
          i++;
        } else if (key === 'log-level' && value) {
          options.logLevel = value;
          i++;
        }
      }
    }
    return options;
  };

  const options = parseArgs(args);

  if (command === 'block') {
    autoBlockExpiredSubscriptions(options)
      .then((result) => {
        if (result.success) {
          console.log('\n✅ Script de bloqueo automático completado exitosamente');
          process.exit(0);
        } else {
          console.error('\n❌ Script de bloqueo automático falló:', result.error);
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error('\n❌ Error ejecutando script de bloqueo automático:', error);
        process.exit(1);
      });
  } else if (command === 'reminders') {
    sendExpirationReminders(options)
      .then((result) => {
        if (result.success) {
          console.log('\n✅ Script de recordatorios completado exitosamente');
          process.exit(0);
        } else {
          console.error('\n❌ Script de recordatorios falló:', result.error);
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error('\n❌ Error ejecutando script de recordatorios:', error);
        process.exit(1);
      });
  } else {
    console.log(`
📋 USO DEL SCRIPT:

BLOQUEO AUTOMÁTICO:
  node autoBlockExpiredSubscriptions.js block [opciones]

RECORDATORIOS:
  node autoBlockExpiredSubscriptions.js reminders [opciones]

OPCIONES:
  --dry-run              Solo simular, no ejecutar cambios
  --no-notify            No enviar notificaciones a usuarios
  --grace-days <días>    Días de gracia después del vencimiento (default: 3)
  --log-level <nivel>    Nivel de log: silent, info, verbose (default: info)

EJEMPLOS:
  # Simulación de bloqueo automático
  node autoBlockExpiredSubscriptions.js block --dry-run

  # Bloqueo real con período de gracia de 5 días
  node autoBlockExpiredSubscriptions.js block --grace-days 5

  # Enviar recordatorios sin logs verbosos
  node autoBlockExpiredSubscriptions.js reminders --log-level silent

CONFIGURACIÓN CRON:
  # Ejecutar bloqueo automático todos los días a las 2:00 AM
  0 2 * * * cd /path/to/project && node packages/backend/src/scripts/autoBlockExpiredSubscriptions.js block

  # Enviar recordatorios todos los días a las 9:00 AM
  0 9 * * * cd /path/to/project && node packages/backend/src/scripts/autoBlockExpiredSubscriptions.js reminders
`);
    process.exit(0);
  }
}

module.exports = { 
  autoBlockExpiredSubscriptions, 
  sendExpirationReminders 
}; 