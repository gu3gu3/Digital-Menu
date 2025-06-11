# Documento de Requisitos del Producto (PRD) - Menú Digital QR (MVP)
**Versión:** 0.3  
**Fecha:** 9 de Mayo, 2025

## 1. Introducción y Objetivos

### 1.1. Propósito
Este documento define los requisitos para el Producto Mínimo Viable (MVP) de un sistema de menú digital accesible mediante códigos QR. El objetivo es permitir a los restaurantes ofrecer a sus clientes una forma moderna, atractiva y funcional de ver el menú y realizar pedidos, utilizando Cloud SQL para la base de datos, Cloud Run (con Node.js/Express y Prisma como ORM) para el backend, y React para el frontend, asegurando un despliegue rápido y escalabilidad.

### 1.2. Problema a Resolver
Los menús físicos tradicionales pueden ser costosos de mantener, difíciles de actualizar rápidamente, y menos higiénicos. Además, no ofrecen la interactividad ni la riqueza visual que los clientes modernos esperan. Este servicio busca solucionar estos puntos ofreciendo una alternativa digital eficiente.

### 1.3. Objetivos del Negocio (MVP)
- Validar la aceptación del mercado para un menú digital QR con funcionalidades básicas de pedido.
- Adquirir los primeros restaurantes usuarios (early adopters).
- Establecer una base tecnológica sólida (Cloud SQL, Cloud Run, React, Node.js, Prisma) para futuras iteraciones y escalabilidad.
- Probar la viabilidad del modelo freemium.

### 1.4. Público Objetivo
- **Restaurantes:** Pequeños y medianos restaurantes, cafeterías, bares que buscan modernizar su servicio, reducir costos de impresión y mejorar la experiencia del cliente.
- **Clientes de Restaurantes:** Comensales que valoran la comodidad, la información visual y la eficiencia al ordenar.

## 2. Alcance del Producto (MVP)

### 2.1. Funcionalidades Clave (User Stories)

#### 2.1.1. Cliente del Restaurante
- Como cliente, quiero escanear un código QR (asociado a mi mesa) con mi móvil para acceder al menú digital del restaurante sin necesidad de instalar una app.
- Como cliente, quiero poder poner mi nombre o alias para diferenciar a los clientes que pertenecen a la misma mesa para efectos de facturación independiente dentro del sistema del Restaurante.
- Como cliente, quiero ver las categorías de productos (ej. Entradas, Platos Fuertes, Bebidas, Postres) para navegar fácilmente por el menú.
- Como cliente, quiero ver los productos con nombre, descripción detallada, precio y una imagen atractiva para tomar una decisión informada.
- Como cliente, quiero seleccionar productos y especificar la cantidad para añadirlos a mi pedido.
- Como cliente, quiero revisar mi pedido (lista de productos, cantidades y subtotal) antes de enviarlo para asegurar que es correcto.
- Como cliente, quiero enviar mi pedido al restaurante (asociado a mi mesa) para que sea preparado.
- Como cliente, qiero tener opcion de poder agregar pedidos adicionales a mi orden.
- Como cliente, quiero ver un estado simple de mi pedido (ej. "Orden Enviada", "Orden Recibida" "Orden Confirmada" “Orden en Preparación” "Orden Servida") para tener confirmación y seguimiento.

#### 2.1.2. Personal del Restaurante (Rol unificado "Gestor/Mesero" para MVP)
- Como Gestor/Mesero, quiero un panel web simple donde pueda ver las nuevas órdenes entrantes (identificando la mesa) en tiempo real (o con refresco automático) para atenderlas prontamente.
- Como Gestor/Mesero, quiero ver los detalles de cada orden (productos, cantidades, mesa) para saber qué preparar y dónde entregar.
- Como Gestor/Mesero, quiero poder marcar una orden como "Orden Recibida" "Orden Confirmada" "Orden en Progreso" “Orden en Preparación” "Orden Servida" para gestionar el flujo de trabajo y cerrar el ciclo del pedido en el sistema.

#### 2.1.3. Administrador del Local (Propietario)
- Como Administrador, quiero un panel web para registrar mi restaurante (nombre, información básica, logo, banner opcional).
- Como Administrador, quiero poder crear, editar y eliminar categorías de productos en mi menú.
- Como Administrador, quiero poder añadir, editar y eliminar productos (nombre, descripción, precio, subir imagen, marcar como disponible/no disponible).
- Como Administrador, quiero poder definir las mesas de mi local y generar un código QR único por cada mesa para que los clientes accedan al menú y el pedido se asocie correctamente (con un límite de mesas para el plan gratuito).
- Como Administrador, quiero ver un listado de todas las órdenes y sus estados (incluyendo la mesa) para tener una visión general de la operación.
- Como Administrador, quiero poder crear, actualizar y eliminar cuentas de usuario para el personal (Meseros) con información básica (nombre, email/usuario, contraseña) para que puedan acceder al panel de Gestor/Mesero.

#### 2.1.4. Visitante del Sitio Web de Mercadeo
- Como visitante, quiero ver información clara sobre las características y beneficios del sistema de menú digital para entender cómo puede ayudar a mi restaurante.
- Como visitante, quiero ver testimonios o casos de éxito para confiar en el servicio.
- Como visitante, quiero ver los diferentes planes disponibles y sus precios para tomar una decisión informada.
- Como visitante, quiero poder registrarme fácilmente para comenzar a utilizar el servicio.
- Como visitante, quiero iniciar sesión en mi cuenta para acceder al panel de administración.
- Como visitante, quiero poder solicitar una demostración del producto para evaluar su funcionamiento.

### 2.2. Fuera de Alcance para el MVP
- Integración de pasarelas de pago.
- Sistema de reservaciones.
- Roles detallados y separados para cocina, caja, bartender con interfaces específicas (más allá del Gestor/Mesero y Administrador).
- Gestión de inventario detallada.
- Notificaciones push avanzadas (SMS, email). Se priorizarán actualizaciones en la interfaz.
- Programas de lealtad o cupones de descuento.
- Personalización avanzada del diseño del menú por el restaurante (más allá de logo/banner).
- Múltiples idiomas (se iniciará con Español).
- Analíticas y reportes detallados.
- Modificación de órdenes por el cliente una vez enviadas.
- Comunicación directa cliente-mesero vía chat en la app.
- Gestión de múltiples sucursales bajo una misma cuenta de administrador.
- Aplicación móvil dedicada para el personal del restaurante.

## 3. Roles de Usuario y Casos de Uso (MVP)

### 3.1. Roles
- **Cliente del Restaurante:** Accede vía QR de mesa, visualiza menú, crea y envía pedidos. No requiere login.
- **Gestor/Mesero:** Accede a un panel (web) con login (usuario y contraseña proporcionados por el Administrador). Visualiza y actualiza estados de los pedidos de las mesas asignadas o de todas las mesas.
- **Administrador del Local:** Accede a un panel (web) con login. Gestiona la información del restaurante (incl. logo/banner), el menú, las mesas (y sus QRs), las cuentas de Meseros, y visualiza todas las órdenes.
- **Visitante del Sitio Web:** Accede al sitio web de mercadeo, obtiene información sobre el servicio, puede registrarse o iniciar sesión.

### 3.2. Casos de Uso Principales
#### CU1: Cliente realiza un pedido.
1. Cliente escanea QR de su mesa.
2. Visualiza menú (categorías, productos con detalles e imágenes), posiblemente con el logo/banner del restaurante.
3. Selecciona productos y cantidades.
4. Revisa su carrito/pedido.
5. Envía el pedido (el sistema lo asocia a la mesa escaneada).
6. Ve estado "Pedido Enviado", luego "Pedido Recibido por el Restaurante".

#### CU2: Personal gestiona un pedido.
1. Gestor/Mesero accede al panel de órdenes.
2. Ve nueva orden en el listado, identificando claramente la mesa.
3. Abre detalles de la orden.
4. Actualiza estado (ej. a "Pedido Recibido", "Confirmado", "En Preparación", luego a "Lista para Servir", "Completado").

#### CU3: Administrador gestiona el menú y restaurante.
1. Administrador accede a su panel.
2. Navega a la sección de gestión de menú: crea/edita categorías, añade/edita productos (con imagen).
3. Navega a la configuración del restaurante: sube/actualiza logo y banner.
4. Marca un producto como "No Disponible".

#### CU4: Administrador gestiona mesas y QRs.
1. Administrador accede a su panel.
2. Navega a la sección de gestión de mesas.
3. Crea/edita/elimina mesas (ej. "Mesa 1", "Terraza A").
4. Para cada mesa, el sistema genera/muestra un QR único.
5. (Considerar límite de mesas para plan freemium).

#### CU5: Administrador gestiona personal (Meseros).
1. Administrador accede a su panel.
2. Navega a la sección de gestión de personal/meseros.
3. Crea una nueva cuenta de mesero (nombre, email/usuario, contraseña temporal).
4. Edita datos básicos o desactiva una cuenta de mesero.

#### CU6: Visitante se registra en el sistema.
1. Visitante accede al sitio web de mercadeo.
2. Navega para conocer características y planes disponibles.
3. Hace clic en "Registrarse" o "Comenzar gratis".
4. Completa formulario de registro (datos personales, datos del restaurante, selección de plan).
5. Recibe confirmación y accede al panel de administrador.

## 4. Requisitos del Sistema (MVP)

### 4.1. Frontend
#### Cliente:
- Aplicación web progresiva (PWA) o sitio web responsivo accesible desde cualquier navegador móvil moderno.
- Diseño "bonito y moderno": intuitivo, visualmente atractivo, con énfasis en las imágenes de los productos, y mostrando logo/banner del restaurante.
- Carga rápida.
- Tecnologías: React, HTML5, CSS3 (Tailwind CSS para agilidad), JavaScript.

#### Personal (Gestor/Mesero) y Administrador:
- Paneles de administración web responsivos, funcionales y claros.
- Tecnologías: React, HTML5, CSS3 (Tailwind CSS o similar), JavaScript. (Considerar librerías de componentes UI para admin).

#### Sitio Web de Mercadeo:
- Diseño moderno, atractivo y profesional que transmita confianza y valor.
- Página de inicio con información clara sobre el producto, beneficios, planes y llamados a la acción.
- Formularios de registro y login intuitivos y accesibles.
- Secciones de testimonios, características, precios, FAQ y contacto.
- Optimizado para dispositivos móviles y de escritorio.
- Tecnologías: React, HTML5, CSS3 (Tailwind CSS), JavaScript.

### 4.2. Backend
- API RESTful para todas las interacciones.
- Lógica de negocio para el procesamiento de órdenes, gestión de estados, gestión de mesas, y límites de planes.
- Autenticación (ej. JWT) y Autorización por roles para Personal y Administrador.
- Tecnologías:
  - Lenguaje: Node.js (con Express.js).
  - ORM: Prisma.
  - Plataforma de Despliegue: Google Cloud Run.

### 4.3. Base de Datos
- Esquema relacional definido y gestionado a través de Prisma Schema.
- El diseño detallado de la base de datos (tablas, columnas, tipos de datos, relaciones, claves primarias y foráneas) se encuentra documentado en el artefacto db_schema_menu_digital_mvp y será la base para el schema.prisma.

#### Tablas principales (MVP) - Resumen:
- Restaurantes
- Usuarios_Admin
- Usuarios_Meseros
- Mesas
- Categorias
- Productos
- Ordenes (con estado_orden)
- Items_Orden
- Planes

- Tecnología de Base de Datos subyacente: Google Cloud SQL (PostgreSQL o MySQL, compatible con Prisma).

### 4.4. Infraestructura
- Google Cloud Run: Para el backend de la aplicación.
- Google Cloud SQL: Para la base de datos.
- Google Cloud Storage: Para almacenar imágenes de productos, logos y banners.
- (Opcional) Firebase Hosting o Netlify/Vercel: Para el despliegue del frontend React.

### 4.5. Seguridad (Consideraciones Básicas para MVP)
- HTTPS para todas las comunicaciones.
- Protección contra inyecciones SQL: Prisma, como ORM, ayuda significativamente a prevenir vulnerabilidades de inyección SQL al utilizar consultas parametrizadas y constructores de consultas seguros. Se complementará con validaciones de entrada.
- Hashing de contraseñas (ej. bcrypt) para todos los usuarios con login.
- Validación de entradas en el frontend y, crucialmente, en el backend.
- Uso de variables de entorno para configuraciones sensibles (credenciales de BD, secretos de API).
- Configuración adecuada de CORS en el backend.

## 5. Diseño y Experiencia de Usuario (UX/UI) - Principios para el MVP

### Cliente:
- **Claridad Visual:** Imágenes grandes y de alta calidad de los productos. Logo/banner del restaurante visibles.
- **Navegación Intuitiva:** Fácil de encontrar categorías y productos.
- **Proceso de Pedido Sencillo:** Mínimos pasos para completar un pedido.
- **Feedback Inmediato:** Confirmación visual al añadir productos, enviar el pedido y cambios de estado.
- **Rendimiento:** Carga rápida del menú.
- **Diseño Responsivo:** Adaptable a cualquier tamaño de pantalla móvil.

### Administrador/Personal:
- **Eficiencia:** Flujos de trabajo optimizados para la gestión de menú, mesas, personal y órdenes.
- **Claridad de Información:** Datos presentados de forma concisa y fácil de entender.
- **Consistencia:** Interfaz coherente en todas las secciones del panel.

### Sitio Web de Mercadeo:
- **Atractivo Visual:** Diseño moderno con imágenes de alta calidad y animaciones sutiles.
- **Claridad del Mensaje:** Comunicación clara del valor y beneficios del producto.
- **Conversión:** Llamados a la acción (CTA) destacados y estratégicamente ubicados.
- **Confianza:** Elementos que generen credibilidad (testimonios, logos de clientes, menciones en medios).
- **Experiencia Fluida:** Navegación intuitiva y formularios de registro/login simples.
- **Diseño Responsivo:** Adaptable a todos los dispositivos y tamaños de pantalla.

## 6. Modelo Freemium (Ideas Iniciales)

### 6.1. Plan Gratuito (MVP)
- Funcionalidades del MVP.
- Limitaciones:
  - Número de productos en el menú (ej. hasta 50 productos).
  - Número de órdenes mensuales (ej. hasta 200 órdenes).
  - Número de mesas con código QR (ej. hasta 10 mesas).
  - Número de Meseros (2 meseros)
- Soporte básico (comunidad o FAQ).

### 6.2. Planes Premium (Futuro, post-MVP)
- Eliminación de límites (productos, órdenes, mesas).
- Funcionalidades avanzadas (no incluidas en MVP):
  - Roles de cocina, caja.
  - Personalización avanzada del menú.
  - Analíticas.
  - Integraciones (pagos, POS).
- Soporte prioritario.
- Eliminación de marca de agua.

## 7. Métricas de Éxito para el MVP

### Adquisición:
- Número de restaurantes registrados.
- Tasa de conversión de visita a registro (para administradores).
- Tasa de conversión del sitio web de mercadeo.

### Activación:
- Número de restaurantes que completan la configuración de su menú y al menos una mesa.
- Número de menús con al menos X productos.

### Retención/Uso:
- Número de órdenes creadas a través del sistema por día/semana/mes.
- Número de restaurantes activos (que reciben órdenes regularmente).
- Número de mesas activas con QR siendo utilizadas.

### Satisfacción (Cualitativa):
- Feedback directo de los primeros restaurantes y sus clientes.
- Facilidad de uso reportada para la gestión de mesas y personal.

## 8. Consideraciones Futuras (Post-MVP)
- Integración de pagos.
- Roles específicos (cocina, caja, bartender) con interfaces y flujos de trabajo adaptados.
- Sistema de notificaciones avanzadas (ej. WhatsApp, notificaciones push a una app de personal).
- Módulo de reservaciones.
- Herramientas de marketing y fidelización (cupones, programas de puntos).
- Personalización avanzada del look & feel del menú.
- Soporte multi-idioma.
- Analíticas avanzadas para restaurantes.
- API para integraciones con sistemas POS existentes.
- Aplicación móvil dedicada para el personal del restaurante.
