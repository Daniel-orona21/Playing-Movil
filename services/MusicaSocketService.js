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

class MusicaSocketService {
  constructor() {
    this.socket = null;
    this.establecimientoId = null;
    this.listeners = {
      playback_update: [],
      track_started: [],
      track_ended: [],
      playback_state_change: [],
      playback_progress: [],
      queue_update: []
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
      transports: ['websocket', 'polling'], // Intentar websocket primero, luego polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      path: '/socket.io/', // Path explícito
      autoConnect: true,
      forceNew: true
    });

    // Event handlers
    this.socket.on('connect', () => {
      // Unirse a la sala del establecimiento
      this.socket.emit('join_establecimiento', establecimientoId);
    });

    this.socket.on('connect_error', (error) => {
      // console.error('Error de conexión:', error.message);
    });

    // Escuchar eventos de reproducción
    this.socket.on('playback_update', (data) => {
      this.emitToListeners('playback_update', data);
    });

    this.socket.on('track_started', (data) => {
      this.emitToListeners('track_started', data);
    });

    this.socket.on('track_ended', (data) => {
      this.emitToListeners('track_ended', data);
    });

    this.socket.on('playback_state_change', (data) => {
      this.emitToListeners('playback_state_change', data);
    });

    this.socket.on('playback_progress', (data) => {
      this.emitToListeners('playback_progress', data);
    });

    this.socket.on('queue_update', (data) => {
      this.emitToListeners('queue_update', data);
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
}

export default new MusicaSocketService();

