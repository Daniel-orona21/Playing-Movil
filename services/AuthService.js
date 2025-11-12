import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Linking } from 'react-native';

// Read API base URL from Expo env or fallback to LAN IP if provided
// Asegurarse de que siempre termine en /api/auth
const getAuthApiUrl = () => {
  let base = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  // Remover /auth si existe
  base = base.replace(/\/auth$/, '');
  // Asegurar que tenga /api
  if (!base.endsWith('/api')) {
    base = base + '/api';
  }
  // Agregar /auth
  return base + '/auth';
};

const API_URL = getAuthApiUrl();

// Configurar WebBrowser
WebBrowser.maybeCompleteAuthSession();

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;
  }

  async signInWithGoogle() {
    try {
      // iOS: usar el método original con deep links (funciona perfecto)
      if (Platform.OS === 'ios') {
        const backendRedirectUri = (process.env.EXPO_PUBLIC_SERVER_PUBLIC_URL || 'http://localhost:3000') + '/auth/callback';
        const appRedirectUri = AuthSession.makeRedirectUri({
          scheme: 'playingmovil',
          path: 'auth/callback',
        });
        
        // URL de autorización de Google
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${this.getGoogleClientId()}&` +
          `redirect_uri=${encodeURIComponent(backendRedirectUri)}&` +
          `response_type=code&` +
          `scope=openid%20profile%20email&` +
          `access_type=offline&` +
          `prompt=select_account`;

        // Abrir el navegador para autenticación
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          appRedirectUri
        );

        if (result.type === 'success' && result.url) {
          // Extraer el código de autorización de la URL
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          
          if (code) {
            // Enviar código al backend para autenticación
            const response = await this.authenticateWithBackend(code);
            
            if (response.success) {
              await this.storeAuthData(response.token, response.user);
              return { success: true, user: response.user };
            } else {
              throw new Error(response.error || 'Error en autenticación');
            }
          } else {
            throw new Error('No se recibió el código de autorización');
          }
        } else {
          throw new Error('Error en la autenticación de Google');
        }
      }
      
      // Android: usar método de polling (evita problemas con deep links)
      const SERVER_BASE = process.env.EXPO_PUBLIC_SERVER_PUBLIC_URL || 'http://localhost:3000';
      
      // 1. Obtener un sessionId del backend
      const startResponse = await fetch(`${SERVER_BASE}/auth/start`);
      const startData = await startResponse.json();
      
      if (!startData.success || !startData.sessionId) {
        throw new Error('Error al iniciar sesión');
      }
      
      const sessionId = startData.sessionId;
      const backendRedirectUri = `${SERVER_BASE}/auth/callback`;
      
      // 2. Abrir navegador con Google OAuth usando sessionId como state
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.getGoogleClientId()}&` +
        `redirect_uri=${encodeURIComponent(backendRedirectUri)}&` +
        `response_type=code&` +
        `scope=openid%20profile%20email&` +
        `access_type=offline&` +
        `prompt=select_account&` +
        `state=${encodeURIComponent(sessionId)}`;

      // Abrir navegador (no esperamos el resultado aquí)
      await WebBrowser.openBrowserAsync(authUrl, {
        showInRecents: true,
      });

      // 3. Hacer polling al backend para obtener el código
      let code = null;
      const maxAttempts = 60; // 60 intentos = 30 segundos máximo
      const pollInterval = 500; // 500ms entre intentos
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        try {
          const checkResponse = await fetch(`${SERVER_BASE}/auth/check/${sessionId}`);
          const checkData = await checkResponse.json();
          
          if (checkData.success && checkData.code) {
            code = checkData.code;
            break;
          }
        } catch (pollError) {
          console.error('Error en polling:', pollError);
        }
      }
      
      if (!code) {
        throw new Error('Tiempo de espera agotado. Por favor, intenta de nuevo.');
      }
      
      // 4. Autenticar con el código obtenido
      const response = await this.authenticateWithBackend(code);
      
      if (response.success) {
        await this.storeAuthData(response.token, response.user);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.error || 'Error en autenticación');
      }
    } catch (error) {
      console.error('Error en signInWithGoogle:', error);
      throw error;
    }
  }

  getGoogleClientId() {
    // Obtener el Client ID desde variables de entorno o configuración
    return process.env.GOOGLE_CLIENT_ID || '990138169107-7blqi2dlp5ov4t8d48at1d9vjll4nose.apps.googleusercontent.com';
  }


  async authenticateWithBackend(code) {
    try {
      const url = `${API_URL}/google/cliente`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        const text = await response.text();
        console.error('Error: Respuesta no es JSON:', text.substring(0, 200));
        throw new Error('Respuesta del servidor no es JSON');
      }
    } catch (error) {
      console.error('Error en authenticateWithBackend:', error);
      throw error;
    }
  }


  async storeAuthData(token, user) {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      this.token = token;
      this.currentUser = user;
    } catch (error) {
      console.error('Error almacenando datos de autenticación:', error);
      throw error;
    }
  }

  async loadStoredAuth() {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      
      if (token && user) {
        this.token = token;
        this.currentUser = JSON.parse(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cargando datos almacenados:', error);
      return false;
    }
  }

  async signOut() {
    try {
      // Notificar al backend (best-effort)
      try {
        if (this.token) {
          // limpiar relación de mesa activa
          try {
            // Obtener API_BASE sin /auth
            const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
            await fetch(`${API_BASE}/establecimientos/leave`, { method: 'POST', headers: { 'Authorization': `Bearer ${this.token}` } });
          } catch {}
          await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
            },
          });
        }
      } catch (e) {
        // Ignorar errores del backend en logout; proceder localmente
      }

      // Limpiar datos locales
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      this.token = null;
      this.currentUser = null;
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    }
  }

  isAuthenticated() {
    return !!this.token && !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getToken() {
    return this.token;
  }

  async verifyToken() {
    if (!this.token) {
      throw new Error('No hay token disponible');
    }

    try {
      const url = `${API_URL}/profile`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        const text = await response.text();
        // console.error('Error: Verify response no es JSON:', text.substring(0, 200));
        throw new Error('Respuesta del servidor no es JSON');
      }
    } catch (error) {
      // console.error('Error verificando token:', error);
      throw error;
    }
  }

  async getProfile() {
    try {
      // Cargar token si no está en memoria
      if (!this.token) {
        await this.loadStoredAuth();
      }

      if (!this.token) {
        throw new Error('No hay token disponible');
      }

      const url = `${API_URL}/profile`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (data.success && data.user) {
          // Actualizar datos locales
          this.currentUser = data.user;
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          return data.user;
        } else {
          throw new Error(data.error || 'Error al obtener perfil');
        }
      } else {
        const text = await response.text();
        console.error('Error: Response no es JSON:', text.substring(0, 200));
        throw new Error('Respuesta del servidor no es JSON');
      }
    } catch (error) {
      console.error('Error en getProfile:', error);
      throw error;
    }
  }
}

export default new AuthService();
