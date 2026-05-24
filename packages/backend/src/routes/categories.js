const express = require('express');
const Joi = require('joi');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { prisma } = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Categoria:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la categoría
 *         nombre:
 *           type: string
 *           description: Nombre de la categoría
 *           example: Tapas y Entrantes
 *         descripcion:
 *           type: string
 *           description: Descripción de la categoría
 *           example: Pequeños bocados para compartir
 *         orden:
 *           type: integer
 *           description: Orden de visualización
 *           example: 1
 *         activa:
 *           type: boolean
 *           description: Si la categoría está activa
 *           example: true
 *         restauranteId:
 *           type: string
 *           description: ID del restaurante propietario
 *         productos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               nombre:
 *                 type: string
 *               disponible:
 *                 type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateCategoriaRequest:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *           minLength: 2
 *           description: Nombre de la categoría
 *           example: Tapas y Entrantes
 *         descripcion:
 *           type: string
 *           description: Descripción opcional de la categoría
 *           example: Pequeños bocados para compartir
 *         orden:
 *           type: integer
 *           minimum: 0
 *           description: Orden de visualización (opcional, se asigna automáticamente si no se especifica)
 *           example: 1
 *     
 *     UpdateCategoriaRequest:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           minLength: 2
 *           description: Nuevo nombre de la categoría
 *           example: Entradas y Aperitivos
 *         descripcion:
 *           type: string
 *           description: Nueva descripción de la categoría
 *           example: Deliciosos bocados para empezar
 *         orden:
 *           type: integer
 *           minimum: 0
 *           description: Nuevo orden de visualización
 *           example: 2
 *         activa:
 *           type: boolean
 *           description: Estado de la categoría
 *           example: true
 *     
 *     CategoriaResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             categorias:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 */

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

const reorderCategoriesSchema = Joi.object({
  categorias: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      orden: Joi.number().integer().min(0).required()
    })
  ).min(1).required().messages({
    'array.min': 'Debe proporcionar al menos una categoría',
    'any.required': 'La lista de categorías es requerida'
  })
});

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtener todas las categorías del restaurante
 *     description: Devuelve todas las categorías del restaurante del usuario autenticado, ordenadas por el campo 'orden'
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriaResponse'
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
const getCategories = async (req, res) => {
  try {
    const restauranteId = req.user.restauranteId;

    const categorias = await prisma.categoria.findMany({
      where: { restauranteId, archivado: false },
      include: {
        productos: {
          where: { archivado: false },
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

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crear nueva categoría
 *     description: Crea una nueva categoría para el restaurante. Verifica límites del plan y nombres únicos.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoriaRequest'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Categoría creada exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoria:
 *                       $ref: '#/components/schemas/Categoria'
 *                     remaining:
 *                       type: integer
 *                       description: Categorías restantes según el plan
 *                       example: 4
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Límite de categorías alcanzado para el plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Has alcanzado el límite de 5 categorías para tu plan.
 *       409:
 *         description: Ya existe una categoría con ese nombre
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

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Actualizar categoría existente
 *     description: Actualiza una categoría del restaurante. Verifica permisos y nombres únicos.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría a actualizar
 *         example: cmc6y8pa200011cahfgtlekcs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoriaRequest'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Categoría actualizada exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoria:
 *                       $ref: '#/components/schemas/Categoria'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Categoría no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Ya existe una categoría con ese nombre
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
        restauranteId,
        archivado: false
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
          id: { not: id },
          archivado: false
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

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     description: Elimina una categoría del restaurante. No se puede eliminar si tiene productos asociados.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría a eliminar
 *         example: cmc6y8pa200011cahfgtlekcs
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Categoría eliminada exitosamente
 *       400:
 *         description: No se puede eliminar - categoría tiene productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: No se puede eliminar una categoría que tiene productos. Elimine o mueva los productos primero.
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Categoría no encontrada
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
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const restauranteId = req.user.restauranteId;

    // Check if category exists and belongs to user's restaurant
    const existingCategory = await prisma.categoria.findFirst({
      where: {
        id,
        restauranteId,
        archivado: false
      },
      include: {
        productos: true // Include all products, even archived, to check for orders
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
      // Check if any product has orders
      const productosIds = existingCategory.productos.map(p => p.id);
      const ordersWithProducts = await prisma.itemOrden.findFirst({
        where: { productoId: { in: productosIds } }
      });

      if (ordersWithProducts) {
        // Soft delete category and products
        await prisma.$transaction([
          prisma.producto.updateMany({
             where: { id: { in: productosIds }, archivado: false },
             data: { archivado: true }
          }),
          prisma.categoria.update({
             where: { id },
             data: { archivado: true, activa: false }
          })
        ]);
        return res.json({ success: true, message: 'Categoría eliminada exitosamente' });
      } else {
        // Hard delete products and category
        await prisma.$transaction([
          prisma.producto.deleteMany({
             where: { id: { in: productosIds } }
          }),
          prisma.categoria.delete({
             where: { id }
          })
        ]);
        return res.json({ success: true, message: 'Categoría eliminada exitosamente' });
      }
    } else {
      await prisma.categoria.delete({
        where: { id }
      });
      return res.json({ success: true, message: 'Categoría eliminada exitosamente' });
    }

  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Reordenar categorías
 */
const reorderCategories = async (req, res) => {
  try {
    console.log('🔄 Reorder request received:', {
      body: req.body,
      bodyType: typeof req.body,
      keys: Object.keys(req.body || {}),
      categorias: req.body?.categorias
    });

    const { error } = reorderCategoriesSchema.validate(req.body);
    if (error) {
      console.error('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { categorias } = req.body;
    const restauranteId = req.user.restauranteId;

    // Verificar que todas las categorías pertenecen al restaurante
    const categoryIds = categorias.map(cat => cat.id);
    const existingCategories = await prisma.categoria.findMany({
      where: {
        id: { in: categoryIds },
        restauranteId
      },
      select: { id: true }
    });

    if (existingCategories.length !== categorias.length) {
      return res.status(400).json({
        success: false,
        error: 'Una o más categorías no pertenecen a este restaurante'
      });
    }

    // Actualizar el orden de cada categoría usando transacción
    await prisma.$transaction(
      categorias.map(categoria => 
        prisma.categoria.update({
          where: { id: categoria.id },
          data: { orden: categoria.orden }
        })
      )
    );

    // Obtener las categorías actualizadas
    const updatedCategories = await prisma.categoria.findMany({
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
      message: 'Orden de categorías actualizado exitosamente',
      data: {
        categorias: updatedCategories
      }
    });

  } catch (error) {
    console.error('Error reordenando categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Routes with Swagger documentation

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtener categorías del restaurante
 *     description: Devuelve todas las categorías del restaurante con sus productos (opcional)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeProducts
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir productos en cada categoría
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir categorías inactivas
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, getCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crear nueva categoría
 *     description: Crea una nueva categoría para el restaurante respetando límites del plan
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nombre de la categoría
 *                 example: "Bebidas"
 *               descripcion:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción de la categoría
 *                 example: "Bebidas frías y calientes"
 *               activo:
 *                 type: boolean
 *                 default: true
 *                 description: Estado activo de la categoría
 *               ordenVisualizacion:
 *                 type: integer
 *                 minimum: 0
 *                 description: Orden de visualización
 *                 example: 1
 *           examples:
 *             new_category:
 *               summary: Nueva categoría
 *               value:
 *                 nombre: "Postres"
 *                 descripcion: "Deliciosos postres caseros"
 *                 activo: true
 *                 ordenVisualizacion: 3
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Categoría creada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoria:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Datos inválidos o límite de plan alcanzado
 *       409:
 *         description: Ya existe una categoría con ese nombre
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.post('/', authenticate, requireAdmin, createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     description: Actualiza una categoría existente del restaurante
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nombre de la categoría
 *               descripcion:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción de la categoría
 *               activo:
 *                 type: boolean
 *                 description: Estado activo de la categoría
 *               ordenVisualizacion:
 *                 type: integer
 *                 minimum: 0
 *                 description: Orden de visualización
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Categoría actualizada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoria:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Categoría no encontrada
 *       409:
 *         description: Ya existe una categoría con ese nombre
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
/**
 * @swagger
 * /api/categories/reorder:
 *   put:
 *     summary: Reordenar categorías
 *     description: Actualiza el orden de visualización de múltiples categorías mediante drag & drop
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categorias
 *             properties:
 *               categorias:
 *                 type: array
 *                 description: Lista de categorías con su nuevo orden
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - orden
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID de la categoría
 *                       example: "clm123abc456"
 *                     orden:
 *                       type: integer
 *                       minimum: 0
 *                       description: Nuevo orden de visualización
 *                       example: 1
 *           examples:
 *             reorder_example:
 *               summary: Reordenar 3 categorías
 *               value:
 *                 categorias:
 *                   - id: "clm123abc456"
 *                     orden: 1
 *                   - id: "clm789def012"
 *                     orden: 2
 *                   - id: "clm345ghi678"
 *                     orden: 3
 *     responses:
 *       200:
 *         description: Orden actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Orden de categorías actualizado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     categorias:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Categoria'
 *       400:
 *         description: Datos inválidos o categorías no pertenecen al restaurante
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 *       500:
 *         description: Error interno del servidor
 */
router.put('/reorder', authenticate, requireAdmin, reorderCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     description: Actualiza una categoría existente del restaurante
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nombre de la categoría
 *               descripcion:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción de la categoría
 *               activo:
 *                 type: boolean
 *                 description: Estado activo de la categoría
 *               ordenVisualizacion:
 *                 type: integer
 *                 minimum: 0
 *                 description: Orden de visualización
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Categoría actualizada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoria:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Categoría no encontrada
 *       409:
 *         description: Ya existe una categoría con ese nombre
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acceso denegado - solo administradores
 */
router.put('/:id', authenticate, requireAdmin, updateCategory);

router.delete('/:id', authenticate, requireAdmin, deleteCategory);

module.exports = router; 