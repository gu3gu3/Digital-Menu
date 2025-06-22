const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digital Menu QR API',
      version: '1.0.0',
      description: 'API para el sistema de menús digitales QR - Documentación completa de endpoints',
      contact: {
        name: 'Digital Menu QR',
        email: 'support@menuview.app'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? process.env.BACKEND_URL || 'https://your-backend.run.app'
          : `http://localhost:${process.env.PORT || 3001}`,
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Producción' : 'Servidor de Desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticación de usuarios admin'
        },
        superAdminAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticación de super administrador'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de error'
            },
            code: {
              type: 'string',
              description: 'Código de error'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de éxito'
            },
            data: {
              type: 'object',
              description: 'Datos de respuesta'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Autenticación de administradores de restaurantes'
      },
      {
        name: 'Restaurants',
        description: 'Gestión de restaurantes'
      },
      {
        name: 'Menu',
        description: 'Gestión del menú (categorías y productos)'
      },
      {
        name: 'Categories',
        description: 'Gestión de categorías del menú'
      },
      {
        name: 'Products',
        description: 'Gestión de productos del menú'
      },
      {
        name: 'Tables',
        description: 'Gestión de mesas y códigos QR'
      },
      {
        name: 'Orders',
        description: 'Gestión de pedidos'
      },
      {
        name: 'Staff',
        description: 'Gestión del personal (meseros)'
      },
      {
        name: 'Super Admin',
        description: 'Funciones de super administrador'
      },
      {
        name: 'Public',
        description: 'Endpoints públicos para clientes'
      },
      {
        name: 'Upload',
        description: 'Subida de archivos e imágenes'
      }
    ]
  },
  apis: [
    './src/routes/*.js', // Buscar documentación en todos los archivos de rutas
    './src/models/*.js'   // Y en modelos si los tenemos
  ]
};

const specs = swaggerJSDoc(options);

const swaggerSetup = (app) => {
  // Middleware para servir la documentación de Swagger
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Digital Menu QR API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }));

  // Endpoint para obtener el JSON de la especificación
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentación disponible en: /api/docs');
};

module.exports = { swaggerSetup, specs }; 