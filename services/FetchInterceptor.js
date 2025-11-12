/**
 * Interceptor global para fetch
 * Agrega automáticamente los headers necesarios para ngrok y otras configuraciones
 */

const originalFetch = global.fetch;

// Lista de headers comunes para ngrok y otros servicios
const defaultHeaders = {
  'ngrok-skip-browser-warning': 'true', // Salta la advertencia de ngrok
  'User-Agent': 'PlayingMovil/1.0',
};

// Interceptor de fetch
global.fetch = async (url, options = {}) => {
  // Combinar headers existentes con los por defecto
  const enhancedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await originalFetch(url, enhancedOptions);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export default {
  // Función para resetear fetch a su estado original si es necesario
  restore: () => {
    global.fetch = originalFetch;
  }
};

