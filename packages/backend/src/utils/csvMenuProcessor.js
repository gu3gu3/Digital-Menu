const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Template de CSV esperado
const CSV_TEMPLATE = {
  headers: [
    'categoria_nombre',
    'categoria_descripcion', 
    'categoria_orden',
    'producto_nombre',
    'producto_descripcion',
    'producto_precio',
    'producto_disponible',
    'producto_orden'
  ],
  example: [
    'Entradas,"Deliciosos aperitivos para comenzar tu experiencia gastronómica",1,"Ceviche de Pescado","Fresco ceviche con pescado del día marinado en limón y ají",12.50,true,1',
    'Entradas,"Deliciosos aperitivos para comenzar tu experiencia gastronómica",1,"Guacamole con Nachos","Guacamole casero con nachos crujientes y pico de gallo",8.90,true,2',
    'Entradas,"Deliciosos aperitivos para comenzar tu experiencia gastronómica",1,"Alitas BBQ","6 alitas de pollo con salsa barbacoa casera",11.50,true,3',
    '"Platos Fuertes","Nuestras especialidades principales que te harán volver",2,"Lomo Saltado","Clásico lomo saltado peruano con papas fritas y arroz",18.90,true,1',
    '"Platos Fuertes","Nuestras especialidades principales que te harán volver",2,"Pollo a la Brasa","Medio pollo con papas doradas y ensalada fresca",16.50,true,2',
    '"Platos Fuertes","Nuestras especialidades principales que te harán volver",2,"Pasta Alfredo","Fettuccine en salsa alfredo con pollo grillado",14.90,true,3',
    '"Platos Fuertes","Nuestras especialidades principales que te harán volver",2,"Pizza Margarita","Pizza tradicional con tomate, mozzarella y albahaca",13.50,false,4',
    'Bebidas,"Refrescantes bebidas para acompañar tu comida",3,"Chicha Morada","Bebida tradicional peruana con frutas",4.50,true,1',
    'Bebidas,"Refrescantes bebidas para acompañar tu comida",3,"Limonada","Limonada fresca natural",3.90,true,2',
    'Bebidas,"Refrescantes bebidas para acompañar tu comida",3,"Inca Kola","Gaseosa peruana 355ml",2.50,true,3',
    'Bebidas,"Refrescantes bebidas para acompañar tu comida",3,"Agua Mineral","Agua mineral sin gas 500ml",2.00,true,4',
    'Postres,"Dulces finales para completar tu experiencia",4,"Tres Leches","Clásico postre de tres leches con canela",6.90,true,1',
    'Postres,"Dulces finales para completar tu experiencia",4,"Suspiro Limeño","Tradicional postre peruano con manjarblanco",7.50,true,2',
    'Postres,"Dulces finales para completar tu experiencia",4,"Helado de Lúcuma","Helado artesanal de lúcuma peruana",5.50,false,3'
  ]
};

// Función para validar formato de CSV
const validateCSVHeaders = (headers) => {
  const requiredHeaders = CSV_TEMPLATE.headers;
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  const extraHeaders = headers.filter(header => !requiredHeaders.includes(header));
  
  return {
    isValid: missingHeaders.length === 0,
    missingHeaders,
    extraHeaders,
    requiredHeaders
  };
};

// Función para validar fila de datos
const validateRowData = (row, rowIndex) => {
  const errors = [];
  
  // Validar campos requeridos
  if (!row.categoria_nombre || row.categoria_nombre.trim() === '') {
    errors.push(`Fila ${rowIndex}: categoria_nombre es requerido`);
  }
  
  if (!row.producto_nombre || row.producto_nombre.trim() === '') {
    errors.push(`Fila ${rowIndex}: producto_nombre es requerido`);
  }
  
  if (!row.producto_precio || isNaN(parseFloat(row.producto_precio))) {
    errors.push(`Fila ${rowIndex}: producto_precio debe ser un número válido`);
  } else if (parseFloat(row.producto_precio) < 0) {
    errors.push(`Fila ${rowIndex}: producto_precio debe ser mayor a 0`);
  }
  
  // Validar disponible (debe ser true/false)
  if (row.producto_disponible !== undefined && 
      !['true', 'false', '1', '0', 'sí', 'si', 'no'].includes(row.producto_disponible.toLowerCase())) {
    errors.push(`Fila ${rowIndex}: producto_disponible debe ser true/false, 1/0, sí/no`);
  }
  
  // Validar órdenes (deben ser números)
  if (row.categoria_orden && isNaN(parseInt(row.categoria_orden))) {
    errors.push(`Fila ${rowIndex}: categoria_orden debe ser un número`);
  }
  
  if (row.producto_orden && isNaN(parseInt(row.producto_orden))) {
    errors.push(`Fila ${rowIndex}: producto_orden debe ser un número`);
  }
  
  return errors;
};

// Función para normalizar datos de fila
const normalizeRowData = (row) => {
  // Limpiar nombre de categoría removiendo comillas y espacios
  const categoriaNombre = row.categoria_nombre?.trim().replace(/^"/, '').replace(/"$/, '');
  
  return {
    categoria: {
      nombre: categoriaNombre,
      descripcion: row.categoria_descripcion?.trim() || null,
      orden: row.categoria_orden ? parseInt(row.categoria_orden) : 0
    },
    producto: {
      nombre: row.producto_nombre?.trim(),
      descripcion: row.producto_descripcion?.trim() || null,
      precio: parseFloat(row.producto_precio),
      disponible: ['true', '1', 'sí', 'si'].includes(row.producto_disponible?.toLowerCase()) || 
                  row.producto_disponible === undefined,
      orden: row.producto_orden ? parseInt(row.producto_orden) : 0
    }
  };
};

// Función principal para procesar CSV
const processMenuCSV = async (filePath, restauranteId, options = {}) => {
  const {
    replaceExisting = false,
    skipDuplicates = true,
    validateOnly = false
  } = options;
  
  return new Promise((resolve, reject) => {
    const results = {
      success: false,
      totalRows: 0,
      processedRows: 0,
      errors: [],
      warnings: [],
      createdCategories: [],
      createdProducts: [],
      skippedProducts: [],
      summary: {}
    };
    
    const categoriesMap = new Map(); // Para evitar duplicados en el mismo CSV
    const productsData = [];
    
    // Stream de lectura del CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headers) => {
        // Validar headers
        const headerValidation = validateCSVHeaders(headers);
        if (!headerValidation.isValid) {
          results.errors.push(`Headers inválidos. Faltan: ${headerValidation.missingHeaders.join(', ')}`);
          return reject(results);
        }
        
        if (headerValidation.extraHeaders.length > 0) {
          results.warnings.push(`Headers adicionales ignorados: ${headerValidation.extraHeaders.join(', ')}`);
        }
      })
      .on('data', (row) => {
        results.totalRows++;
        
        // Validar datos de la fila
        const rowErrors = validateRowData(row, results.totalRows);
        if (rowErrors.length > 0) {
          results.errors.push(...rowErrors);
          return;
        }
        
        // Normalizar datos
        const normalizedData = normalizeRowData(row);
        
        // Agregar categoría al mapa si no existe
        const categoriaKey = normalizedData.categoria.nombre.toLowerCase();
        if (!categoriesMap.has(categoriaKey)) {
          categoriesMap.set(categoriaKey, normalizedData.categoria);
        }
        
        // Agregar producto
        const productToAdd = {
          ...normalizedData.producto,
          categoriaNombre: normalizedData.categoria.nombre
        };
        productsData.push(productToAdd);
        
        results.processedRows++;
      })
      .on('end', async () => {
        try {
          // Si solo es validación, retornar resultados
          if (validateOnly) {
            results.success = true;
            results.summary = {
              categorias: categoriesMap.size,
              productos: productsData.length,
              errores: results.errors.length,
              advertencias: results.warnings.length
            };
            return resolve(results);
          }
          
          // Procesar en base de datos si no hay errores
          if (results.errors.length > 0) {
            results.success = false;
            return resolve(results);
          }
          
          await processDataInDatabase(
            restauranteId, 
            categoriesMap, 
            productsData, 
            results, 
            { replaceExisting, skipDuplicates }
          );
          
          results.success = true;
          resolve(results);
          
        } catch (error) {
          results.errors.push(`Error procesando datos: ${error.message}`);
          results.success = false;
          resolve(results);
        }
      })
      .on('error', (error) => {
        results.errors.push(`Error leyendo archivo CSV: ${error.message}`);
        results.success = false;
        resolve(results);
      });
  });
};

// Función para procesar datos en la base de datos
const processDataInDatabase = async (restauranteId, categoriesMap, productsData, results, options) => {
  const { replaceExisting, skipDuplicates } = options;
  
  // Verificar que el restaurante existe
  const restaurante = await prisma.restaurante.findUnique({
    where: { id: restauranteId }
  });
  
  if (!restaurante) {
    throw new Error('Restaurante no encontrado');
  }
  
  // Si replaceExisting, eliminar categorías y productos existentes
  if (replaceExisting) {
    await prisma.producto.deleteMany({
      where: { restauranteId }
    });
    await prisma.categoria.deleteMany({
      where: { restauranteId }
    });
    results.warnings.push('Menú existente reemplazado completamente');
  }
  
  // Procesar categorías
  const createdCategories = new Map();
  
  for (const [_, categoria] of categoriesMap) {
    try {
      let categoriaDB;
      
      // Verificar si la categoría ya existe
      const existingCategoria = await prisma.categoria.findFirst({
        where: {
          restauranteId,
          nombre: categoria.nombre
        }
      });
      
      if (existingCategoria) {
        if (skipDuplicates) {
          categoriaDB = existingCategoria;
          results.warnings.push(`Categoría '${categoria.nombre}' ya existe, se utilizará la existente`);
        } else {
          // Actualizar categoría existente
          categoriaDB = await prisma.categoria.update({
            where: { id: existingCategoria.id },
            data: {
              descripcion: categoria.descripcion,
              orden: categoria.orden
            }
          });
          results.warnings.push(`Categoría '${categoria.nombre}' actualizada`);
        }
      } else {
        // Crear nueva categoría
        categoriaDB = await prisma.categoria.create({
          data: {
            ...categoria,
            restauranteId
          }
        });
        results.createdCategories.push(categoriaDB);
      }
      
      const categoryKey = categoria.nombre.toLowerCase();
      createdCategories.set(categoryKey, categoriaDB);
      
    } catch (error) {
      console.error(`❌ Error creando categoría '${categoria.nombre}':`, error);
      results.errors.push(`Error creando categoría '${categoria.nombre}': ${error.message}`);
    }
  }
  
  // Procesar productos
  for (const producto of productsData) {
    try {
      const categoria = createdCategories.get(producto.categoriaNombre.toLowerCase());
      
      if (!categoria) {
        results.errors.push(`Categoría '${producto.categoriaNombre}' no encontrada para producto '${producto.nombre}'`);
        continue;
      }
      
      // Verificar si el producto ya existe
      const existingProducto = await prisma.producto.findFirst({
        where: {
          restauranteId,
          categoriaId: categoria.id,
          nombre: producto.nombre
        }
      });
      
      if (existingProducto) {
        if (skipDuplicates) {
          results.skippedProducts.push(`${producto.nombre} (ya existe)`);
          continue;
        } else {
          // Actualizar producto existente
          const { categoriaNombre, ...productUpdateData } = producto;
          
          const updatedProducto = await prisma.producto.update({
            where: { id: existingProducto.id },
            data: {
              descripcion: productUpdateData.descripcion,
              precio: productUpdateData.precio,
              disponible: productUpdateData.disponible,
              orden: productUpdateData.orden
            }
          });
          results.createdProducts.push(updatedProducto);
          results.warnings.push(`Producto '${producto.nombre}' actualizado`);
        }
      } else {
        // Crear nuevo producto
        // Excluir categoriaNombre ya que no existe en el esquema de Prisma
        const { categoriaNombre, ...productData } = producto;
        
        const newProducto = await prisma.producto.create({
          data: {
            ...productData,
            categoriaId: categoria.id,
            restauranteId
          }
        });
        results.createdProducts.push(newProducto);
      }
      
    } catch (error) {
      console.error(`❌ Error creando producto '${producto.nombre}':`, error);
      results.errors.push(`Error creando producto '${producto.nombre}': ${error.message}`);
    }
  }
  
  // Generar resumen
  results.summary = {
    categoriasCreadas: results.createdCategories.length,
    productosCreados: results.createdProducts.length,
    productosOmitidos: results.skippedProducts.length,
    errores: results.errors.length,
    advertencias: results.warnings.length
  };
};

// Función para generar template CSV
const generateCSVTemplate = () => {
  const header = CSV_TEMPLATE.headers.join(',');
  const examples = CSV_TEMPLATE.example.join('\n');
  
  // Crear el contenido completo del CSV con BOM UTF-8 para compatibilidad
  const csvContent = `${header}\n${examples}`;
  
  return csvContent;
};

// Función para obtener datos completos del template (útil para documentación)
const getTemplateInfo = () => {
  return {
    headers: CSV_TEMPLATE.headers.map(header => ({
      field: header,
      required: ['categoria_nombre', 'producto_nombre', 'producto_precio'].includes(header),
      type: header.includes('precio') ? 'number' : header.includes('orden') ? 'number' : header.includes('disponible') ? 'boolean' : 'string'
    })),
    exampleData: CSV_TEMPLATE.example,
    totalExamples: CSV_TEMPLATE.example.length,
    categories: [...new Set(CSV_TEMPLATE.example.map(row => row.split(',')[0].replace(/"/g, '')))],
    tips: [
      'Usa comillas dobles para campos que contengan comas',
      'Los valores booleanos pueden ser: true/false, 1/0, sí/no',
      'Los precios deben usar punto como separador decimal',
      'El encoding debe ser UTF-8',
      'Tamaño máximo de archivo: 5MB'
    ]
  };
};

module.exports = {
  processMenuCSV,
  generateCSVTemplate,
  validateCSVHeaders,
  validateRowData,
  CSV_TEMPLATE,
  getTemplateInfo
}; 