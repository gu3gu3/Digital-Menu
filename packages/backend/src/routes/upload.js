const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { upload, handleFileUpload, cloudStorage } = require('../config/storage');

const prisma = new PrismaClient();

// Upload restaurant logo
router.post('/restaurant/logo', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  upload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ningún archivo'
        });
      }

      // Get restaurant information
      const restaurant = await prisma.restaurante.findUnique({
        where: { usuarioAdminId: req.user.id },
        select: { id: true, nombre: true, logoUrl: true }
      });

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          error: 'Restaurante no encontrado'
        });
      }

      // Handle file upload (local or cloud)
      const uploadResult = await handleFileUpload(req.file, restaurant.nombre, 'restaurant');

      // Delete old logo from cloud storage if exists
      if (restaurant.logoUrl && process.env.NODE_ENV === 'production') {
        const oldPath = restaurant.logoUrl.replace(`https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET}/`, '');
        await cloudStorage.deleteFromCloud(oldPath);
      }

      // Update restaurant with new logo URL
      const updatedRestaurant = await prisma.restaurante.update({
        where: { id: restaurant.id },
        data: { logoUrl: uploadResult.url }
      });

      res.json({
        success: true,
        data: {
          logoUrl: uploadResult.url,
          filename: uploadResult.filename,
          path: uploadResult.path
        },
        message: 'Logo subido exitosamente'
      });

    } catch (error) {
      console.error('Error uploading restaurant logo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al subir el logo'
      });
    }
  }
);

// Upload restaurant banner
router.post('/restaurant/banner', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  upload.single('banner'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ningún archivo'
        });
      }

      // Get restaurant information
      const restaurant = await prisma.restaurante.findUnique({
        where: { usuarioAdminId: req.user.id },
        select: { id: true, nombre: true, bannerUrl: true }
      });

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          error: 'Restaurante no encontrado'
        });
      }

      // Handle file upload (local or cloud)
      const uploadResult = await handleFileUpload(req.file, restaurant.nombre, 'restaurant');

      // Delete old banner from cloud storage if exists
      if (restaurant.bannerUrl && process.env.NODE_ENV === 'production') {
        const oldPath = restaurant.bannerUrl.replace(`https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET}/`, '');
        await cloudStorage.deleteFromCloud(oldPath);
      }

      // Update restaurant with new banner URL
      const updatedRestaurant = await prisma.restaurante.update({
        where: { id: restaurant.id },
        data: { bannerUrl: uploadResult.url }
      });

      res.json({
        success: true,
        data: {
          bannerUrl: uploadResult.url,
          filename: uploadResult.filename,
          path: uploadResult.path
        },
        message: 'Banner subido exitosamente'
      });

    } catch (error) {
      console.error('Error uploading restaurant banner:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al subir el banner'
      });
    }
  }
);

// Upload product image
router.post('/product/:productId/image', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  upload.single('imagen'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ningún archivo'
        });
      }

      const productId = parseInt(req.params.productId);

      // Get product and restaurant information
      const product = await prisma.producto.findFirst({
        where: { 
          id: productId,
          restaurante: {
            usuarioAdminId: req.user.id
          }
        },
        include: {
          restaurante: {
            select: { nombre: true }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado'
        });
      }

      // Handle file upload (local or cloud)
      const uploadResult = await handleFileUpload(req.file, product.restaurante.nombre, 'product');

      // Delete old image from cloud storage if exists
      if (product.imagenUrl && process.env.NODE_ENV === 'production') {
        const oldPath = product.imagenUrl.replace(`https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET}/`, '');
        await cloudStorage.deleteFromCloud(oldPath);
      }

      // Update product with new image URL
      const updatedProduct = await prisma.producto.update({
        where: { id: productId },
        data: { imagenUrl: uploadResult.url }
      });

      res.json({
        success: true,
        data: {
          product: updatedProduct,
          imagenUrl: uploadResult.url,
          filename: uploadResult.filename,
          path: uploadResult.path
        },
        message: 'Imagen del producto subida exitosamente'
      });

    } catch (error) {
      console.error('Error uploading product image:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al subir la imagen del producto'
      });
    }
  }
);

// Bulk upload multiple product images
router.post('/products/images', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  upload.array('imagenes', 10), // Max 10 images
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionaron archivos'
        });
      }

      // Get restaurant information
      const restaurant = await prisma.restaurante.findUnique({
        where: { usuarioAdminId: req.user.id },
        select: { nombre: true }
      });

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          error: 'Restaurante no encontrado'
        });
      }

      const uploadResults = [];
      const errors = [];

      // Process each file
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const uploadResult = await handleFileUpload(file, restaurant.nombre, 'product');
          uploadResults.push({
            originalName: file.originalname,
            url: uploadResult.url,
            filename: uploadResult.filename,
            path: uploadResult.path
          });
        } catch (error) {
          errors.push({
            originalName: file.originalname,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          uploadedFiles: uploadResults,
          errors: errors,
          totalUploaded: uploadResults.length,
          totalErrors: errors.length
        },
        message: `${uploadResults.length} imágenes subidas exitosamente${errors.length > 0 ? `, ${errors.length} fallaron` : ''}`
      });

    } catch (error) {
      console.error('Error in bulk upload:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al subir las imágenes'
      });
    }
  }
);

// List restaurant images (useful for management)
router.get('/restaurant/images', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  async (req, res) => {
    try {
      // Get restaurant information
      const restaurant = await prisma.restaurante.findUnique({
        where: { usuarioAdminId: req.user.id },
        select: { nombre: true, logoUrl: true, bannerUrl: true }
      });

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          error: 'Restaurante no encontrado'
        });
      }

      let cloudFiles = [];
      
      // If in production, get files from cloud storage
      if (process.env.NODE_ENV === 'production') {
        try {
          cloudFiles = await cloudStorage.listRestaurantFiles(restaurant.nombre);
        } catch (error) {
          console.error('Error listing cloud files:', error);
        }
      }

      res.json({
        success: true,
        data: {
          restaurant: {
            logoUrl: restaurant.logoUrl,
            bannerUrl: restaurant.bannerUrl
          },
          cloudFiles: cloudFiles,
          environment: process.env.NODE_ENV
        }
      });

    } catch (error) {
      console.error('Error listing restaurant images:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al listar las imágenes'
      });
    }
  }
);

// Delete image (restaurant or product)
router.delete('/image', 
  authenticateToken, 
  requireRole(['ADMINISTRADOR']),
  async (req, res) => {
    try {
      const { type, id, imageUrl } = req.body;

      if (!type || !id || !imageUrl) {
        return res.status(400).json({
          success: false,
          error: 'Faltan parámetros requeridos: type, id, imageUrl'
        });
      }

      // Verify ownership and delete from database
      if (type === 'restaurant') {
        const restaurant = await prisma.restaurante.findFirst({
          where: { 
            id: parseInt(id),
            usuarioAdminId: req.user.id
          }
        });

        if (!restaurant) {
          return res.status(404).json({
            success: false,
            error: 'Restaurante no encontrado'
          });
        }

        // Update database to remove image URL
        await prisma.restaurante.update({
          where: { id: parseInt(id) },
          data: { 
            logoUrl: imageUrl === restaurant.logoUrl ? null : restaurant.logoUrl,
            bannerUrl: imageUrl === restaurant.bannerUrl ? null : restaurant.bannerUrl
          }
        });

      } else if (type === 'product') {
        const product = await prisma.producto.findFirst({
          where: { 
            id: parseInt(id),
            restaurante: {
              usuarioAdminId: req.user.id
            }
          }
        });

        if (!product) {
          return res.status(404).json({
            success: false,
            error: 'Producto no encontrado'
          });
        }

        // Update database to remove image URL
        await prisma.producto.update({
          where: { id: parseInt(id) },
          data: { imagenUrl: null }
        });
      }

      // Delete from cloud storage if in production
      if (process.env.NODE_ENV === 'production' && imageUrl.includes('storage.googleapis.com')) {
        const cloudPath = imageUrl.replace(`https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET}/`, '');
        await cloudStorage.deleteFromCloud(cloudPath);
      }

      res.json({
        success: true,
        message: 'Imagen eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al eliminar la imagen'
      });
    }
  }
);

module.exports = router; 