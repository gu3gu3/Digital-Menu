# 🤖 Generador de Menús con IA - Digital Menu QR v2.0

## Descripción

La funcionalidad **Generador de Menús con IA** permite a los super administradores crear menús completos automáticamente a partir de múltiples imágenes utilizando GPT-4 Vision con prompts personalizables, así como crear múltiples mesas de forma masiva.

## 🚀 Características

### 1. Generación Automática de Menús (Actualizado v2.0)
- **Múltiples imágenes**: Soporta hasta 3 archivos por menú para menús extensos
- **Prompts personalizables**: Configuración especializada según tipo de restaurante
- **Casos especiales**: Manejo inteligente de menús complejos o de baja calidad
- **Extracción inteligente**: Utiliza GPT-4 Vision con prompts optimizados
- **Combinación automática**: Fusiona datos de múltiples imágenes evitando duplicados
- **Creación automática**: Genera categorías y productos automáticamente
- **Descripciones mejoradas**: Opción para generar descripciones atractivas con IA
- **Reemplazo flexible**: Opción para reemplazar menú existente o agregar al actual
- **Formatos soportados**: PNG, JPG, JPEG, PDF (máximo 5MB cada uno)

### 2. Tipos de Menú Especializados
- **🍔 Comida Rápida**: Optimizado para combos, tamaños y promociones
- **🍽️ Restaurante Formal**: Reconoce técnicas culinarias e ingredientes premium
- **🍕 Pizzería**: Identifica tamaños, ingredientes y tipos de masa
- **☕ Cafetería/Panadería**: Diferencia bebidas, pasteles y opciones especiales
- **🍺 Bar/Cantina**: Categoriza bebidas alcohólicas, tapas y promociones

### 3. Casos Especiales Avanzados
- **🌐 Menú multiidioma**: Prioriza español y maneja múltiples idiomas
- **📸 Con imágenes**: Infiere ingredientes desde imágenes de productos
- **💰 Con promociones**: Maneja precios tachados y ofertas especiales
- **📱 Baja calidad**: Extrae solo información legible y confiable

### 4. Creación Masiva de Mesas
- **Nombres consecutivos**: Crea múltiples mesas con numeración automática
- **Flexibilidad de nombres**: Personaliza el nombre base (Mesa, Habitación, Salón, etc.)
- **Evita conflictos**: Detecta automáticamente números existentes para evitar duplicados
- **Configuración por lotes**: Establece capacidad y numeración inicial

## 🔧 Configuración

### Requisitos
1. **API Key de OpenAI**: Necesaria para GPT-4 Vision
2. **Permisos de Super Admin**: Solo accesible para super administradores
3. **Dependencias**: 
   - `openai@^4.25.0` (instalada automáticamente)
   - Multer para manejo de archivos

### Variables de Entorno
```bash
# Archivo .env del backend
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

### Configuración en Google Cloud Platform
```bash
# Agregar variable de entorno en Cloud Run
gcloud run services update your-service-name \
  --set-env-vars OPENAI_API_KEY=sk-your-actual-openai-api-key
```

## 📱 Acceso a la Funcionalidad

### Desde el Panel de Super Admin
1. Iniciar sesión como Super Admin
2. En el Dashboard, hacer clic en "🤖 Generador de Menús IA"
3. O navegar directamente a: `/super-admin/ai-menu-generator`

## 🎯 Cómo Usar (Actualizado v2.0)

### Generación de Menús con IA

1. **Seleccionar Restaurante**
   - Elige el restaurante donde crear/actualizar el menú
   - Visualiza estadísticas actuales (categorías, productos, mesas)

2. **Subir Imágenes del Menú (Nuevo)**
   - Arrastra y suelta o selecciona hasta 3 archivos
   - Formatos: PNG, JPG, JPEG, PDF
   - Tamaño máximo: 5MB cada archivo
   - Elimina archivos individualmente si es necesario

3. **Configurar Tipo de Menú (Nuevo)**
   - Selecciona el tipo para optimizar la extracción:
     - Comida Rápida
     - Restaurante Formal
     - Pizzería
     - Cafetería/Panadería
     - Bar/Cantina
   - O deja en "Detección automática"

4. **Casos Especiales (Nuevo)**
   - Marca las características especiales de tu menú:
     - ☑️ Menú en varios idiomas
     - ☑️ Menú con imágenes de productos
     - ☑️ Menú con promociones/precios tachados
     - ☑️ Imagen de baja calidad/poco legible

5. **Configurar Opciones**
   - ☑️ **Reemplazar menú existente**: Elimina categorías y productos actuales
   - ☑️ **Generar descripciones con IA**: Mejora descripciones automáticamente

6. **Procesar**
   - Clic en "🤖 Generar Menú con IA"
   - El proceso puede tomar 1-3 minutos para múltiples imágenes
   - Se mostrará progreso y resultado detallado

### Creación Masiva de Mesas

1. **Seleccionar Restaurante**
   - Mismo restaurante o diferente al del menú

2. **Configurar Parámetros**
   - **Nombre Base**: Mesa, Habitación, Salón, etc.
   - **Cantidad**: Número de mesas a crear (1-50)
   - **Número Inicial**: Desde qué número empezar
   - **Capacidad**: Personas por mesa

3. **Vista Previa**
   - Revisa el rango de nombres que se crearán
   - Ejemplo: "Mesa 1" hasta "Mesa 10"

4. **Crear**
   - Clic en "🪑 Crear Mesas"
   - Se evitan automáticamente conflictos de numeración

## 📊 Estructura de Datos Extraídos

### Formato de Menú Esperado por la IA
```json
{
  "categorias": [
    {
      "nombre": "Entradas",
      "descripcion": "Deliciosos aperitivos para comenzar",
      "orden": 1,
      "productos": [
        {
          "nombre": "Bruschetta Italiana",
          "descripcion": "Pan tostado con tomate fresco y albahaca",
          "precio": 8.50,
          "disponible": true,
          "orden": 1
        }
      ]
    }
  ]
}
```

## 🔍 API Endpoints (Actualizado v2.0)

### Documentación Swagger
- **URL**: `http://localhost:3001/api/docs`
- **Tag**: "AI Menu Generator"
- **Seguridad**: Requiere token de Super Admin

### Endpoints Disponibles

#### 1. Obtener Restaurantes
```http
GET /api/super-admin/ai-menu-generator/restaurants
Authorization: Bearer {superAdminToken}
```

#### 2. Generar Menú desde Múltiples Imágenes (Actualizado)
```http
POST /api/super-admin/ai-menu-generator/generate
Authorization: Bearer {superAdminToken}
Content-Type: multipart/form-data

{
  "menuImages": [archivo1, archivo2, archivo3], // Hasta 3 archivos
  "restauranteId": "1",
  "replaceExistingMenu": false,
  "generateDescriptions": true,
  "menuType": "FAST_FOOD", // Opcional
  "specialCases": ["MULTILINGUAL", "WITH_IMAGES"] // Opcional
}
```

#### 3. Crear Mesas Masivamente
```http
POST /api/super-admin/ai-menu-generator/bulk-tables
Authorization: Bearer {superAdminToken}
Content-Type: application/json

{
  "restauranteId": "1",
  "baseName": "Mesa",
  "count": 10,
  "startNumber": 1,
  "capacity": 4
}
```

## 🎛️ Personalización de Prompts (Nuevo v2.0)

### Archivo de Configuración
Los prompts están centralizados en `packages/backend/src/config/aiPrompts.js` para fácil personalización.

### Estructura de Prompts
```javascript
const AI_PROMPTS = {
  MENU_EXTRACTION: {
    text: "Prompt principal...",
    model: "gpt-4-vision-preview",
    maxTokens: 4000
  },
  SPECIALIZED_PROMPTS: {
    FAST_FOOD: { additionalInstructions: "..." },
    FINE_DINING: { additionalInstructions: "..." }
  },
  SPECIAL_CASES: {
    MULTILINGUAL: "Instrucciones especiales...",
    POOR_QUALITY: "Manejo de baja calidad..."
  }
}
```

### Personalizar Prompts
1. Editar `packages/backend/src/config/aiPrompts.js`
2. Modificar prompts según necesidades específicas
3. Reiniciar servidor para aplicar cambios
4. Probar con menús de prueba

## ⚠️ Consideraciones Importantes (Actualizado)

### Limitaciones
- **Costo de OpenAI**: Cada imagen consume tokens de GPT-4 Vision (~$0.01-0.03 por imagen)
- **Tiempo de procesamiento**: 1-3 minutos para múltiples imágenes
- **Calidad de imagen**: Imágenes claras obtienen mejores resultados
- **Idioma**: Optimizado para español, soporta detección multiidioma

### Recomendaciones v2.0
1. **Múltiples imágenes**: Usa 2-3 imágenes para menús extensos o complejos
2. **Tipo de menú**: Siempre selecciona el tipo para mejores resultados
3. **Casos especiales**: Marca características relevantes de tu menú
4. **Imágenes de alta calidad**: Texto legible y bien iluminado
5. **Menús estructurados**: Categorías y precios claramente separados
6. **Revisar resultados**: Siempre verificar productos y precios generados
7. **Pruebas graduales**: Comenzar con menús pequeños para familiarizarse

### Capacidades Avanzadas
- **Fusión inteligente**: Combina automáticamente categorías de múltiples imágenes
- **Detección de duplicados**: Evita productos repetidos entre imágenes
- **Preservación de menú**: Opción de agregar sin eliminar contenido existente
- **Optimización por contexto**: Prompts especializados mejoran precisión

### Seguridad
- Solo accesible para Super Administradores
- Logs completos de todas las operaciones
- Validación estricta de archivos subidos (tipo, tamaño, cantidad)
- Manejo seguro de tokens de OpenAI
- Sin modificación del schema de base de datos

## 🐛 Solución de Problemas (Actualizado)

### Errores Comunes v2.0

#### "Error procesando las imágenes con IA"
- Verificar que la API key de OpenAI sea válida y tenga crédito
- Reducir número de imágenes o tamaño de archivos
- Comprobar que las imágenes sean legibles
- Intentar con "Imagen de baja calidad" marcado en casos especiales

#### "Máximo 3 archivos permitidos"
- Seleccionar solo las imágenes más importantes del menú
- Combinar múltiples páginas en un PDF si es posible
- Procesar en lotes separados si es necesario

#### "Archivo demasiado grande"
- Reducir resolución de imágenes (manteniendo legibilidad)
- Comprimir PDFs antes de subir
- Usar formatos más eficientes (JPG vs PNG)

#### "Restaurante no encontrado"
- Verificar que el restaurante existe y está activo
- Comprobar permisos de Super Admin
- Refrescar lista de restaurantes

### Logs y Debugging
- Los errores se registran en los logs del backend
- Verificar `/logs` o consola del servidor
- Logs de OpenAI incluyen detalles de respuesta y tokens consumidos
- Logs específicos para fusión de múltiples imágenes

### Configuración en Producción (GCP)
- Verificar que `OPENAI_API_KEY` esté configurada en Cloud Run
- No se requieren migraciones de base de datos
- El schema de Prisma permanece intacto
- Solo agregar la variable de entorno y desplegar

## 🔄 Actualizaciones Futuras

### Mejoras Planificadas v3.0
- Soporte para más idiomas automático
- Reconocimiento de imágenes de productos con precios
- Integración con Google Vision API como alternativa
- Exportación/importación de configuraciones de prompts
- Análisis de calidad de imagen pre-procesamiento
- Soporte para menús digitales (capturas de pantalla)
- Integración con sistemas POS externos
- Generación de menús desde texto plano o CSV

### Historial de Versiones
- **v1.0**: Funcionalidad básica con una imagen
- **v2.0**: Múltiples imágenes, prompts personalizables, casos especiales
- **v2.1**: Próximamente - Mejoras en precisión y velocidad

## 📞 Soporte

Para problemas técnicos o preguntas sobre la funcionalidad:
1. Revisar logs del backend
2. Verificar documentación Swagger
3. Comprobar configuración de OpenAI
4. Contactar al equipo de desarrollo

---

**Versión**: 2.0.0  
**Fecha de implementación**: Enero 2025  
**Compatibilidad**: Digital Menu QR v2.0+ 