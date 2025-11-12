import { registerRootComponent } from 'expo';

import App from './App';

// Importar el interceptor de fetch ANTES de cualquier otra cosa
import './services/FetchInterceptor';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
