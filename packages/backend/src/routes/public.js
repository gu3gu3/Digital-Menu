const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// @desc    Get restaurant by slug (public)
// @route   GET /api/public/restaurant/:slug
// @access  Public
const getRestaurantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const restaurante = await prisma.restaurante.findUnique({
      where: { 
        slug,
        activo: true 
      },
      include: {
        categorias: {
          where: { activa: true },
          include: {
            productos: {
              where: { disponible: true },
              orderBy: { orden: 'asc' }
            }
          },
          orderBy: { orden: 'asc' }
        },
        mesas: {
          where: { activa: true },
          select: { id: true, numero: true, nombre: true, qrCode: true }
        }
      }
    });

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        error: 'Restaurante no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        restaurante: {
          id: restaurante.id,
          nombre: restaurante.nombre,
          slug: restaurante.slug,
          descripcion: restaurante.descripcion,
          telefono: restaurante.telefono,
          direccion: restaurante.direccion,
          logoUrl: restaurante.logoUrl,
          bannerUrl: restaurante.bannerUrl,
          backgroundImage: restaurante.backgroundImage,
          backgroundColor: restaurante.backgroundColor,
          moneda: restaurante.moneda
        },
        categorias: restaurante.categorias,
        mesas: restaurante.mesas
      }
    });

  } catch (error) {
    console.error('Error obteniendo restaurante por slug:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get restaurant menu by slug (public)
// @route   GET /api/public/menu/:slug
// @access  Public
const getMenuBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const restaurante = await prisma.restaurante.findUnique({
      where: { 
        slug,
        activo: true 
      },
      select: {
        id: true,
        nombre: true,
        slug: true,
        descripcion: true,
        telefono: true,
        direccion: true,
        logoUrl: true,
        bannerUrl: true,
        backgroundColor: true,
        backgroundImage: true,
        moneda: true,
        categorias: {
          where: { activa: true },
          include: {
            productos: {
              where: { disponible: true },
              orderBy: { orden: 'asc' }
            }
          },
          orderBy: { orden: 'asc' }
        }
      }
    });

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        error: 'Menú no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        restaurante: {
          id: restaurante.id,
          nombre: restaurante.nombre,
          slug: restaurante.slug,
          descripcion: restaurante.descripcion,
          telefono: restaurante.telefono,
          direccion: restaurante.direccion,
          logoUrl: restaurante.logoUrl,
          bannerUrl: restaurante.bannerUrl,
          backgroundColor: restaurante.backgroundColor,
          backgroundImage: restaurante.backgroundImage,
          moneda: restaurante.moneda
        },
        categorias: restaurante.categorias
      }
    });

  } catch (error) {
    console.error('Error obteniendo menú por slug:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Check if slug is available
// @route   GET /api/public/check-slug/:slug
// @access  Public
const checkSlugAvailability = async (req, res) => {
  try {
    const { slug } = req.params;

    const existing = await prisma.restaurante.findUnique({
      where: { slug }
    });

    res.json({
      success: true,
      data: {
        available: !existing,
        slug
      }
    });

  } catch (error) {
    console.error('Error verificando disponibilidad de slug:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get order status by ID (public)
// @route   GET /api/public/orden/:ordenId
// @access  Public
const getOrdenStatus = async (req, res) => {
  try {
    const { ordenId } = req.params;

    const orden = await prisma.orden.findUnique({
      where: {
        id: ordenId
      },
      include: {
        mesa: true,
        sesion: true,
        items: {
          include: {
            producto: {
              select: {
                nombre: true,
                precio: true
              }
            }
          }
        }
      }
    });

    if (!orden) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      data: orden
    });
  } catch (error) {
    console.error('Error obteniendo estado de orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes
router.get('/restaurant/:slug', getRestaurantBySlug);
router.get('/menu/:slug', getMenuBySlug);
router.get('/check-slug/:slug', checkSlugAvailability);
router.get('/orden/:ordenId', getOrdenStatus);

module.exports = router; 