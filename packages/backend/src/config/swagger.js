const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digital Menu QR API',
      version: '1.0.2',
      description: 'API para el sistema de menús digitales QR - Documentación completa post-refactorización 2025 con correcciones de endpoints de suscripciones y mejoras de UX',
      contact: {
        name: 'Digital Menu QR',
        email: 'support@menuview.app'
      },
      changelog: {
        'v1.0.2': [
          'Implementación de drag & drop para reordenamiento de categorías',
          'Nuevo endpoint PUT /api/categories/reorder para actualización de orden',
          'Mejora de UX en menú público: pestañas horizontales en lugar de sidebar vertical',
          'Optimización para dispositivos móviles con scroll horizontal suave',
          'Componente DraggableCategoryList con @dnd-kit para administración',
          'Servicio categoryService.js para operaciones de categorías'
        ],
        'v1.0.1': [
          'Corrección de include statements en endpoints de suscripciones',
          'Mejora en búsqueda de planes por precio en lugar de nombre hardcodeado',
          'Resolución de problemas de tokens tras cambios en suscripciones',
          'Validación mejorada de relaciones Prisma en Super Admin endpoints'
        ]
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
          description: 'Token JWT para autenticación de administradores de restaurantes'
        },
        staffAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticación de personal/meseros'
        },
        superAdminAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticación de super administrador'
        }
      },
      schemas: {
        // === SCHEMAS DE RESPUESTA GENERALES ===
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo del error'
            },
            code: {
              type: 'string',
              description: 'Código de error específico'
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
        },

        // === SCHEMAS DE AUTENTICACIÓN ===
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Contraseña del usuario'
            },
            role: {
              type: 'string',
              enum: ['ADMINISTRADOR', 'MESERO'],
              description: 'Rol del usuario (solo para staff)'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'Token JWT de autenticación'
            },
            user: {
              type: 'object',
              description: 'Datos del usuario autenticado'
            },
            restaurant: {
              type: 'object',
              description: 'Datos del restaurante (si aplica)'
            }
          }
        },

        // === SCHEMAS DE USUARIO ===
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario'
            },
            name: {
              type: 'string',
              description: 'Nombre del usuario'
            },
            role: {
              type: 'string',
              enum: ['SUPER_ADMIN', 'ADMINISTRADOR', 'MESERO'],
              description: 'Rol del usuario en el sistema'
            },
            isActive: {
              type: 'boolean',
              description: 'Estado activo del usuario'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },

        // === SCHEMAS DE RESTAURANTE ===
        Restaurant: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del restaurante'
            },
            name: {
              type: 'string',
              description: 'Nombre del restaurante'
            },
            description: {
              type: 'string',
              description: 'Descripción del restaurante'
            },
            address: {
              type: 'string',
              description: 'Dirección del restaurante'
            },
            phone: {
              type: 'string',
              description: 'Teléfono de contacto'
            },
            logo: {
              type: 'string',
              description: 'URL del logo del restaurante'
            },
            primaryColor: {
              type: 'string',
              description: 'Color primario del tema'
            },
            secondaryColor: {
              type: 'string',
              description: 'Color secundario del tema'
            },
            isActive: {
              type: 'boolean',
              description: 'Estado activo del restaurante'
            },
            subscriptionId: {
              type: 'integer',
              description: 'ID de la suscripción activa'
            },
            subscription: {
              $ref: '#/components/schemas/Subscription'
            }
          }
        },

        // === SCHEMAS DE MENÚ ===
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la categoría'
            },
            name: {
              type: 'string',
              description: 'Nombre de la categoría'
            },
            description: {
              type: 'string',
              description: 'Descripción de la categoría'
            },
            isActive: {
              type: 'boolean',
              description: 'Estado activo de la categoría'
            },
            displayOrder: {
              type: 'integer',
              description: 'Orden de visualización'
            },
            restaurantId: {
              type: 'integer',
              description: 'ID del restaurante propietario'
            },
            products: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Product'
              }
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del producto'
            },
            name: {
              type: 'string',
              description: 'Nombre del producto'
            },
            description: {
              type: 'string',
              description: 'Descripción del producto'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Precio del producto'
            },
            image: {
              type: 'string',
              description: 'URL de la imagen del producto'
            },
            isActive: {
              type: 'boolean',
              description: 'Estado activo del producto'
            },
            isAvailable: {
              type: 'boolean',
              description: 'Disponibilidad del producto'
            },
            categoryId: {
              type: 'integer',
              description: 'ID de la categoría'
            },
            restaurantId: {
              type: 'integer',
              description: 'ID del restaurante'
            }
          }
        },

        // === SCHEMAS DE MESAS ===
        Table: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la mesa'
            },
            numero: {
              type: 'integer',
              minimum: 1,
              maximum: 999,
              description: 'Número de la mesa'
            },
            nombre: {
              type: 'string',
              maxLength: 50,
              description: 'Nombre personalizado de la mesa (opcional)',
              example: 'Mesa VIP'
            },
            capacidad: {
              type: 'integer',
              minimum: 1,
              maximum: 20,
              default: 4,
              description: 'Capacidad máxima de personas'
            },
            qrCodeUrl: {
              type: 'string',
              description: 'URL del código QR único de la mesa'
            },
            activa: {
              type: 'boolean',
              default: true,
              description: 'Estado activo de la mesa'
            },
            restauranteId: {
              type: 'integer',
              description: 'ID del restaurante al que pertenece'
            },
            estaActiva: {
              type: 'boolean',
              description: 'Indica si hay una sesión activa en la mesa'
            },
            ordenesActivas: {
              type: 'integer',
              description: 'Número de órdenes activas en la mesa'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación de la mesa'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          },
          required: ['numero', 'capacidad', 'restauranteId']
        },
        CreateTableRequest: {
          type: 'object',
          required: ['numero'],
          properties: {
            numero: {
              type: 'integer',
              minimum: 1,
              maximum: 999,
              description: 'Número de la mesa',
              example: 5
            },
            nombre: {
              type: 'string',
              maxLength: 50,
              description: 'Nombre personalizado de la mesa (opcional)',
              example: 'Mesa Terraza'
            },
            capacidad: {
              type: 'integer',
              minimum: 1,
              maximum: 20,
              default: 4,
              description: 'Capacidad máxima de personas',
              example: 6
            }
          }
        },
        UpdateTableRequest: {
          type: 'object',
          properties: {
            numero: {
              type: 'integer',
              minimum: 1,
              maximum: 999,
              description: 'Número de la mesa',
              example: 5
            },
            nombre: {
              type: 'string',
              maxLength: 50,
              description: 'Nombre personalizado de la mesa',
              example: 'Mesa VIP Renovada'
            },
            capacidad: {
              type: 'integer',
              minimum: 1,
              maximum: 20,
              description: 'Capacidad máxima de personas',
              example: 8
            },
            activa: {
              type: 'boolean',
              description: 'Estado activo de la mesa',
              example: true
            }
          }
        },
        TableWithQR: {
          allOf: [
            { $ref: '#/components/schemas/Table' },
            {
              type: 'object',
              properties: {
                qrUrl: {
                  type: 'string',
                  description: 'URL del menú para esta mesa específica'
                },
                qrCodeImage: {
                  type: 'string',
                  description: 'Imagen del código QR en formato data URL'
            }
          }
            }
          ]
        },

        // === SCHEMAS DE PEDIDOS ===
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del pedido'
            },
            customerName: {
              type: 'string',
              description: 'Nombre del cliente'
            },
            total: {
              type: 'number',
              format: 'decimal',
              description: 'Total del pedido'
            },
            status: {
              type: 'string',
              enum: ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'],
              description: 'Estado del pedido'
            },
            tableId: {
              type: 'integer',
              description: 'ID de la mesa'
            },
            restaurantId: {
              type: 'integer',
              description: 'ID del restaurante'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del pedido'
            }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del item'
            },
            quantity: {
              type: 'integer',
              description: 'Cantidad del producto'
            },
            unitPrice: {
              type: 'number',
              format: 'decimal',
              description: 'Precio unitario'
            },
            subtotal: {
              type: 'number',
              format: 'decimal',
              description: 'Subtotal del item'
            },
            productId: {
              type: 'integer',
              description: 'ID del producto'
            },
            product: {
              $ref: '#/components/schemas/Product'
            }
          }
        },

        // === SCHEMAS DE SUSCRIPCIONES ===
        Subscription: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la suscripción'
            },
            status: {
              type: 'string',
              enum: ['ACTIVA', 'VENCIDA', 'CANCELADA'],
              description: 'Estado de la suscripción'
            },
            startDate: {
              type: 'string',
              format: 'date',
              description: 'Fecha de inicio'
            },
            endDate: {
              type: 'string',
              format: 'date',
              description: 'Fecha de vencimiento'
            },
            planId: {
              type: 'integer',
              description: 'ID del plan contratado'
            },
            plan: {
              $ref: '#/components/schemas/Plan'
            }
          }
        },
        Plan: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del plan'
            },
            name: {
              type: 'string',
              description: 'Nombre del plan'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Precio mensual del plan'
            },
            maxProducts: {
              type: 'integer',
              description: 'Límite máximo de productos'
            },
            maxCategories: {
              type: 'integer',
              description: 'Límite máximo de categorías'
            },
            maxTables: {
              type: 'integer',
              description: 'Límite máximo de mesas'
            },
            features: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Lista de características incluidas'
            }
          }
        },

        // === SCHEMAS DE PERSONAL ===
        Staff: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del personal'
            },
            name: {
              type: 'string',
              description: 'Nombre del empleado'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del empleado'
            },
            role: {
              type: 'string',
              enum: ['MESERO', 'ADMINISTRADOR'],
              description: 'Rol del empleado'
            },
            isActive: {
              type: 'boolean',
              description: 'Estado activo del empleado'
            },
            restaurantId: {
              type: 'integer',
              description: 'ID del restaurante'
            }
          }
        },

        // === SCHEMAS DE SESIONES ===
        Session: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la sesión'
            },
            customerName: {
              type: 'string',
              description: 'Nombre del cliente'
            },
            tableId: {
              type: 'integer',
              description: 'ID de la mesa'
            },
            isActive: {
              type: 'boolean',
              description: 'Estado activo de la sesión'
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              description: 'Hora de inicio de la sesión'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              description: 'Hora de fin de la sesión'
            }
          }
        },

        // === SCHEMAS DE AI MENU GENERATOR ===
        AIMenuGenerateRequest: {
          type: 'object',
          required: ['restauranteId'],
          properties: {
            restauranteId: {
              type: 'string',
              description: 'ID del restaurante donde crear el menú'
            },
            replaceExistingMenu: {
              type: 'boolean',
              default: false,
              description: 'Si reemplazar el menú existente'
            },
            generateDescriptions: {
              type: 'boolean',
              default: true,
              description: 'Si generar descripciones mejoradas con IA'
            }
          }
        },
        AIMenuGenerateResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la operación fue exitosa'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo del resultado'
            },
            data: {
              type: 'object',
              properties: {
                restaurante: {
                  type: 'string',
                  description: 'Nombre del restaurante'
                },
                categoriasCreadas: {
                  type: 'integer',
                  description: 'Número de categorías creadas'
                },
                productosCreados: {
                  type: 'integer',
                  description: 'Número de productos creados'
                }
              }
            }
          }
        },
        BulkTablesRequest: {
          type: 'object',
          required: ['restauranteId', 'baseName', 'count'],
          properties: {
            restauranteId: {
              type: 'string',
              description: 'ID del restaurante donde crear las mesas'
            },
            baseName: {
              type: 'string',
              description: 'Nombre base para las mesas (ej: Mesa, Habitación, Salón)'
            },
            count: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              description: 'Cantidad de mesas a crear'
            },
            startNumber: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Número inicial para la numeración consecutiva'
            },
            capacity: {
              type: 'integer',
              minimum: 1,
              default: 4,
              description: 'Capacidad de personas por mesa'
            }
          }
        },
        BulkTablesResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la operación fue exitosa'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo del resultado'
            },
            data: {
              type: 'object',
              properties: {
                restaurante: {
                  type: 'string',
                  description: 'Nombre del restaurante'
                },
                mesasCreadas: {
                  type: 'integer',
                  description: 'Número de mesas creadas'
                },
                rangoNumeros: {
                  type: 'string',
                  description: 'Rango de números de las mesas creadas'
                }
              }
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
        name: 'Staff Auth',
        description: 'Autenticación de personal y meseros'
      },
      {
        name: 'Super Admin Auth',
        description: 'Autenticación de super administrador'
      },
      {
        name: 'Restaurants',
        description: 'Gestión de restaurantes'
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
        name: 'Menu',
        description: 'Gestión completa del menú'
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
        description: 'Gestión del personal (meseros y administradores)'
      },
      {
        name: 'Sessions',
        description: 'Gestión de sesiones de mesa'
      },
      {
        name: 'Notifications',
        description: 'Sistema de notificaciones'
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
      },
      {
        name: 'Import/Export',
        description: 'Importación y exportación de menús'
      },
      {
        name: 'AI Menu Generator',
        description: 'Generación automática de menús usando IA y creación masiva de mesas'
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
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 4px; }
    `,
    customSiteTitle: 'Digital Menu QR API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      docExpansion: 'list',
      defaultModelExpandDepth: 2,
      defaultModelsExpandDepth: 1,
      displayOperationId: false,
      showExtensions: true,
      showCommonExtensions: true
    }
  }));

  // Endpoint para obtener el JSON de la especificación
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentación disponible en: /api/docs');
  console.log('📄 Especificación JSON disponible en: /api/docs.json');
};

module.exports = { swaggerSetup, specs }; 