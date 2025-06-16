# Guía de Despliegue y Migración

Este documento explica el flujo de trabajo para desplegar nuevos cambios en la aplicación y actualizar la base de datos en producción (Google App Engine y Cloud SQL).

## Resumen del Flujo

El proceso se ha separado en dos partes para mayor estabilidad y control:

1.  **Despliegue de la Aplicación (Automático):** Subir cambios a la rama `main` de GitHub despliega automáticamente el código de la aplicación en App Engine.
2.  **Migración de la Base de Datos (Manual):** Los cambios en la estructura de la base de datos (crear tablas, añadir columnas, etc.) se aplican manualmente a través de Google Cloud Shell.

---

## Escenario 1: Cambios que NO Afectan a la Base de Datos

Si tus cambios son solo en el frontend o en la lógica del backend (que no tocan el `schema.prisma`), el proceso es simple.

1.  **Haz `push` a `main`:**
    ```bash
    git add .
    git commit -m "feat: descripción de tus cambios"
    git push origin main
    ```
2.  **Listo:** El pipeline de CI/CD en GitHub Actions se encargará de todo. Tu nueva versión estará en línea en unos minutos.

---

## Escenario 2: Cambios que SÍ Afectan a la Base de Datos

Este es el flujo para cuando modificas el archivo `prisma/schema.prisma`.

### Paso 1: Desarrollo Local

1.  **Modifica el `schema.prisma`:** Haz los cambios que necesites en el modelo de datos.
2.  **Crea la Migración:** Ejecuta este comando en tu terminal local. Creará un nuevo archivo de migración y aplicará los cambios a tu base de datos local.
    ```bash
    npm run db:migrate --workspace=backend
    ```
3.  **Prueba Localmente:** Asegúrate de que todo funcione como esperas en tu entorno de desarrollo.

### Paso 2: Despliega el Código de la Aplicación

1.  **Haz `push` de TODO a `main`:** Asegúrate de incluir los nuevos archivos de migración que se crearon en la carpeta `prisma/migrations`.
    ```bash
    git add .
    git commit -m "feat: añade campo X a la tabla Y"
    git push origin main
    ```
2.  **Espera a que termine el deploy:** Ve a la pestaña "Actions" en GitHub y espera a que el workflow termine con éxito (✔️). En este punto, tu nueva aplicación ya está en línea, pero es posible que muestre errores porque la base de datos de producción aún no tiene los cambios.

### Paso 3: Aplica la Migración a la Base de Datos de Producción (Manual)

1.  **Abre Google Cloud Shell:**
    *   Ve a [https://console.cloud.google.com/](https://console.cloud.google.com/).
    *   Asegúrate de que el proyecto `digital-menu-455517` esté seleccionado.
    *   Activa Cloud Shell (ícono `>_`).

2.  **Ejecuta los siguientes comandos en Cloud Shell:**

    *   **Clona el repositorio (si no lo tienes ya):**
        ```bash
        git clone https://github.com/gu3gu3/Digital-Menu.git
        ```
    *   **Actualiza tu código al más reciente:**
        ```bash
        cd Digital-Menu && git pull
        ```
    *   **Navega al directorio del backend:**
        ```bash
        cd packages/backend
        ```
    *   **Instala las dependencias (necesario si hay cambios):**
        ```bash
        npm install
        ```
    *   **Define la URL de la Base de Datos:**
        ```bash
        export DATABASE_URL='postgresql://postgres:JAFgQKBgQDZTW@/menuview_db?host=/cloudsql/digital-menu-455517:us-central1:digital-menu-db'
        ```
    *   **¡Aplica la migración!** Este comando lee los archivos de migración y actualiza la base de datos de producción.
        ```bash
        npx prisma migrate deploy
        ```
    *   **(Opcional) Si necesitas recargar los datos de `seed`:**
        ```bash
        npx prisma db seed
        ```

3.  **Verifica:** Tu aplicación ahora debería funcionar correctamente. Visita las URLs para confirmar.
    *   `https://digital-menu-455517.uc.r.appspot.com/health`
    *   `https://digital-menu-455517.uc.r.appspot.com/api/public`

¡Y eso es todo! Este proceso te da un control total y seguro sobre tu entorno de producción. 