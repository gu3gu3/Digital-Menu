const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware para autenticar super administradores
 */
const authenticateSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar que el token sea de un super admin
      if (decoded.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Se requieren permisos de super administrador'
        });
      }

      // Buscar el super usuario en la base de datos
      const superUser = await prisma.superUsuario.findUnique({
        where: { id: decoded.userId }
      });

      if (!superUser || !superUser.activo) {
        return res.status(403).json({
          success: false,
          message: 'Super usuario no encontrado o inactivo'
        });
      }

      // Agregar información del super usuario al request
      req.superUser = {
        id: superUser.id,
        email: superUser.email,
        nombre: superUser.nombre,
        apellido: superUser.apellido
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  } catch (error) {
    console.error('Error en middleware de super admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  authenticateSuperAdmin
}; 