const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Función auxiliar para construir URLs absolutas
const buildAbsoluteUrl = (path) => {
  if (!path || path.startsWith('http')) {
    return path;
  }
  // Asegurarse de que la URL base termina sin / y la ruta empieza con /
  const baseUrl = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * @swagger
 * /api/public/restaurant/{slug}:
 *   get:
 *     summary: Obtener restaurante por slug (público)
 *     description: Devuelve información completa del restaurante incluyendo menú y mesas para acceso público
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug único del restaurante
 *         example: "bella-vista"
 *     responses:
 *       200:
 *         description: Restaurante obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     restaurante:
 *                       $ref: '#/components/schemas/Restaurant'
 *                     categorias:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Category'
 *                           - type: object
 *                             properties:
 *                               productos:
 *                                 type: array
 *                                 items:
 *                                   $ref: '#/components/schemas/Product'
 *                     mesas:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Table'
 *       404:
 *         description: Restaurante no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

    // Construir URLs absolutas para el restaurante y productos
    restaurante.logoUrl = buildAbsoluteUrl(restaurante.logoUrl);
    restaurante.bannerUrl = buildAbsoluteUrl(restaurante.bannerUrl);
    restaurante.backgroundImage = buildAbsoluteUrl(restaurante.backgroundImage);
    
    restaurante.categorias.forEach(categoria => {
      categoria.productos.forEach(producto => {
        producto.imagenUrl = buildAbsoluteUrl(producto.imagenUrl);
      });
    });

    restaurante.mesas.forEach(mesa => {
      mesa.qrCode = buildAbsoluteUrl(mesa.qrCode);
    });

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
    
    // Construir URLs absolutas para el restaurante y productos
    restaurante.logoUrl = buildAbsoluteUrl(restaurante.logoUrl);
    restaurante.bannerUrl = buildAbsoluteUrl(restaurante.bannerUrl);
    restaurante.backgroundImage = buildAbsoluteUrl(restaurante.backgroundImage);
    
    restaurante.categorias.forEach(categoria => {
      categoria.productos.forEach(producto => {
        producto.imagenUrl = buildAbsoluteUrl(producto.imagenUrl);
      });
    });


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
    const { restaurantSlug } = req.query;

    const orden = await prisma.orden.findUnique({
      where: {
        id: ordenId
      },
      include: {
        mesa: true,
        sesion: true,
        restaurante: {
          select: {
            slug: true,
            nombre: true,
            moneda: true
          }
        },
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

    // Validar que la orden pertenece al restaurante correcto (si se proporciona el slug)
    if (restaurantSlug && orden.restaurante.slug !== restaurantSlug) {
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