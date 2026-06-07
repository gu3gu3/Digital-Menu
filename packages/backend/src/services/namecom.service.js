// Usando las credenciales proporcionadas. En producción deberían ir en .env
const NAMECOM_USERNAME = process.env.NAMECOM_USERNAME || 'gueeguense';
const NAMECOM_TOKEN = process.env.NAMECOM_TOKEN || '8a8bfa29971c97b574233ec97032ad4d4b874596';
// API endpoint (Production). Para testing/sandbox Name.com usa api.dev.name.com, pero usaremos prod por defecto
const API_URL = 'https://api.name.com';

/**
 * Crea un subdominio CNAME en menuview.app que apunta al dominio principal.
 * @param {string} slug El subdominio (ej: ccn)
 * @returns {Promise<Object>} El resultado de la operación
 */
const createSponsorSubdomain = async (slug) => {
  try {
    const domainName = 'menuview.app';
    const authHeader = 'Basic ' + Buffer.from(`${NAMECOM_USERNAME}:${NAMECOM_TOKEN}`).toString('base64');

    const response = await fetch(`${API_URL}/v4/domains/${domainName}/records`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        host: slug,
        type: 'CNAME',
        answer: 'menuview.app.', // Importante el punto final en CNAMEs si lo requiere Name.com, pero en general apunta a root
        ttl: 300
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Si el registro ya existe, Name.com puede devolver un error. Lo manejamos.
      console.error('Name.com API Error:', data);
      if (data.message && data.message.includes('already exists')) {
        return { success: true, message: 'Subdomain already exists', data };
      }
      return { success: false, message: data.message || 'Error creating subdomain' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Name.com integration error:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  createSponsorSubdomain
};
