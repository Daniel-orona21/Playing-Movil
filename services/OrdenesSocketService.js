import { io } from 'socket.io-client';

// Obtener la URL base sin trailing slashes ni rutas adicionales
const getApiBase = () => {
  let base = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api');
  // Remover /api y /auth si existen
  base = base.replace(/\/api$/, '').replace(/\/auth$/, '');
  // Remover trailing slash si existe
  base = base.replace(/\/$/, '');
  return base;
};

const API_BASE = getApiBase();
const API_URL = `${API_BASE}/api`;

class OrdenesSocketService {
  constructor() {
    this.socket = null;
    this.establecimientoId = null;
    this.listeners = {
      orden_created: [],
      orden_updated: [],
      ordenes_deleted: []
    };
  }

  /**
   * Conectar al servidor de Socket.IO y unirse a la sala del establecimiento
   * @param {number} establecimientoId - ID del establecimiento
   */
  connect(establecimientoId) {
    if (this.socket && this.establecimientoId === establecimientoId) {
      return;
    }
    
    // Desconectar socket anterior si existe
    if (this.socket) {
      this.disconnect();
    }

    this.establecimientoId = establecimientoId;
    
    // Crear conexión de socket con configuración mejorada
    this.socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      path: '/socket.io/',
      autoConnect: true,
      forceNew: true
    });

    // Event handlers
    this.socket.on('connect', () => {
      this.socket.emit('join_establecimiento', establecimientoId);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión de órdenes:', error.message);
    });

    // Escuchar eventos de órdenes
    this.socket.on('orden_created', (data) => {
      this.emitToListeners('orden_created', data);
    });

    this.socket.on('orden_updated', (data) => {
      this.emitToListeners('orden_updated', data);
    });

    this.socket.on('ordenes_deleted', (data) => {
      this.emitToListeners('ordenes_deleted', data);
    });
  }

  /**
   * Desconectar del servidor de Socket.IO
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.establecimientoId = null;
      // Limpiar todos los listeners
      Object.keys(this.listeners).forEach(event => {
        this.listeners[event] = [];
      });
    }
  }

  /**
   * Registrar un listener para un evento específico
   * @param {string} event - Nombre del evento
   * @param {function} callback - Función callback
   * @returns {function} Función para remover el listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      console.warn(`Evento no reconocido: ${event}`);
      return () => {};
    }

    this.listeners[event].push(callback);
    
    // Retornar función para remover el listener
    return () => {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    };
  }

  /**
   * Emitir evento a todos los listeners registrados
   * @param {string} event - Nombre del evento
   * @param {any} data - Datos del evento
   */
  emitToListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener de ${event}:`, error);
        }
      });
    }
  }

  /**
   * Verificar si está conectado
   * @returns {boolean}
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Obtener ID del establecimiento actual
   * @returns {number|null}
   */
  getEstablecimientoId() {
    return this.establecimientoId;
  }

  /**
   * Obtener las órdenes del usuario actual
   * @param {string} token - Token de autenticación
   * @returns {Promise}
   */
  async getOrdenesUsuario(token) {
    try {
      const url = `${API_URL}/ordenes/usuario`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener órdenes del usuario:', error);
      throw error;
    }
  }
}

export default new OrdenesSocketService();

