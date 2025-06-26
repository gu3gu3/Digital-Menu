const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { getAllCurrencies, isValidCurrency } = require('../utils/currencyUtils');
const { upload, handleFileUpload } = require('../config/storage');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schema para actualizar restaurante incluyendo moneda
const updateRestaurantSchema = Joi.object({
  nombre: Joi.string().min(2).optional(),
  descripcion: Joi.string().allow('').optional(),
  telefono: Joi.string().allow('').optional(),
  direccion: Joi.string().allow('').optional(),
  email: Joi.string().email().allow('').optional(), // Permitir cadena vacía
  moneda: Joi.string().valid('USD', 'NIO', 'CRC', 'HNL', 'GTQ', 'PAB', 'SVC').optional(),
  backgroundColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundImage: Joi.string().allow('').optional()
});

/**
 * @swagger
 * /api/restaurants/currencies:
 *   get:
 *     summary: Obtener monedas soportadas
 *     description: Devuelve todas las monedas soportadas por el sistema
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: Lista de monedas obtenida exitosamente
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
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "NIO"
 *                       name:
 *                         type: string
 *                         example: "Córdoba Nicaragüense"
 *                       symbol:
 *                         type: string
 *                         example: "C$"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /api/restaurants/currencies:
 *   get:
 *     summary: Obtener monedas soportadas
 *     description: Devuelve todas las monedas soportadas por el sistema
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: Lista de monedas obtenida exitosamente
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
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "NIO"
 *                       name:
 *                         type: string
 *                         example: "Córdoba Nicaragüense"
 *                       symbol:
 *                         type: string
 *                         example: "C$"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/currencies', async (req, res) => {
  try {
    const currencies = getAllCurrencies();
    
    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Error obteniendo monedas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/restaurants/me:
 *   get:
 *     summary: Obtener información del restaurante
 *     description: Devuelve la información completa del restaurante del administrador autenticado
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del restaurante obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Restaurant'
 *                     - type: object
 *                       properties:
 *                         admin:
 *                           type: object
 *                           properties:
 *                             nombre:
 *                               type: string
 *                               example: "Carlos"
 *                             apellido:
 *                               type: string
 *                               example: "González"
 *                             email:
 *                               type: string
 *                               example: "admin@bellavista.com"
 *                             telefono:
 *                               type: string
 *                               example: "+505 8888-9999"
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
router.get('/me', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, restauranteId } = req.user;

    // Obtener restaurante y usuario admin en una sola consulta
    const adminUser = await prisma.usuarioAdmin.findUnique({
      where: { id: userId },
      include: {
        restaurante: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!adminUser || !adminUser.restaurante) {
      return res.status(404).json({
        success: false,
        error: 'Restaurante o usuario no encontrado'
      });
    }
    
    // Preparar el objeto de respuesta
    const responseData = {
      ...adminUser.restaurante,
      admin: {
        nombre: adminUser.nombre,
        apellido: adminUser.apellido,
        email: adminUser.email,
        telefono: adminUser.telefono,
      }
    };

    res.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('Error obteniendo información del restaurante:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/restaurants/me:
 *   put:
 *     summary: Actualizar información del restaurante
 *     description: Actualiza la información básica del restaurante (sin archivos)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 example: "Bella Vista Restaurant"
 *               descripcion:
 *                 type: string
 *                 example: "Restaurante de comida tradicional nicaragüense"
 *               telefono:
 *                 type: string
 *                 example: "+505 2222-3333"
 *               direccion:
 *                 type: string
 *                 example: "Centro Comercial Managua, Local 15"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contacto@bellavista.com"
 *               moneda:
 *                 type: string
 *                 enum: [USD, NIO, CRC, HNL, GTQ, PAB, SVC]
 *                 example: "NIO"
 *               backgroundColor:
 *                 type: string
 *                 pattern: "^#[0-9A-Fa-f]{6}$"
 *                 example: "#FF6B35"
 *               backgroundImage:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200:
 *         description: Restaurante actualizado exitosamente
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
 *                   example: "Restaurante actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email ya está en uso
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
router.put('/me', authenticate, requireAdmin, async (req, res) => {
  try {
    const restauranteId = req.user.restauranteId;
    
    // Validar entrada
    const { error, value } = updateRestaurantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Validar que el email no esté en uso por otro restaurante
    if (value.email) {
      const existingRestaurant = await prisma.restaurante.findFirst({
        where: {
          email: value.email,
          id: { not: restauranteId }
        }
      });

      if (existingRestaurant) {
        return res.status(409).json({
          success: false,
          error: 'Este email ya está en uso por otro restaurante'
        });
      }
    }

    // Actualizar restaurante
    const updatedRestaurant = await prisma.restaurante.update({
      where: { id: restauranteId },
      data: value,
      include: {
        plan: {
          select: {
            nombre: true,
            limiteProductos: true,
            limiteCategorias: true,
            limiteMeseros: true,
            limiteMesas: true,
            limiteOrdenes: true,
            soporteEmail: true,
            soporteChat: true,
            analiticas: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Restaurante actualizado exitosamente',
      data: updatedRestaurant
    });

  } catch (error) {
    console.error('Error actualizando restaurante:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/restaurants/update:
 *   put:
 *     summary: Actualizar restaurante con archivos
 *     description: Actualiza la información del restaurante incluyendo logo, banner e imagen de fondo
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Bella Vista Restaurant"
 *               descripcion:
 *                 type: string
 *                 example: "Restaurante de comida tradicional"
 *               telefono:
 *                 type: string
 *                 example: "+505 2222-3333"
 *               direccion:
 *                 type: string
 *                 example: "Centro Comercial Managua, Local 15"
 *               backgroundColor:
 *                 type: string
 *                 example: "#FF6B35"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del logo (máximo 1 archivo)
 *               banner:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del banner (máximo 1 archivo)
 *               backgroundImage:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de fondo (máximo 1 archivo)
 *     responses:
 *       200:
 *         description: Restaurante actualizado exitosamente
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
 *                   example: "Restaurante actualizado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     restaurante:
 *                       $ref: '#/components/schemas/Restaurant'
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
router.put('/update', authenticate, requireAdmin, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nombre, descripcion, telefono, direccion, backgroundColor } = req.body;
    const restauranteId = req.user.restauranteId;

    // Obtener información del restaurante para usar en upload
    const restaurant = await prisma.restaurante.findUnique({
      where: { id: restauranteId },
      select: { nombre: true }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurante no encontrado'
      });
    }

    const updateData = {};
    
    // Add text fields if provided
    if (nombre) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (telefono) updateData.telefono = telefono;
    if (direccion) updateData.direccion = direccion;
    if (backgroundColor) updateData.backgroundColor = backgroundColor;

    // Handle file uploads using the proper storage system
    if (req.files) {
      if (req.files.logo) {
        const logoResult = await handleFileUpload(req.files.logo[0], restaurant.nombre, 'restaurant');
        updateData.logoUrl = logoResult.url;
      }
      if (req.files.banner) {
        const bannerResult = await handleFileUpload(req.files.banner[0], restaurant.nombre, 'restaurant');
        updateData.bannerUrl = bannerResult.url;
      }
      if (req.files.backgroundImage) {
        const bgResult = await handleFileUpload(req.files.backgroundImage[0], restaurant.nombre, 'restaurant');
        updateData.backgroundImage = bgResult.url;
      }
    }

    const updatedRestaurant = await prisma.restaurante.update({
      where: { id: restauranteId },
      data: updateData,
      include: { plan: true }
    });

    res.json({
      success: true,
      message: 'Restaurante actualizado exitosamente',
      data: {
        restaurante: updatedRestaurant
      }
    });

  } catch (error) {
    console.error('Error actualizando restaurante:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/restaurants/image/{imageType}:
 *   delete:
 *     summary: Eliminar imagen del restaurante
 *     description: Elimina una imagen específica del restaurante (logo, banner o background)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [logo, banner, background]
 *         description: Tipo de imagen a eliminar
 *         example: "logo"
 *     responses:
 *       200:
 *         description: Imagen eliminada exitosamente
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
 *                   example: "La imagen (logo) ha sido eliminada."
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Tipo de imagen no válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurante no encontrado o no hay imagen para eliminar
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
router.delete('/image/:imageType', authenticate, async (req, res) => {
  try {
    const { imageType } = req.params;
    const { restauranteId } = req.user;

    // Validar que el tipo de imagen sea uno de los permitidos
    const allowedImageTypes = ['logo', 'banner', 'background'];
    if (!allowedImageTypes.includes(imageType)) {
      return res.status(400).json({ success: false, error: 'Tipo de imagen no válido.' });
    }

    const restaurant = await prisma.restaurante.findUnique({
      where: { id: restauranteId },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurante no encontrado.' });
    }

    const fieldName = {
      logo: 'logoUrl',
      banner: 'bannerUrl',
      background: 'backgroundImage'
    }[imageType];

    const currentUrl = restaurant[fieldName];

    if (currentUrl) {
      // 1. Borrar el archivo de Google Cloud Storage
      try {
        const bucketName = process.env.GCP_STORAGE_BUCKET;
        // Extraer el nombre del archivo de la URL
        const fileName = currentUrl.split(`https://storage.googleapis.com/${bucketName}/`)[1];
        if (fileName) {
          const { storage } = require('../config/storage');
          await storage.bucket(bucketName).file(fileName).delete();
        }
      } catch (storageError) {
        // No bloquear si falla el borrado, pero registrar el error
        console.error(`Error al borrar el archivo ${currentUrl} de GCS:`, storageError);
      }

      // 2. Actualizar la base de datos poniendo el campo a null
      const updatedRestaurant = await prisma.restaurante.update({
        where: { id: restauranteId },
        data: { [fieldName]: null },
      });

      res.json({
        success: true,
        message: `La imagen (${imageType}) ha sido eliminada.`,
        data: updatedRestaurant,
      });
    } else {
      res.status(404).json({ success: false, error: 'No hay imagen para eliminar.' });
    }
  } catch (error) {
    console.error(`Error al eliminar la imagen del restaurante:`, error);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

module.exports = router; 