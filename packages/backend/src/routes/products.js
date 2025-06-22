const express = require('express');
const Joi = require('joi');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const { upload, handleFileUpload } = require('../config/storage');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del producto
 *         nombre:
 *           type: string
 *           description: Nombre del producto
 *           example: Bruschettas de Prosciutto
 *         descripcion:
 *           type: string
 *           description: Descripción del producto
 *           example: Pan tostado con tomate, albahaca y prosciutto
 *         precio:
 *           type: number
 *           format: float
 *           description: Precio del producto
 *           example: 25.00
 *         imagenUrl:
 *           type: string
 *           description: URL de la imagen del producto
 *           example: http://localhost:3001/uploads/products/product-123.jpg
 *         disponible:
 *           type: boolean
 *           description: Si el producto está disponible
 *           example: true
 *         orden:
 *           type: integer
 *           description: Orden de visualización en la categoría
 *           example: 1
 *         categoriaId:
 *           type: string
 *           description: ID de la categoría a la que pertenece
 *         restauranteId:
 *           type: string
 *           description: ID del restaurante propietario
 *         categoria:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nombre:
 *               type: string
 *               example: Tapas y Entrantes
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateProductoRequest:
 *       type: object
 *       required:
 *         - nombre
 *         - precio
 *         - categoriaId
 *       properties:
 *         nombre:
 *           type: string
 *           minLength: 2
 *           description: Nombre del producto
 *           example: Bruschettas de Prosciutto
 *         descripcion:
 *           type: string
 *           description: Descripción del producto
 *           example: Pan tostado con tomate, albahaca y prosciutto
 *         precio:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: Precio del producto
 *           example: 25.00
 *         categoriaId:
 *           type: string
 *           description: ID de la categoría
 *           example: cmc0n7ggg004d4t5g1lm5r3ab
 *         orden:
 *           type: integer
 *           minimum: 0
 *           description: Orden de visualización (opcional)
 *           example: 1
 *         disponible:
 *           type: boolean
 *           description: Estado de disponibilidad (opcional, por defecto true)
 *           example: true
 *     
 *     UpdateProductoRequest:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           minLength: 2
 *           description: Nuevo nombre del producto
 *           example: Bruschettas Especiales
 *         descripcion:
 *           type: string
 *           description: Nueva descripción del producto
 *           example: Pan artesanal con tomate, albahaca fresca y prosciutto importado
 *         precio:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: Nuevo precio del producto
 *           example: 28.00
 *         categoriaId:
 *           type: string
 *           description: Nueva categoría del producto
 *           example: cmc0n7ggg004d4t5g1lm5r3ab
 *         orden:
 *           type: integer
 *           minimum: 0
 *           description: Nuevo orden de visualización
 *           example: 2
 *         disponible:
 *           type: boolean
 *           description: Nuevo estado de disponibilidad
 *           example: false
 *     
 *     ProductoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             productos:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 */

// Validation schemas
const productSchema = Joi.object({
  nombre: Joi.string().min(2).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  descripcion: Joi.string().optional().allow(''),
  precio: Joi.number().positive().required().messages({
    'number.positive': 'El precio debe ser mayor a 0',
    'any.required': 'El precio es requerido'
  }),
  categoriaId: Joi.string().required().messages({
    'any.required': 'La categoría es requerida'
  }),
  orden: Joi.number().integer().min(0).optional(),
  disponible: Joi.boolean().optional()
});

const updateProductSchema = Joi.object({
  nombre: Joi.string().min(2).optional(),
  descripcion: Joi.string().optional().allow(''),
  precio: Joi.number().positive().optional(),
  categoriaId: Joi.string().optional(),
  orden: Joi.number().integer().min(0).optional(),
  disponible: Joi.boolean().optional()
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtener todos los productos del restaurante
 *     description: Devuelve todos los productos del restaurante del usuario autenticado, opcionalmente filtrados por categoría
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoriaId
 *         schema:
 *           type: string
 *         description: ID de la categoría para filtrar productos (opcional)
 *         example: cmc0n7ggg004d4t5g1lm5r3ab
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductoResponse'
 *       401:
 *         description: No autorizado - Token inválido o faltante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const getProducts = async (req, res) => {
  try {
    const restauranteId = req.user.restauranteId;
    const { categoriaId } = req.query;

    const whereClause = { restauranteId };
    if (categoriaId) {
      whereClause.categoriaId = categoriaId;
    }

    const productos = await prisma.producto.findMany({
      where: whereClause,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { categoria: { orden: 'asc' } },
        { orden: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: {
        productos
      }
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private (Admin only)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const restauranteId = req.user.restauranteId;

    const producto = await prisma.producto.findFirst({
      where: {
        id,
        restauranteId
      },
      include: {
        categoria: {
          select: { id: true, nombre: true }
        }
      }
    });

    if (!producto) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    res.json({
      success: true,
      data: {
        producto
      }
    });

  } catch (error) {
    console.error(`Error obteniendo producto ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
const createProduct = async (req, res) => {
  try {
    // Validate input
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { nombre, descripcion, precio, categoriaId, orden, disponible } = value;
    const restauranteId = req.user.restauranteId;

    // Verify category belongs to user's restaurant
    const categoria = await prisma.categoria.findFirst({
      where: {
        id: categoriaId,
        restauranteId
      }
    });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Check if product name already exists in this category
    const existingProduct = await prisma.producto.findFirst({
      where: {
        restauranteId,
        categoriaId,
        nombre
      }
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un producto con ese nombre en esta categoría'
      });
    }

    // Get next order if not provided
    let finalOrder = orden;
    if (finalOrder === undefined) {
      const lastProduct = await prisma.producto.findFirst({
        where: { categoriaId },
        orderBy: { orden: 'desc' }
      });
      finalOrder = lastProduct ? lastProduct.orden + 1 : 0;
    }

    // Handle image upload using the helper
    let imagenUrl = null;
    if (req.file) {
      const restaurante = await prisma.restaurante.findUnique({
        where: { id: restauranteId },
        select: { nombre: true }
      });

      if (!restaurante) {
        return res.status(404).json({ success: false, error: 'Restaurante no encontrado para la subida de imagen' });
      }

      const uploadResult = await handleFileUpload(req.file, restaurante.nombre, 'product');
      imagenUrl = uploadResult.url;
    }

    const newProduct = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        precio,
        categoriaId,
        restauranteId,
        orden: finalOrder,
        disponible: disponible !== undefined ? disponible : true,
        imagenUrl
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        producto: newProduct
      }
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const restauranteId = req.user.restauranteId;

    // Validate input
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if product exists and belongs to user's restaurant
    const existingProduct = await prisma.producto.findFirst({
      where: {
        id,
        restauranteId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // If category is being updated, verify it belongs to user's restaurant
    if (value.categoriaId) {
      const categoria = await prisma.categoria.findFirst({
        where: {
          id: value.categoriaId,
          restauranteId
        }
      });

      if (!categoria) {
        return res.status(404).json({
          success: false,
          error: 'Categoría no encontrada'
        });
      }
    }

    // Check for name conflicts if name or category is being updated
    if (value.nombre || value.categoriaId) {
      const checkCategoriaId = value.categoriaId || existingProduct.categoriaId;
      const checkNombre = value.nombre || existingProduct.nombre;

      const nameConflict = await prisma.producto.findFirst({
        where: {
          restauranteId,
          categoriaId: checkCategoriaId,
          nombre: checkNombre,
          id: { not: id }
        }
      });

      if (nameConflict) {
        return res.status(409).json({
          success: false,
          error: 'Ya existe un producto con ese nombre en esta categoría'
        });
      }
    }

    const restaurante = await prisma.restaurante.findUnique({
      where: { id: restauranteId },
      select: { nombre: true }
    });

    if (!restaurante) {
      return res.status(404).json({ success: false, error: 'Restaurante no encontrado para la subida de imagen' });
    }
    
    // Prepare data for update
    const updateData = { ...value };

    // Handle image upload if a new file is provided
    if (req.file) {
      const uploadResult = await handleFileUpload(req.file, restaurante.nombre, 'product');
      updateData.imagenUrl = uploadResult.url;
    }

    const updatedProduct = await prisma.producto.update({
      where: { id },
      data: updateData,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        producto: updatedProduct
      }
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const restauranteId = req.user.restauranteId;

    // Check if product exists and belongs to user's restaurant
    const existingProduct = await prisma.producto.findFirst({
      where: {
        id,
        restauranteId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Check if product is in any orders (optional - depends on business logic)
    const productInOrders = await prisma.itemOrden.findFirst({
      where: { productoId: id }
    });

    if (productInOrders) {
      // Instead of deleting, mark as unavailable
      await prisma.producto.update({
        where: { id },
        data: { disponible: false }
      });

      return res.json({
        success: true,
        message: 'Producto marcado como no disponible debido a órdenes existentes'
      });
    }

    await prisma.producto.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Toggle product availability
// @route   PATCH /api/products/:id/toggle-availability
// @access  Private (Admin only)
const toggleProductAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const restauranteId = req.user.restauranteId;

    // Check if product exists and belongs to user's restaurant
    const existingProduct = await prisma.producto.findFirst({
      where: {
        id,
        restauranteId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Toggle availability
    const updatedProduct = await prisma.producto.update({
      where: { id },
      data: { 
        disponible: !existingProduct.disponible 
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Producto marcado como ${updatedProduct.disponible ? 'disponible' : 'no disponible'}`,
      data: {
        producto: updatedProduct
      }
    });

  } catch (error) {
    console.error('Error toggling product availability:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes
router.route('/')
  .get(authenticate, requireAdmin, getProducts)
  .post(authenticate, requireAdmin, upload.single('imagen'), createProduct);

router.route('/:id')
  .get(authenticate, requireAdmin, getProductById)
  .put(authenticate, requireAdmin, upload.single('imagen'), updateProduct)
  .delete(authenticate, requireAdmin, deleteProduct);

router.route('/:id/toggle-availability')
  .patch(authenticate, requireAdmin, toggleProductAvailability);

module.exports = router; 