const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { processMenuCSV, generateCSVTemplate } = require('../utils/csvMenuProcessor');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configure multer for CSV upload
const csvStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../temp-uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `menu-import-${uniqueSuffix}.csv`);
  }
});

const csvUpload = multer({
  storage: csvStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/csv' ||
        path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'), false);
    }
  }
});

// Get CSV template for download
router.get('/template', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  (req, res) => {
    try {
      const template = generateCSVTemplate();
      
      // Headers optimizados para descarga de CSV
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="menu-template.csv"');
      res.setHeader('Content-Length', Buffer.byteLength(template, 'utf8'));
      res.setHeader('Cache-Control', 'no-cache');
      
      // Enviar el contenido como buffer UTF-8
      res.send(template);
      
    } catch (error) {
      console.error('Error generating CSV template:', error);
      res.status(500).json({
        success: false,
        error: 'Error generando template CSV'
      });
    }
  }
);

// Get CSV format information
router.get('/format-info', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          headers: [
            {
              field: 'categoria_nombre',
              description: 'Nombre de la categoría (requerido)',
              example: 'Entradas'
            },
            {
              field: 'categoria_descripcion',
              description: 'Descripción de la categoría (opcional)',
              example: 'Deliciosos aperitivos para comenzar'
            },
            {
              field: 'categoria_orden',
              description: 'Orden de la categoría (opcional, número)',
              example: '1'
            },
            {
              field: 'producto_nombre',
              description: 'Nombre del producto (requerido)',
              example: 'Ceviche de Pescado'
            },
            {
              field: 'producto_descripcion',
              description: 'Descripción del producto (opcional)',
              example: 'Fresco ceviche con pescado del día'
            },
            {
              field: 'producto_precio',
              description: 'Precio del producto (requerido, número)',
              example: '12.50'
            },
            {
              field: 'producto_disponible',
              description: 'Disponibilidad del producto (opcional, true/false)',
              example: 'true'
            },
            {
              field: 'producto_orden',
              description: 'Orden del producto dentro de la categoría (opcional, número)',
              example: '1'
            }
          ],
          tips: [
            'El archivo debe tener extensión .csv',
            'Usar comas como separadores',
            'Los campos con texto que contenga comas deben ir entre comillas',
            'Los valores booleanos pueden ser: true/false, 1/0, sí/no',
            'Si no se especifica orden, se usará 0 por defecto',
            'Las categorías con el mismo nombre se agrupan automáticamente'
          ],
          maxFileSize: '5MB',
          encoding: 'UTF-8'
        }
      });
      
    } catch (error) {
      console.error('Error getting format info:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo información del formato'
      });
    }
  }
);

// Validate CSV without importing
router.post('/validate', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  csvUpload.single('csvFile'),
  async (req, res) => {
    let filePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó archivo CSV'
        });
      }
      
      filePath = req.file.path;
      
      // Get restaurant ID
      const restaurante = await prisma.restaurante.findUnique({
        where: { id: req.user.restauranteId },
        select: { id: true, nombre: true }
      });
      
      if (!restaurante) {
        return res.status(404).json({
          success: false,
          error: 'Restaurante no encontrado'
        });
      }
      
      // Validate CSV only (no database changes)
      const results = await processMenuCSV(filePath, restaurante.id, {
        validateOnly: true
      });
      
      res.json({
        success: true,
        data: {
          validation: results,
          restaurant: restaurante.nombre
        },
        message: 'Validación completada'
      });
      
    } catch (error) {
      console.error('Error validating CSV:', error);
      res.status(500).json({
        success: false,
        error: 'Error validando archivo CSV: ' + error.message
      });
    } finally {
      // Clean up temporary file
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
    }
  }
);

// Import menu from CSV
router.post('/import', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  csvUpload.single('csvFile'),
  async (req, res) => {
    let filePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó archivo CSV'
        });
      }
      
      filePath = req.file.path;
      
      // Parse options from request body
      const {
        replaceExisting = false,
        skipDuplicates = true,
        validateFirst = true
      } = req.body;
      
      // Get restaurant ID
      const restaurante = await prisma.restaurante.findUnique({
        where: { id: req.user.restauranteId },
        select: { id: true, nombre: true }
      });
      
      if (!restaurante) {
        return res.status(404).json({
          success: false,
          error: 'Restaurante no encontrado'
        });
      }
      
      // Optional validation first
      if (validateFirst) {
        const validationResults = await processMenuCSV(filePath, restaurante.id, {
          validateOnly: true
        });
        
        if (!validationResults.success || validationResults.errors.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'El archivo CSV contiene errores',
            data: {
              validation: validationResults,
              restaurant: restaurante.nombre
            }
          });
        }
      }
      
      // Process CSV and import to database
      const results = await processMenuCSV(filePath, restaurante.id, {
        replaceExisting: replaceExisting === 'true' || replaceExisting === true,
        skipDuplicates: skipDuplicates === 'true' || skipDuplicates === true,
        validateOnly: false
      });
      
      if (results.success) {
        res.json({
          success: true,
          data: {
            import: results,
            restaurant: restaurante.nombre
          },
          message: `Menú importado exitosamente. ${results.summary.categoriasCreadas} categorías y ${results.summary.productosCreados} productos creados.`
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Error importando menú',
          data: {
            import: results,
            restaurant: restaurante.nombre
          }
        });
      }
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor: ' + error.message
      });
    } finally {
      // Clean up temporary file
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
    }
  }
);

// Export current menu to CSV
router.get('/export', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  async (req, res) => {
    try {
      // Get restaurant and menu data
      const restaurante = await prisma.restaurante.findUnique({
        where: { id: req.user.restauranteId },
        include: {
          categorias: {
            include: {
              productos: {
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
          error: 'Restaurante no encontrado'
        });
      }
      
      // Verificar si hay categorías
      if (!restaurante.categorias || restaurante.categorias.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No hay categorías en el menú para exportar. Agrega categorías y productos primero.'
        });
      }
      
      // Contar total de productos
      const totalProductos = restaurante.categorias.reduce((total, cat) => total + cat.productos.length, 0);
      
      if (totalProductos === 0) {
        return res.status(400).json({
          success: false,
          error: 'No hay productos en el menú para exportar. Agrega productos a tus categorías primero.'
        });
      }
      
      // Generate CSV content
      const csvHeader = 'categoria_nombre,categoria_descripcion,categoria_orden,producto_nombre,producto_descripcion,producto_precio,producto_disponible,producto_orden\n';
      
      let csvContent = csvHeader;
      
      restaurante.categorias.forEach(categoria => {
        categoria.productos.forEach(producto => {
          const row = [
            `"${categoria.nombre}"`,
            `"${categoria.descripcion || ''}"`,
            categoria.orden,
            `"${producto.nombre}"`,
            `"${producto.descripcion || ''}"`,
            producto.precio,
            producto.disponible,
            producto.orden
          ].join(',');
          
          csvContent += row + '\n';
        });
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="menu-${restaurante.slug}-${Date.now()}.csv"`);
      
      res.send(csvContent);
      
    } catch (error) {
      console.error('Error exporting menu:', error);
      res.status(500).json({
        success: false,
        error: 'Error exportando menú'
      });
    }
  }
);

// Get import history/logs (future enhancement)
router.get('/history', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  async (req, res) => {
    try {
      // This could be enhanced to track import history
      res.json({
        success: true,
        data: {
          message: 'Funcionalidad de historial próximamente',
          suggestion: 'Por ahora, revisa los logs del servidor para el historial de importaciones'
        }
      });
      
    } catch (error) {
      console.error('Error getting import history:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo historial'
      });
    }
  }
);

module.exports = router; 