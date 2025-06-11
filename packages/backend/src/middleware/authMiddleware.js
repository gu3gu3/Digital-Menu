const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

// Middleware para verificar token JWT
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user based on role
    let user;
    if (decoded.role === 'ADMINISTRADOR') {
      user = await prisma.usuarioAdmin.findUnique({
        where: { id: decoded.userId },
        include: { 
          restaurante: { 
            include: { plan: true } 
          } 
        }
      });
    } else if (decoded.role === 'MESERO') {
      user = await prisma.usuarioMesero.findUnique({
        where: { id: decoded.userId },
        include: { 
          restaurante: { 
            include: { plan: true } 
          } 
        }
      });
    }

    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no válido o inactivo'
      });
    }

    // Add user info to request
    req.user = {
      userId: user.id,
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      role: decoded.role,
      restauranteId: user.restauranteId,
      restaurante: user.restaurante
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token no válido'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Alias para compatibilidad
const authenticateToken = authenticate;

// Middleware para verificar que el usuario es administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMINISTRADOR') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requieren privilegios de administrador.'
    });
  }
  next();
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. No tienes los permisos necesarios.'
      });
    }
    next();
  };
};

// Middleware para verificar que el usuario es mesero o administrador
const requireStaff = (req, res, next) => {
  if (req.user.role !== 'ADMINISTRADOR' && req.user.role !== 'MESERO') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requieren privilegios de personal.'
    });
  }
  next();
};

// Middleware para verificar que el usuario pertenece al mismo restaurante
const requireSameRestaurant = (req, res, next) => {
  const restaurantIdFromParams = req.params.restaurantId;
  
  if (restaurantIdFromParams && restaurantIdFromParams !== req.user.restauranteId) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. No tienes permisos para este restaurante.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  authenticateToken,
  requireAdmin,
  requireRole,
  requireStaff,
  requireSameRestaurant
}; 