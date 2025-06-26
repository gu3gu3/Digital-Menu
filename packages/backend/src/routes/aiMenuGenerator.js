/**
 * @swagger
 * tags:
 *   name: AI Menu Generator
 *   description: Generación automática de menús usando IA y creación masiva de mesas
 */

const express = require('express');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { authenticateSuperAdmin } = require('../middleware/superAdminAuth');
const OpenAI = require('openai');
const { buildMenuExtractionPrompt, buildDescriptionPrompt } = require('../config/aiPrompts');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Configuración específica de multer para IA (permite PDFs)
const aiUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for AI processing
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG) y PDF'), false);
    }
  }
});

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 240000, // 4 minutos para procesamiento de imágenes
});

// Esquema de validación para la creación de menú con IA
const aiMenuSchema = Joi.object({
  restauranteId: Joi.string().required().messages({
    'any.required': 'El ID del restaurante es requerido'
  }),
  replaceExistingMenu: Joi.boolean().default(false),
  generateDescriptions: Joi.boolean().default(true),
  menuType: Joi.string().valid('FAST_FOOD', 'FINE_DINING', 'PIZZA', 'CAFE_BAKERY', 'BAR').optional(),
  specialCases: Joi.array().items(Joi.string().valid('MULTILINGUAL', 'WITH_IMAGES', 'PROMOTIONS', 'POOR_QUALITY')).default([])
});

// Esquema de validación para creación masiva de mesas
const bulkTablesSchema = Joi.object({
  restauranteId: Joi.string().required(),
  baseName: Joi.string().required().messages({
    'any.required': 'El nombre base es requerido'
  }),
  count: Joi.number().integer().min(1).max(50).required().messages({
    'number.min': 'Debe crear al menos 1 mesa',
    'number.max': 'No se pueden crear más de 50 mesas a la vez',
    'any.required': 'La cantidad es requerida'
  }),
  startNumber: Joi.number().integer().min(1).default(1),
  capacity: Joi.number().integer().min(1).default(4)
});

/**
 * @swagger
 * components:
 *   schemas:
 *     AIMenuRequest:
 *       type: object
 *       required:
 *         - restauranteId
 *       properties:
 *         restauranteId:
 *           type: string
 *           description: ID del restaurante donde crear el menú
 *         replaceExistingMenu:
 *           type: boolean
 *           description: Si reemplazar el menú existente
 *           default: false
 *         generateDescriptions:
 *           type: boolean
 *           description: Si generar descripciones automáticamente
 *           default: true
 *     
 *     BulkTablesRequest:
 *       type: object
 *       required:
 *         - restauranteId
 *         - baseName
 *         - count
 *       properties:
 *         restauranteId:
 *           type: string
 *           description: ID del restaurante
 *         baseName:
 *           type: string
 *           description: Nombre base para las mesas
 *           example: "Mesa"
 *         count:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           description: Número de mesas a crear
 *           example: 10
 *         startNumber:
 *           type: integer
 *           minimum: 1
 *           description: Número inicial
 *           default: 1
 *         capacity:
 *           type: integer
 *           minimum: 1
 *           description: Capacidad por mesa
 *           default: 4
 */

// Función para extraer información del menú usando GPT-4-vision
async function extractMenuFromImages(imageBuffers, mimeTypes, menuType = null, specialCases = []) {
  try {
    console.log('🔍 Procesando imágenes:', {
      numImages: imageBuffers.length,
      mimeTypes,
      menuType,
      specialCases
    });

    const allMenuData = { categorias: [] };
    
    // Validar que tenemos buffers válidos
    if (!imageBuffers || imageBuffers.length === 0) {
      throw new Error('No se proporcionaron buffers de imagen válidos');
    }
    
    // Procesar cada imagen
    for (let i = 0; i < imageBuffers.length; i++) {
      const imageBuffer = imageBuffers[i];
      const mimeType = mimeTypes[i];
      
      console.log(`📸 Procesando imagen ${i + 1}/${imageBuffers.length}:`, {
        hasBuffer: !!imageBuffer,
        bufferLength: imageBuffer?.length || 0,
        mimeType
      });

      // Validar buffer individual
      if (!imageBuffer) {
        throw new Error(`Buffer de imagen ${i + 1} es undefined`);
      }
      
      // Convertir buffer a base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Construir prompt personalizado
      const promptText = buildMenuExtractionPrompt(menuType, specialCases);
      
      // Si es la primera imagen, usar prompt completo
      // Si es imagen adicional, indicar que es continuación
      const contextText = i === 0 
        ? promptText
        : `Esta es una imagen adicional del mismo menú. Extrae la información y responde con el mismo formato JSON. Si hay categorías repetidas, agrega los productos nuevos a las categorías existentes.\n\n${promptText}`;

      console.log(`🤖 Enviando imagen ${i + 1} a OpenAI...`);
      const startTime = Date.now();
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: contextText
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ OpenAI respondió para imagen ${i + 1} en ${processingTime}ms`);

      const content = response.choices[0].message.content;
      
      // Limpiar el contenido para asegurar que sea JSON válido
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const imageMenuData = JSON.parse(cleanContent);
      
      // Combinar datos de múltiples imágenes
      if (imageMenuData.categorias) {
        mergeMenuData(allMenuData, imageMenuData);
      }
    }
    
    return allMenuData;
  } catch (error) {
    console.error('Error extracting menu from images:', error);
    throw new Error('Error procesando las imágenes con IA: ' + error.message);
  }
}

// Función para extraer menú con prompt personalizado
async function extractMenuWithCustomPrompt(imageBuffers, mimeTypes, customPrompt) {
  try {
    console.log('🎯 Procesando con prompt personalizado:', {
      numImages: imageBuffers.length,
      promptLength: customPrompt.length
    });

    const allMenuData = { categorias: [] };
    
    // Validar que tenemos buffers válidos
    if (!imageBuffers || imageBuffers.length === 0) {
      throw new Error('No se proporcionaron buffers de imagen válidos');
    }
    
    // Procesar cada imagen
    for (let i = 0; i < imageBuffers.length; i++) {
      const imageBuffer = imageBuffers[i];
      const mimeType = mimeTypes[i];
      
      console.log(`📸 Procesando imagen ${i + 1}/${imageBuffers.length} con prompt custom`);

      // Validar buffer individual
      if (!imageBuffer) {
        throw new Error(`Buffer de imagen ${i + 1} es undefined`);
      }
      
      // Convertir buffer a base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Usar prompt personalizado
      const contextText = i === 0 
        ? customPrompt
        : `Esta es una imagen adicional del mismo menú. ${customPrompt}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: contextText
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      });

      const content = response.choices[0].message.content;
      
      // Limpiar el contenido para asegurar que sea JSON válido
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const imageMenuData = JSON.parse(cleanContent);
      
      // Combinar datos de múltiples imágenes
      if (imageMenuData.categorias) {
        mergeMenuData(allMenuData, imageMenuData);
      }
    }
    
    return allMenuData;
  } catch (error) {
    console.error('Error extracting menu with custom prompt:', error);
    throw new Error('Error procesando las imágenes con prompt personalizado: ' + error.message);
  }
}

// Función para combinar datos de menú de múltiples imágenes
function mergeMenuData(targetMenu, sourceMenu) {
  if (!sourceMenu.categorias) return;
  
  sourceMenu.categorias.forEach(sourceCategory => {
    // Buscar si la categoría ya existe
    let existingCategory = targetMenu.categorias.find(
      cat => cat.nombre.toLowerCase() === sourceCategory.nombre.toLowerCase()
    );
    
    if (existingCategory) {
      // Agregar productos nuevos a categoría existente
      sourceCategory.productos.forEach(sourceProduct => {
        const existingProduct = existingCategory.productos.find(
          prod => prod.nombre.toLowerCase() === sourceProduct.nombre.toLowerCase()
        );
        
        if (!existingProduct) {
          // Ajustar orden del producto
          sourceProduct.orden = existingCategory.productos.length + 1;
          existingCategory.productos.push(sourceProduct);
        }
      });
    } else {
      // Agregar categoría nueva
      sourceCategory.orden = targetMenu.categorias.length + 1;
      targetMenu.categorias.push(sourceCategory);
    }
  });
}

// Función para generar descripciones faltantes
async function generateMissingDescriptions(menuData) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Eres un experto en gastronomía y marketing culinario. Generas descripciones atractivas y apetitosas para productos de menú que sean concisas pero persuasivas."
        },
        {
          role: "user",
          content: buildDescriptionPrompt(menuData)
        }
      ],
      max_tokens: 3000
    });

    const content = response.choices[0].message.content;
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Error generating descriptions:', error);
    return menuData; // Retornar datos originales si falla
  }
}

/**
 * @swagger
 * /api/super-admin/ai-menu-generator/generate:
 *   post:
 *     summary: Generar menú usando IA desde imagen
 *     description: Sube una imagen de menú y genera automáticamente categorías y productos usando GPT-4-vision
 *     tags: [AI Menu Generator]
 *     security:
 *       - superAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - menuImage
 *               - restauranteId
 *             properties:
 *               menuImage:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del menú (PNG, JPG, PDF)
 *               restauranteId:
 *                 type: string
 *                 description: ID del restaurante
 *               replaceExistingMenu:
 *                 type: boolean
 *                 description: Si reemplazar el menú existente
 *               generateDescriptions:
 *                 type: boolean
 *                 description: Si generar descripciones automáticamente
 *     responses:
 *       200:
 *         description: Menú generado exitosamente
 *       400:
 *         description: Error en la validación o procesamiento
 *       401:
 *         description: No autorizado
 */
/**
 * @swagger
 * /api/super-admin/ai-menu-generator/generate:
 *   post:
 *     summary: Generar menú desde imágenes usando IA
 *     description: |
 *       Utiliza GPT-4 Vision para extraer información de imágenes de menú y crear automáticamente 
 *       las categorías y productos en el sistema. Soporta múltiples imágenes (máximo 3) y prompts 
 *       personalizables según el tipo de menú. Opcionalmente puede generar descripciones mejoradas 
 *       y reemplazar el menú existente.
 *     tags: [AI Menu Generator]
 *     security:
 *       - superAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - menuImages
 *               - restauranteId
 *             properties:
 *               menuImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 'Imágenes del menú (PNG, JPG, JPEG o PDF, máximo 5MB cada una, máximo 3 archivos)'
 *               restauranteId:
 *                 type: string
 *                 description: 'ID del restaurante donde crear el menú'
 *               replaceExistingMenu:
 *                 type: boolean
 *                 default: false
 *                 description: 'Si eliminar el menú existente antes de crear el nuevo'
 *               generateDescriptions:
 *                 type: boolean
 *                 default: true
 *                 description: 'Si generar descripciones mejoradas con IA para productos sin descripción'
 *               menuType:
 *                 type: string
 *                 enum: [FAST_FOOD, FINE_DINING, PIZZA, CAFE_BAKERY, BAR]
 *                 description: 'Tipo de menú para optimizar la extracción (opcional)'
 *               specialCases:
 *                 type: string
 *                 description: 'JSON array de casos especiales: MULTILINGUAL, WITH_IMAGES, PROMOTIONS, POOR_QUALITY (opcional)'
 *     responses:
 *       200:
 *         description: Menú generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIMenuGenerateResponse'
 *       400:
 *         description: Error en la validación de datos o archivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado - Token de super admin requerido
 *       404:
 *         description: Restaurante no encontrado
 *       500:
 *         description: Error interno del servidor o error de OpenAI
 */

router.post('/generate', authenticateSuperAdmin, aiUpload.array('menuImages', 3), async (req, res) => {
  try {
    // Verificar que OpenAI esté configurado
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Generador de menú con IA no está configurado. Contacte al administrador.'
      });
    }
    
    // Validar datos
    const { error, value } = aiMenuSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { restauranteId, replaceExistingMenu, generateDescriptions, menuType, specialCases } = value;

    // Validar que se subieron archivos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos una imagen del menú'
      });
    }

    // Validar que no se excedan 3 archivos
    if (req.files.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Máximo 3 archivos permitidos'
      });
    }

    // Validar cada archivo
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB por archivo
    
    for (const file of req.files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `Archivo ${file.originalname}: Tipo no válido. Solo se permiten PNG, JPG, JPEG y PDF`
        });
      }
      
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `Archivo ${file.originalname}: Demasiado grande. Máximo 5MB por archivo`
        });
      }
    }

    // Verificar que el restaurante existe
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: restauranteId },
      include: {
        categorias: {
          include: {
            productos: true
          }
        }
      }
    });

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        error: 'Restaurante no encontrado'
      });
    }

    // Extraer información del menú usando IA
    console.log('📁 Archivos recibidos:', {
      numFiles: req.files.length,
      files: req.files.map(f => ({ 
        name: f.originalname, 
        size: f.size, 
        mimetype: f.mimetype,
        hasBuffer: !!f.buffer 
      }))
    });

    const imageBuffers = req.files.map(file => file.buffer);
    const mimeTypes = req.files.map(file => file.mimetype);
    
    console.log('🔧 Buffers extraídos:', {
      buffersLength: imageBuffers.length,
      buffersValid: imageBuffers.map(b => !!b)
    });

    const menuData = await extractMenuFromImages(imageBuffers, mimeTypes, menuType, specialCases);
    
    // Generar descripciones mejoradas si se solicita
    const finalMenuData = generateDescriptions 
      ? await generateMissingDescriptions(menuData)
      : menuData;

    // Si se debe reemplazar el menú existente, desactivar productos existentes
    if (replaceExistingMenu) {
      console.log('🔄 Reemplazando menú existente - desactivando productos...');
      
      // Desactivar productos existentes en lugar de eliminarlos
      // Esto evita violaciones de clave foránea con órdenes existentes
      await prisma.producto.updateMany({
        where: { restauranteId },
        data: { disponible: false }
      });
      
      console.log('✅ Productos existentes desactivados');
      
      // Las categorías las podemos eliminar si no tienen restricciones
      try {
        await prisma.categoria.deleteMany({
          where: { restauranteId }
        });
        console.log('✅ Categorías existentes eliminadas');
      } catch (error) {
        console.log('⚠️ No se pudieron eliminar categorías (puede haber referencias), continuando...');
      }
    }

    // Crear categorías y productos
    const createdCategories = [];
    const createdProducts = [];

    for (const categoriaData of finalMenuData.categorias) {
      // Crear o encontrar categoría
      let categoria = await prisma.categoria.upsert({
        where: {
          restauranteId_nombre: {
            restauranteId,
            nombre: categoriaData.nombre
          }
        },
        update: {
          descripcion: categoriaData.descripcion,
          orden: categoriaData.orden
        },
        create: {
          nombre: categoriaData.nombre,
          descripcion: categoriaData.descripcion,
          orden: categoriaData.orden,
          restauranteId
        }
      });

      createdCategories.push(categoria);

      // Crear productos de la categoría
      for (const productoData of categoriaData.productos) {
        const producto = await prisma.producto.upsert({
          where: {
            restauranteId_nombre: {
              restauranteId,
              nombre: productoData.nombre
            }
          },
          update: {
            descripcion: productoData.descripcion,
            precio: productoData.precio,
            disponible: productoData.disponible,
            orden: productoData.orden,
            categoriaId: categoria.id
          },
          create: {
            nombre: productoData.nombre,
            descripcion: productoData.descripcion,
            precio: productoData.precio,
            disponible: productoData.disponible,
            orden: productoData.orden,
            categoriaId: categoria.id,
            restauranteId
          }
        });

        createdProducts.push(producto);
      }
    }

    res.json({
      success: true,
      message: 'Menú generado exitosamente con IA',
      data: {
        restaurante: restaurante.nombre,
        categoriasCreadas: createdCategories.length,
        productosCreados: createdProducts.length,
        menuData: finalMenuData
      }
    });

  } catch (error) {
    console.error('Error generating menu with AI:', error);
    
    // Determinar el tipo de error para dar mejor feedback
    let errorMessage = 'Error interno del servidor';
    let statusCode = 500;
    
    if (error.code === 'P2003') {
      errorMessage = 'No se puede reemplazar el menú porque tiene productos en órdenes activas. Intente sin la opción "Reemplazar menú existente".';
      statusCode = 400;
    } else if (error.message?.includes('OpenAI')) {
      errorMessage = 'Error procesando imágenes con IA: ' + error.message;
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'La operación tardó demasiado tiempo. Intente con menos imágenes o imágenes más pequeñas.';
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/super-admin/ai-menu-generator/bulk-tables:
 *   post:
 *     summary: Crear múltiples mesas consecutivas
 *     description: |
 *       Crea múltiples mesas con nombres consecutivos para un restaurante. 
 *       Útil para crear rápidamente mesas, habitaciones, salones, etc.
 *       Evita automáticamente conflictos de numeración.
 *     tags: [AI Menu Generator]
 *     security:
 *       - superAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkTablesRequest'
 *           example:
 *             restauranteId: "1"
 *             baseName: "Mesa"
 *             count: 10
 *             startNumber: 1
 *             capacity: 4
 *     responses:
 *       200:
 *         description: Mesas creadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkTablesResponse'
 *             example:
 *               success: true
 *               message: "10 mesas creadas exitosamente"
 *               data:
 *                 restaurante: "Bella Vista"
 *                 mesasCreadas: 10
 *                 rangoNumeros: "1 - 10"
 *       400:
 *         description: Error en la validación de datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado - Token de super admin requerido
 *       404:
 *         description: Restaurante no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/bulk-tables', authenticateSuperAdmin, async (req, res) => {
  try {
    // Validar datos
    const { error, value } = bulkTablesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { restauranteId, baseName, count, startNumber, capacity } = value;

    // Verificar que el restaurante existe
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: restauranteId }
    });

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        error: 'Restaurante no encontrado'
      });
    }

    // Obtener el número más alto actual para evitar conflictos
    const lastTable = await prisma.mesa.findFirst({
      where: { restauranteId },
      orderBy: { numero: 'desc' }
    });

    const baseNumber = Math.max(startNumber, (lastTable?.numero || 0) + 1);
    
    // Crear mesas
    const createdTables = [];
    for (let i = 0; i < count; i++) {
      const numeroMesa = baseNumber + i;
      const nombreMesa = `${baseName} ${numeroMesa}`;
      
      const mesa = await prisma.mesa.create({
        data: {
          nombre: nombreMesa,
          numero: numeroMesa,
          capacidad: capacity,
          restauranteId,
          qrCodeUrl: null // Se generará después si es necesario
        }
      });

      createdTables.push(mesa);
    }

    res.json({
      success: true,
      message: `${count} mesas creadas exitosamente`,
      data: {
        restaurante: restaurante.nombre,
        mesasCreadas: createdTables.length,
        rangoNumeros: `${baseNumber} - ${baseNumber + count - 1}`,
        mesas: createdTables
      }
    });

  } catch (error) {
    console.error('Error creating bulk tables:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/ai-menu-generator/restaurants:
 *   get:
 *     summary: Obtener lista de restaurantes para selección
 *     description: |
 *       Devuelve una lista de todos los restaurantes disponibles con contadores de 
 *       categorías, productos y mesas para facilitar la selección en el generador de menús IA
 *     tags: [AI Menu Generator]
 *     security:
 *       - superAdminAuth: []
 *     responses:
 *       200:
 *         description: Lista de restaurantes obtenida exitosamente
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
 *                     restaurantes:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Restaurant'
 *                           - type: object
 *                             properties:
 *                               _count:
 *                                 type: object
 *                                 properties:
 *                                   categorias:
 *                                     type: integer
 *                                     description: 'Número de categorías del restaurante'
 *                                   productos:
 *                                     type: integer
 *                                     description: 'Número de productos del restaurante'
 *                                   mesas:
 *                                     type: integer
 *                                     description: 'Número de mesas del restaurante'
 *             example:
 *               success: true
 *               data:
 *                 restaurantes:
 *                   - id: "1"
 *                     nombre: "Bella Vista"
 *                     slug: "bella-vista"
 *                     email: "admin@bellavista.com"
 *                     activo: true
 *                     _count:
 *                       categorias: 5
 *                       productos: 25
 *                       mesas: 12
 *       401:
 *         description: No autorizado - Token de super admin requerido
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
// Endpoint para obtener prompts actuales
router.get('/prompts', authenticateSuperAdmin, async (req, res) => {
  try {
    const { AI_PROMPTS } = require('../config/aiPrompts');
    
    res.json({
      success: true,
      data: {
        mainPrompt: AI_PROMPTS.MENU_EXTRACTION.text,
        descriptionPrompt: AI_PROMPTS.DESCRIPTION_ENHANCEMENT.userMessage,
        specializedPrompts: AI_PROMPTS.SPECIALIZED_PROMPTS,
        specialCases: AI_PROMPTS.SPECIAL_CASES
      }
    });
  } catch (error) {
    console.error('Error getting prompts:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo prompts'
    });
  }
});

// Endpoint para generar menú con prompt personalizado
router.post('/generate-with-custom-prompt', authenticateSuperAdmin, aiUpload.array('menuImages', 3), async (req, res) => {
  try {
    // Validar datos
    const { error, value } = aiMenuSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { restauranteId, replaceExistingMenu, generateDescriptions } = value;
    const customPrompt = req.body.customPrompt;

    // Validar que se subieron archivos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos una imagen del menú'
      });
    }

    // Validar prompt personalizado
    if (!customPrompt || customPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un prompt personalizado'
      });
    }

    // Validar archivos (mismo código que en el endpoint principal)
    if (req.files.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Máximo 3 archivos permitidos'
      });
    }

    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;
    
    for (const file of req.files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `Archivo ${file.originalname}: Tipo no válido. Solo se permiten PNG, JPG, JPEG y PDF`
        });
      }
      
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `Archivo ${file.originalname}: Demasiado grande. Máximo 5MB por archivo`
        });
      }
    }

    // Verificar que el restaurante existe
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: restauranteId }
    });

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        error: 'Restaurante no encontrado'
      });
    }

    // Usar función personalizada con prompt custom
    const imageBuffers = req.files.map(file => file.buffer);
    const mimeTypes = req.files.map(file => file.mimetype);
    const menuData = await extractMenuWithCustomPrompt(imageBuffers, mimeTypes, customPrompt);
    
    // Generar descripciones mejoradas si se solicita
    const finalMenuData = generateDescriptions 
      ? await generateMissingDescriptions(menuData)
      : menuData;

    // Procesar datos igual que en el endpoint principal
    if (replaceExistingMenu) {
      await prisma.producto.deleteMany({
        where: { restauranteId }
      });
      await prisma.categoria.deleteMany({
        where: { restauranteId }
      });
    }

    const createdCategories = [];
    const createdProducts = [];

    for (const categoriaData of finalMenuData.categorias) {
      let categoria = await prisma.categoria.upsert({
        where: {
          restauranteId_nombre: {
            restauranteId,
            nombre: categoriaData.nombre
          }
        },
        update: {
          descripcion: categoriaData.descripcion,
          orden: categoriaData.orden
        },
        create: {
          nombre: categoriaData.nombre,
          descripcion: categoriaData.descripcion,
          orden: categoriaData.orden,
          restauranteId
        }
      });

      createdCategories.push(categoria);

      for (const productoData of categoriaData.productos) {
        const producto = await prisma.producto.upsert({
          where: {
            restauranteId_nombre: {
              restauranteId,
              nombre: productoData.nombre
            }
          },
          update: {
            descripcion: productoData.descripcion,
            precio: productoData.precio,
            disponible: productoData.disponible,
            orden: productoData.orden,
            categoriaId: categoria.id
          },
          create: {
            nombre: productoData.nombre,
            descripcion: productoData.descripcion,
            precio: productoData.precio,
            disponible: productoData.disponible,
            orden: productoData.orden,
            categoriaId: categoria.id,
            restauranteId
          }
        });

        createdProducts.push(producto);
      }
    }

    res.json({
      success: true,
      message: 'Menú generado exitosamente con prompt personalizado',
      data: {
        restaurante: restaurante.nombre,
        categoriasCreadas: createdCategories.length,
        productosCreados: createdProducts.length,
        menuData: finalMenuData,
        promptUsed: customPrompt
      }
    });

  } catch (error) {
    console.error('Error generating menu with custom prompt:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

router.get('/restaurants', authenticateSuperAdmin, async (req, res) => {
  try {
    const restaurantes = await prisma.restaurante.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        email: true,
        activo: true,
        _count: {
          select: {
            categorias: true,
            productos: true,
            mesas: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json({
      success: true,
      data: { restaurantes }
    });

  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
