const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// @desc    Get demo menu with sample data
// @route   GET /api/menu/demo
// @access  Public
const getDemoMenu = async (req, res) => {
  try {
    // Get the demo restaurant with all its data
    const restaurant = await prisma.restaurante.findFirst({
      where: {
        email: 'demo@restaurant.com'
      },
      include: {
        categorias: {
          where: {
            activa: true
          },
          orderBy: {
            orden: 'asc'
          },
          include: {
            productos: {
              where: {
                disponible: true
              },
              orderBy: {
                orden: 'asc'
              }
            }
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurante demo no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          nombre: restaurant.nombre,
          descripcion: restaurant.descripcion,
          telefono: restaurant.telefono,
          direccion: restaurant.direccion
        },
        categories: restaurant.categorias.map(categoria => ({
          id: categoria.id,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
          productos: categoria.productos.map(producto => ({
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Error obteniendo menú demo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get menu for public access (QR scan)
// @route   GET /api/menu/:qrCode
// @access  Public
const getMenuByQR = async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    // Find the table by QR code
    const mesa = await prisma.mesa.findFirst({
      where: {
        qrCode: qrCode,
        activa: true
      },
      include: {
        restaurante: {
          include: {
            categorias: {
              where: {
                activa: true
              },
              orderBy: {
                orden: 'asc'
              },
              include: {
                productos: {
                  where: {
                    disponible: true
                  },
                  orderBy: {
                    orden: 'asc'
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!mesa) {
      return res.status(404).json({
        success: false,
        error: 'Mesa no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        table: {
          id: mesa.id,
          numero: mesa.numero,
          nombre: mesa.nombre
        },
        restaurant: {
          id: mesa.restaurante.id,
          nombre: mesa.restaurante.nombre,
          descripcion: mesa.restaurante.descripcion,
          telefono: mesa.restaurante.telefono,
          direccion: mesa.restaurante.direccion
        },
        categories: mesa.restaurante.categorias.map(categoria => ({
          id: categoria.id,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
          productos: categoria.productos.map(producto => ({
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Error obteniendo menú:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes
router.get('/demo', getDemoMenu);
router.get('/:qrCode', getMenuByQR);

module.exports = router; 