# 📊 Guía de Importación de Menús desde CSV

## 🎯 Descripción

El sistema de Digital Menu QR permite importar menús completos desde archivos CSV, facilitando la migración desde otros sistemas y la carga masiva de productos.

## 🚀 Características

- **Validación previa**: Verifica el formato antes de importar
- **Importación inteligente**: Maneja duplicados y errores automáticamente
- **Exportación**: Descarga tu menú actual en formato CSV
- **Interfaz intuitiva**: Modal paso a paso con progreso visual
- **Configuración flexible**: Opciones para reemplazar o mantener datos existentes

## 📋 Formato de Archivo CSV

### Headers Requeridos

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `categoria_nombre` | String | ✅ | Nombre de la categoría | "Entradas" |
| `categoria_descripcion` | String | ❌ | Descripción de la categoría | "Deliciosos aperitivos" |
| `categoria_orden` | Number | ❌ | Orden de visualización | 1 |
| `producto_nombre` | String | ✅ | Nombre del producto | "Ceviche de Pescado" |
| `producto_descripcion` | String | ❌ | Descripción del producto | "Fresco ceviche marinado" |
| `producto_precio` | Number | ✅ | Precio del producto | 12.50 |
| `producto_disponible` | Boolean | ❌ | Disponibilidad | true/false |
| `producto_orden` | Number | ❌ | Orden dentro de la categoría | 1 |

### Valores Aceptados para Booleanos

Para el campo `producto_disponible`:
- **Verdadero**: `true`, `1`, `sí`, `si`, `yes`
- **Falso**: `false`, `0`, `no`
- **Por defecto**: Si se omite, se considera `true`

### Ejemplo de Archivo CSV

```csv
categoria_nombre,categoria_descripcion,categoria_orden,producto_nombre,producto_descripcion,producto_precio,producto_disponible,producto_orden
Entradas,Deliciosos aperitivos para comenzar,1,Ceviche de Pescado,Fresco ceviche con pescado del día,12.50,true,1
Entradas,Deliciosos aperitivos para comenzar,1,Guacamole con Nachos,Guacamole casero con nachos crujientes,8.90,true,2
Platos Fuertes,Especialidades principales,2,Lomo Saltado,Clásico lomo saltado peruano,18.90,true,1
Platos Fuertes,Especialidades principales,2,Pollo a la Brasa,Medio pollo con papas y ensalada,16.50,false,2
Bebidas,Refrescantes bebidas,3,Chicha Morada,Bebida tradicional peruana,4.50,true,1
```

## 🛠️ Cómo Usar el Sistema

### 1. Acceder a la Importación

1. Inicia sesión como **Administrador**
2. Ve a **Gestión del Menú**
3. Haz clic en **"Importar CSV"** en la barra superior

### 2. Descargar Plantilla

1. En el modal, haz clic en **"Descargar Plantilla CSV"**
2. Usa este archivo como base para tu menú
3. Completa con tus datos siguiendo el formato

### 3. Configurar Opciones

**Opciones disponibles:**

- **Reemplazar menú existente**: Elimina todo el menú actual antes de importar
- **Omitir productos duplicados**: No importa productos que ya existen
- **Validar antes de importar**: Verifica el archivo antes del proceso

### 4. Validación

1. Selecciona tu archivo CSV
2. El sistema validará automáticamente:
   - Formato de headers
   - Datos requeridos
   - Tipos de datos correctos
   - Duplicados dentro del archivo

### 5. Importación

1. Si la validación es exitosa, procede con la importación
2. El sistema mostrará el progreso y resultados
3. Verifica el resumen de categorías y productos creados

### 6. Exportación

Para respaldar tu menú actual:
1. Haz clic en **"Exportar CSV"** 
2. Se descargará un archivo con tu menú completo
3. Úsalo como respaldo o para editarlo

## 📝 Reglas de Importación

### Categorías

- **Agrupación automática**: Productos con el mismo `categoria_nombre` se agrupan
- **Duplicados**: Si existe una categoría con el mismo nombre:
  - **Omitir duplicados = true**: Usa la categoría existente
  - **Omitir duplicados = false**: Actualiza descripción y orden
- **Orden**: Si no se especifica, se usa 0

### Productos

- **Identificación**: Se considera duplicado si existe en la misma categoría con el mismo nombre
- **Precios**: Deben ser números positivos (decimales con punto)
- **Disponibilidad**: Por defecto todos los productos son disponibles
- **Orden**: Si no se especifica, se usa 0

### Manejo de Errores

El sistema reporta:
- **Errores**: Impiden la importación (datos requeridos faltantes, formatos incorrectos)
- **Advertencias**: Informan sobre duplicados o datos omitidos
- **Resumen**: Cantidad de categorías y productos procesados

## 🔧 API Endpoints

### Obtener Template
```
GET /api/menu-import/template
Authorization: Bearer <token>
```

### Información del Formato
```
GET /api/menu-import/format-info
Authorization: Bearer <token>
```

### Validar CSV
```
POST /api/menu-import/validate
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- csvFile: archivo CSV
```

### Importar Menú
```
POST /api/menu-import/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- csvFile: archivo CSV
- replaceExisting: boolean (opcional)
- skipDuplicates: boolean (opcional)
- validateFirst: boolean (opcional)
```

### Exportar Menú
```
GET /api/menu-import/export
Authorization: Bearer <token>
```

## ⚠️ Limitaciones y Consideraciones

### Restricciones

- **Tamaño máximo**: 5MB por archivo
- **Formato**: Solo archivos .csv
- **Encoding**: UTF-8 recomendado
- **Separador**: Comas (,)

### Recomendaciones

1. **Respaldo**: Exporta tu menú actual antes de importar
2. **Validación**: Siempre valida antes de importar
3. **Pruebas**: Prueba con pocos productos primero
4. **Formato**: Usa la plantilla para evitar errores
5. **Duplicados**: Revisa las opciones según tus necesidades

### Manejo de Caracteres Especiales

- **Comillas**: Usa comillas dobles para texto con comas
- **Acentos**: El sistema soporta caracteres latinos
- **Saltos de línea**: No uses saltos de línea dentro de celdas

### Ejemplo con Caracteres Especiales

```csv
categoria_nombre,producto_nombre,producto_descripcion,producto_precio
"Platos Especiales","Arroz con Pollo, Estilo Abuela","Delicioso arroz amarillo con pollo, cilantro y ají amarillo",15.50
```

## 🐛 Troubleshooting

### Error: "Headers inválidos"
- **Causa**: Los nombres de las columnas no coinciden
- **Solución**: Descarga la plantilla y úsa los headers exactos

### Error: "producto_precio debe ser un número válido"
- **Causa**: Precio con formato incorrecto
- **Solución**: Usa punto como separador decimal (12.50, no 12,50)

### Error: "categoria_nombre es requerido"
- **Causa**: Celda vacía en columna obligatoria
- **Solución**: Completa todas las celdas requeridas

### Advertencia: "Categoría ya existe"
- **Causa**: Importando categoría que ya tienes
- **Solución**: Normal si estás agregando productos a categorías existentes

### Error de archivo muy grande
- **Causa**: Archivo superior a 5MB
- **Solución**: Divide el archivo en partes más pequeñas

## 📚 Ejemplos de Uso

### Caso 1: Restaurante Nuevo
```bash
# Opciones recomendadas:
- Reemplazar menú existente: true
- Omitir duplicados: false
- Validar antes de importar: true
```

### Caso 2: Agregar Nueva Categoría
```bash
# Opciones recomendadas:
- Reemplazar menú existente: false
- Omitir duplicados: true
- Validar antes de importar: true
```

### Caso 3: Actualizar Precios
```bash
# Opciones recomendadas:
- Reemplazar menú existente: false
- Omitir duplicados: false
- Validar antes de importar: true
```

## 🔄 Workflow Típico

1. **Preparación**
   - Exportar menú actual (respaldo)
   - Descargar plantilla CSV
   - Preparar datos del nuevo menú

2. **Validación**
   - Subir archivo para validar
   - Revisar errores y advertencias
   - Corregir datos si es necesario

3. **Importación**
   - Configurar opciones según el caso
   - Ejecutar importación
   - Verificar resultados

4. **Verificación**
   - Revisar menú en la administración
   - Probar menú público
   - Hacer ajustes manuales si es necesario

---

**💡 Tip**: Siempre haz un respaldo antes de importar y prueba con datos pequeños primero. 