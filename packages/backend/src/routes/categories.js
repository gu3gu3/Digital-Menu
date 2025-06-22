const express = require('express');
const Joi = require('joi');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { prisma } = require('../config/database');

const router = express.Router();

// Validation schemas
const categorySchema = Joi.object({
  nombre: Joi.string().min(2).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  descripcion: Joi.string().optional().allow(''),
  orden: Joi.number().integer().min(0).optional()
});

const updateCategorySchema = Joi.object({
  nombre: Joi.string().min(2).optional(),
  descripcion: Joi.string().optional().allow(''),
  orden: Joi.number().integer().min(0).optional(),
  activa: Joi.boolean().optional()
});

// @desc    Get all categories for restaurant
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const restauranteId = req.user.restauranteId;

    const categorias = await prisma.categoria.findMany({
      where: { restauranteId },
      include: {
        productos: {
          select: {
            id: true,
            nombre: true,
            disponible: true
          }
        }
      },
      orderBy: { orden: 'asc' }
    });

    res.json({
      success: true,
      data: {
        categorias
      }
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
const createCategory = async (req, res) => {
  try {
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { nombre, descripcion, orden } = value;
    const { restauranteId } = req.user;

    const restaurant = await prisma.restaurante.findUnique({
      where: { id: restauranteId },
      include: {
        plan: true,
        _count: {
          select: { categorias: true },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurante no encontrado.' });
    }

    const categoryCount = restaurant._count.categorias;
    const categoryLimit = restaurant.plan.limiteCategorias;

    if (categoryCount >= categoryLimit) {
      return res.status(403).json({
        success: false,
        error: `Has alcanzado el límite de ${categoryLimit} categorías para tu plan.`,
      });
    }

    const existingCategory = await prisma.categoria.findFirst({
      where: { restauranteId, nombre },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe una categoría con ese nombre.',
      });
    }

    let finalOrder = orden;
    if (finalOrder === undefined) {
      const lastCategory = await prisma.categoria.findFirst({
        where: { restauranteId },
        orderBy: { orden: 'desc' },
      });
      finalOrder = lastCategory ? lastCategory.orden + 1 : 0;
    }

    const newCategory = await prisma.categoria.create({
      data: {
        nombre,
        descripcion,
        orden: finalOrder,
        restauranteId,
        activa: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        categoria: newCategory,
        remaining: categoryLimit - (categoryCount + 1),
      },
    });

  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const restauranteId = req.user.restauranteId;

    // Validate input
    const { error, value } = updateCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if category exists and belongs to user's restaurant
    const existingCategory = await prisma.categoria.findFirst({
      where: {
        id,
        restauranteId
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Check for name conflicts if name is being updated
    if (value.nombre && value.nombre !== existingCategory.nombre) {
      const nameConflict = await prisma.categoria.findFirst({
        where: {
          restauranteId,
          nombre: value.nombre,
          id: { not: id }
        }
      });

      if (nameConflict) {
        return res.status(409).json({
          success: false,
          error: 'Ya existe una categoría con ese nombre'
        });
      }
    }

    const updatedCategory = await prisma.categoria.update({
      where: { id },
      data: value
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: {
        categoria: updatedCategory
      }
    });

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const restauranteId = req.user.restauranteId;

    // Check if category exists and belongs to user's restaurant
    const existingCategory = await prisma.categoria.findFirst({
      where: {
        id,
        restauranteId
      },
      include: {
        productos: true
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Check if category has products
    if (existingCategory.productos.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar una categoría que tiene productos. Elimine o mueva los productos primero.'
      });
    }

    await prisma.categoria.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes
router.get('/', authenticate, getCategories);
router.post('/', authenticate, requireAdmin, createCategory);
router.put('/:id', authenticate, requireAdmin, updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

module.exports = router; 