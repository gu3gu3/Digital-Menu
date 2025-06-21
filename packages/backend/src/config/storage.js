const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Helper function to sanitize restaurant name for folder structure
const sanitizeRestaurantName = (restaurantName) => {
  return restaurantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .trim('-'); // Remove leading/trailing hyphens
};

// Local storage configuration for development
const localStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(__dirname, '../../uploads');
      
      // Determine folder based on file type
      let folder;
      if (file.fieldname === 'logo' || file.fieldname === 'banner' || file.fieldname === 'backgroundImage') {
        folder = 'restaurants';
      } else if (file.fieldname === 'imagen' || file.fieldname === 'product-image') {
        folder = 'products';
      } else {
        folder = 'general';
      }
      
      const finalDir = path.join(uploadDir, folder);
      
      // Create directory if it doesn't exist
      await fs.mkdir(finalDir, { recursive: true });
      
      cb(null, finalDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const fileType = (file.fieldname === 'logo' || file.fieldname === 'banner' || file.fieldname === 'backgroundImage') ? 'restaurant' : 'product';
    cb(null, `${fileType}-${uniqueSuffix}${extension}`);
  }
});

// Google Cloud Storage configuration for production
class CloudStorage {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.bucket = null;
    
    if (this.isProduction) {
      try {
        // En un entorno de Google Cloud (como Cloud Run), el constructor de Storage
        // detecta automáticamente el proyecto y las credenciales.
        // No es necesario pasar `projectId` o `keyFilename`.
        this.storage = new Storage();
        
        this.bucket = this.storage.bucket(process.env.GCP_STORAGE_BUCKET);
        console.log('✅ Google Cloud Storage configurado correctamente');
      } catch (error) {
        console.error('❌ Error configurando Google Cloud Storage:', error.message);
        throw error;
      }
    }
  }

  // Upload file to Google Cloud Storage with restaurant-specific folders
  async uploadToCloud(file, restaurantName, fileType) {
    if (!this.isProduction || !this.bucket) {
      throw new Error('Cloud Storage no está configurado para este entorno');
    }

    try {
      const sanitizedName = sanitizeRestaurantName(restaurantName);
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const filename = `${fileType}-${timestamp}${extension}`;
      
      // Create folder structure: restaurants/restaurant-name/ or products/restaurant-name/
      const cloudPath = `${fileType}s/${sanitizedName}/${filename}`;
      
      const cloudFile = this.bucket.file(cloudPath);
      
      // Upload file
      const stream = cloudFile.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            restaurantName: restaurantName
          }
        },
        resumable: false
      });

      return new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', () => {
          // El archivo ya es público debido a la configuración de "uniform bucket-level access".
          // No es necesario llamar a .makePublic()
          const publicUrl = `https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET}/${cloudPath}`;
          resolve({
            url: publicUrl,
            path: cloudPath,
            filename: filename
          });
        });
        stream.end(file.buffer);
      });
    } catch (error) {
      console.error('Error uploading to Cloud Storage:', error);
      throw error;
    }
  }

  // Delete file from Google Cloud Storage
  async deleteFromCloud(filePath) {
    if (!this.isProduction || !this.bucket) {
      return;
    }

    try {
      const file = this.bucket.file(filePath);
      await file.delete();
      console.log(`✅ Archivo eliminado de Cloud Storage: ${filePath}`);
    } catch (error) {
      console.error('Error eliminando archivo de Cloud Storage:', error);
      // Don't throw error for deletion failures
    }
  }

  // List files for a specific restaurant
  async listRestaurantFiles(restaurantName, fileType = null) {
    if (!this.isProduction || !this.bucket) {
      throw new Error('Cloud Storage no está configurado para este entorno');
    }

    try {
      const sanitizedName = sanitizeRestaurantName(restaurantName);
      const prefix = fileType ? `${fileType}s/${sanitizedName}/` : `${sanitizedName}/`;
      
      const [files] = await this.bucket.getFiles({ prefix });
      
      return files.map(file => ({
        name: file.name,
        publicUrl: `https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET}/${file.name}`,
        metadata: file.metadata
      }));
    } catch (error) {
      console.error('Error listando archivos de Cloud Storage:', error);
      throw error;
    }
  }
}

// Multer configuration
const upload = multer({
  storage: process.env.NODE_ENV === 'production' ? multer.memoryStorage() : localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, WebP)'), false);
    }
  }
});

// Initialize cloud storage instance
const cloudStorage = new CloudStorage();

// Helper function to get public URL for uploaded files
const getPublicUrl = (filePath) => {
  if (process.env.NODE_ENV === 'production') {
    return `https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET}/${filePath}`;
  } else {
    // Local development URL
    return `/uploads/${filePath.replace(/^.*[\\/]/, '')}`;
  }
};

// Wrapper function for handling file uploads
const handleFileUpload = async (file, restaurantName, fileType) => {
  if (process.env.NODE_ENV === 'production') {
    // Upload to Google Cloud Storage
    return cloudStorage.uploadToCloud(file, restaurantName, fileType);
  } else {
    // Local development - file is already saved by multer
    const localPath = `/uploads/${file.fieldname === 'logo' || file.fieldname === 'banner' || file.fieldname === 'backgroundImage' ? 'restaurants' : 'products'}/${file.filename}`;
    const fullUrl = `${process.env.BACKEND_URL}${localPath}`;

    return {
      url: fullUrl,
      path: localPath,
      filename: file.filename
    };
  }
};

module.exports = {
  upload,
  cloudStorage,
  handleFileUpload,
  getPublicUrl,
  sanitizeRestaurantName
}; 