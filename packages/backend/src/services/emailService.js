const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    try {
      // Configurar transporter con las credenciales de variables de entorno
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'mail.menuview.app',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // false para STARTTLS en puerto 587
        requireTLS: true, // Requerir STARTTLS
        auth: {
          user: process.env.EMAIL_USER || 'registro@menuview.app',
          pass: process.env.EMAIL_PASSWORD || '1MZfKyxUrRg3YsGN'
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        }
      });

      // Verificar la configuración
      await this.transporter.verify();
      console.log('📧 Servicio de email configurado correctamente');
      console.log(`📧 Usando email: ${process.env.EMAIL_USER || 'registro@menuview.app'}`);
    } catch (error) {
      console.error('❌ Error configurando servicio de email:', error.message);
      console.log('⚠️ Los emails se enviarán en modo de desarrollo (console.log)');
      this.transporter = null;
    }
  }

  async sendVerificationEmail(email, verificationToken, userName) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const emailContent = {
      from: {
        name: 'Digital Menu',
        address: process.env.EMAIL_USER || 'registro@menuview.app'
      },
      to: email,
      subject: '🎉 ¡Bienvenido a Digital Menu! Verifica tu email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verificación de Email - Digital Menu</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🍽️ Digital Menu</h1>
              <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">Tu sistema de menú digital</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px;">¡Hola ${userName}!</h2>
              
              <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                ¡Bienvenido a <strong>Digital Menu</strong>! Estamos emocionados de tenerte en nuestra plataforma.
              </p>

              <p style="color: #4a5568; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                Para comenzar a usar todas las funcionalidades de tu cuenta, necesitamos verificar tu dirección de email. 
                Solo haz clic en el botón de abajo:
              </p>

              <!-- Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  ✅ Verificar mi Email
                </a>
              </div>

              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Si el botón no funciona, también puedes copiar y pegar este enlace en tu navegador:
              </p>
              
              <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
                <code style="color: #4a5568; font-size: 14px; word-break: break-all;">${verificationUrl}</code>
              </div>

              <div style="background-color: #fef5e7; border: 1px solid #f6ad55; border-radius: 6px; padding: 15px; margin: 30px 0;">
                <p style="color: #c05621; margin: 0; font-size: 14px;">
                  <strong>⏰ Importante:</strong> Este enlace expirará en 24 horas por motivos de seguridad.
                </p>
              </div>

              <h3 style="color: #2d3748; margin: 30px 0 15px 0; font-size: 18px;">🚀 ¿Qué sigue?</h3>
              
              <ul style="color: #4a5568; line-height: 1.8; font-size: 15px; padding-left: 20px;">
                <li>Configura la información de tu restaurante</li>
                <li>Crea tu menú digital personalizado</li>
                <li>Genera códigos QR para tus mesas</li>
                <li>Invita a tu equipo de meseros</li>
                <li>¡Comienza a recibir órdenes digitales!</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 30px 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">
                ¿Tienes preguntas? Estamos aquí para ayudarte.
              </p>
              <p style="color: #718096; margin: 0; font-size: 14px;">
                📧 <a href="mailto:soporte@menuview.app" style="color: #667eea; text-decoration: none;">soporte@menuview.app</a>
                | 🌐 <a href="${process.env.FRONTEND_URL}" style="color: #667eea; text-decoration: none;">Digital Menu</a>
              </p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} Digital Menu. Todos los derechos reservados.
                </p>
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
      text: `
        ¡Hola ${userName}!

        ¡Bienvenido a Digital Menu! Para verificar tu email, visita el siguiente enlace:
        
        ${verificationUrl}
        
        Este enlace expirará en 24 horas.
        
        Si tienes preguntas, contacta nuestro soporte: soporte@menuview.app
        
        ¡Gracias por unirte a Digital Menu!
      `
    };

    return this.sendEmail(emailContent);
  }

  async sendWelcomeEmail(email, userName, restaurantName) {
    const dashboardUrl = `${process.env.FRONTEND_URL}/admin/dashboard`;
    const staffUrl = `${process.env.FRONTEND_URL}/staff/login`;
    
    const emailContent = {
      from: {
        name: 'Digital Menu',
        address: process.env.EMAIL_USER || 'registro@menuview.app'
      },
      to: email,
      subject: `🎉 ¡${restaurantName} ya está en Digital Menu!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>¡Bienvenido a Digital Menu!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 ¡Felicitaciones!</h1>
              <p style="color: #c6f6d5; margin: 10px 0 0 0; font-size: 16px;">Tu restaurante está listo</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px;">¡Hola ${userName}!</h2>
              
              <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                <strong>${restaurantName}</strong> ha sido registrado exitosamente en Digital Menu. 
                ¡Tu transformación digital comienza ahora! 🚀
              </p>

              <div style="background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%); border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">📊 Tu Plan Actual</h3>
                <p style="color: #4a5568; margin: 0; font-size: 15px;">
                  <strong>✨ Plan Gratuito</strong> - 30 días gratis<br>
                  • Hasta 25 productos<br>
                  • Hasta 5 mesas<br>
                  • Hasta 1 mesero<br>
                  • 300 órdenes por mes
                </p>
              </div>

              <h3 style="color: #2d3748; margin: 30px 0 15px 0; font-size: 18px;">🎯 Primeros pasos recomendados:</h3>
              
              <div style="margin: 20px 0;">
                <div style="border-left: 4px solid #667eea; padding: 15px; background-color: #f7fafc; margin: 10px 0;">
                  <h4 style="color: #2d3748; margin: 0 0 8px 0; font-size: 16px;">1. 🏪 Personaliza tu restaurante</h4>
                  <p style="color: #4a5568; margin: 0; font-size: 14px;">Agrega logo, descripción, horarios y información de contacto</p>
                </div>
                
                <div style="border-left: 4px solid #48bb78; padding: 15px; background-color: #f0fff4; margin: 10px 0;">
                  <h4 style="color: #2d3748; margin: 0 0 8px 0; font-size: 16px;">2. 📋 Crea tu menú</h4>
                  <p style="color: #4a5568; margin: 0; font-size: 14px;">Organiza categorías y agrega tus productos con precios e imágenes</p>
                </div>
                
                <div style="border-left: 4px solid #ed8936; padding: 15px; background-color: #fffaf0; margin: 10px 0;">
                  <h4 style="color: #2d3748; margin: 0 0 8px 0; font-size: 16px;">3. 🪑 Configura tus mesas</h4>
                  <p style="color: #4a5568; margin: 0; font-size: 14px;">Genera códigos QR únicos para cada mesa</p>
                </div>
                
                <div style="border-left: 4px solid #9f7aea; padding: 15px; background-color: #faf5ff; margin: 10px 0;">
                  <h4 style="color: #2d3748; margin: 0 0 8px 0; font-size: 16px;">4. 👥 Invita a tu equipo</h4>
                  <p style="color: #4a5568; margin: 0; font-size: 14px;">Agrega meseros para que puedan gestionar órdenes</p>
                </div>
              </div>

              <!-- Buttons -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin: 5px;">
                  🚀 Ir a mi Dashboard
                </a>
              </div>

              <!-- Staff Panel Link -->
              <div style="background-color: #ebf8ff; border: 1px solid #90cdf4; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h4 style="color: #2b6cb0; margin: 0 0 10px 0; font-size: 16px;">👥 Panel de Meseros</h4>
                <p style="color: #2c5282; margin: 0 0 15px 0; font-size: 14px;">
                  Comparte este enlace con tu equipo de meseros para que puedan acceder al sistema:
                </p>
                <div style="background-color: #bee3f8; padding: 10px; border-radius: 4px; margin: 10px 0;">
                  <code style="color: #2a69ac; font-size: 13px; word-break: break-all;">${staffUrl}</code>
                </div>
                <div style="text-align: center; margin: 15px 0;">
                  <a href="${staffUrl}" style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                    🔗 Panel de Staff
                  </a>
                </div>
              </div>

              <div style="background-color: #e6fffa; border: 1px solid #4fd1c7; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h4 style="color: #234e52; margin: 0 0 10px 0; font-size: 16px;">💡 ¿Necesitas ayuda?</h4>
                <p style="color: #285e61; margin: 0; font-size: 14px;">
                  Nuestro equipo está listo para ayudarte. Contáctanos si tienes preguntas sobre la configuración 
                  o cualquier funcionalidad de la plataforma.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 30px 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">
                ¡Gracias por confiar en Digital Menu para tu restaurante!
              </p>
              <p style="color: #718096; margin: 0; font-size: 14px;">
                📧 <a href="mailto:soporte@menuview.app" style="color: #48bb78; text-decoration: none;">soporte@menuview.app</a>
                | 🌐 <a href="${process.env.FRONTEND_URL}" style="color: #48bb78; text-decoration: none;">Digital Menu</a>
              </p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} Digital Menu. Transformando restaurantes digitalmente.
                </p>
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
      text: `
        ¡Hola ${userName}!

        ¡${restaurantName} ha sido registrado exitosamente en Digital Menu!

        Primeros pasos:
        1. Personaliza tu restaurante
        2. Crea tu menú digital
        3. Configura tus mesas y códigos QR
        4. Invita a tu equipo

        Accede a tu dashboard: ${dashboardUrl}
        Panel de meseros: ${staffUrl}

        ¿Necesitas ayuda? Contacta: soporte@menuview.app

        ¡Bienvenido a Digital Menu!
      `
    };

    return this.sendEmail(emailContent);
  }

  async sendPasswordResetEmail(email, resetToken, userName, restaurantName) {
    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;
    
    const emailContent = {
      from: {
        name: 'Digital Menu',
        address: process.env.EMAIL_USER || 'registro@menuview.app'
      },
      to: email,
      subject: '🔐 Recuperación de Contraseña - Digital Menu',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperación de Contraseña - Digital Menu</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🔐 Recuperar Contraseña</h1>
              <p style="color: #fed7d7; margin: 10px 0 0 0; font-size: 16px;">Solicitud de restablecimiento</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px;">¡Hola ${userName}!</h2>
              
              <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de 
                <strong>${restaurantName}</strong> en Digital Menu.
              </p>

              <p style="color: #4a5568; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                Si solicitaste este cambio, haz clic en el botón de abajo para crear una nueva contraseña:
              </p>

              <!-- Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  🔐 Restablecer Contraseña
                </a>
              </div>

              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Si el botón no funciona, también puedes copiar y pegar este enlace en tu navegador:
              </p>
              
              <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #f56565; margin: 20px 0;">
                <code style="color: #4a5568; font-size: 14px; word-break: break-all;">${resetUrl}</code>
              </div>

              <div style="background-color: #fef5e7; border: 1px solid #f6ad55; border-radius: 6px; padding: 15px; margin: 30px 0;">
                <p style="color: #c05621; margin: 0; font-size: 14px;">
                  <strong>⏰ Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad.
                </p>
              </div>

              <div style="background-color: #fef2f2; border: 1px solid #f56565; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h4 style="color: #c53030; margin: 0 0 10px 0; font-size: 16px;">🛡️ ¿No solicitaste este cambio?</h4>
                <p style="color: #742a2a; margin: 0; font-size: 14px;">
                  Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. 
                  Tu contraseña actual permanecerá sin cambios.
                </p>
                <p style="color: #742a2a; margin: 10px 0 0 0; font-size: 14px;">
                  <strong>Recomendación:</strong> Si recibes estos emails frecuentemente sin solicitarlos, 
                  contacta nuestro soporte inmediatamente.
                </p>
              </div>

              <h3 style="color: #2d3748; margin: 30px 0 15px 0; font-size: 18px;">🔒 Consejos de Seguridad:</h3>
              
              <ul style="color: #4a5568; line-height: 1.8; font-size: 15px; padding-left: 20px;">
                <li>Usa una contraseña única de al menos 8 caracteres</li>
                <li>Combina letras mayúsculas, minúsculas, números y símbolos</li>
                <li>No compartas tu contraseña con nadie</li>
                <li>Considera usar un gestor de contraseñas</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 30px 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">
                ¿Necesitas ayuda? Estamos aquí para apoyarte.
              </p>
              <p style="color: #718096; margin: 0; font-size: 14px;">
                📧 <a href="mailto:soporte@menuview.app" style="color: #f56565; text-decoration: none;">soporte@menuview.app</a>
                | 🌐 <a href="${process.env.FRONTEND_URL}" style="color: #f56565; text-decoration: none;">Digital Menu</a>
              </p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} Digital Menu. Manteniendo tu cuenta segura.
                </p>
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
      text: `
        ¡Hola ${userName}!

        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de ${restaurantName} en Digital Menu.

        Para restablecer tu contraseña, visita el siguiente enlace:
        
        ${resetUrl}
        
        Este enlace expirará en 1 hora por motivos de seguridad.
        
        Si no solicitaste este cambio, puedes ignorar este email de forma segura.
        
        ¿Necesitas ayuda? Contacta: soporte@menuview.app
        
        Digital Menu - Seguridad de tu cuenta
      `
    };

    return this.sendEmail(emailContent);
  }

  async sendEmail(emailOptions) {
    try {
      if (!this.transporter) {
        // Modo desarrollo - solo log
        console.log('📧 [DEV] Email que se enviaría:');
        console.log(`   Para: ${emailOptions.to}`);
        console.log(`   Asunto: ${emailOptions.subject}`);
        console.log(`   De: ${emailOptions.from.address}`);
        return { success: true, messageId: 'dev-mode', mode: 'development' };
      }

      const result = await this.transporter.sendMail(emailOptions);
      console.log(`📧 Email enviado a ${emailOptions.to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId, mode: 'production' };

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService(); 