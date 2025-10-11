import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MusicaScreen from './MusicaScreen';
import JuegoScreen from './JuegoScreen';
import OrdenesScreen from './OrdenesScreen';
import AjustesScreen from './AjustesScreen';
import { Colors } from '../constants/Colors';

const Tab = createBottomTabNavigator();

const LayoutScreen = ({ navigation }) => {
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Musica') {
              iconName = focused ? 'musical-notes' : 'musical-notes-outline';
            } else if (route.name === 'Juego') {
              iconName = focused ? 'game-controller' : 'game-controller-outline';
            } else if (route.name === 'Ordenes') {
              iconName = focused ? 'restaurant' : 'restaurant-outline';
            } else if (route.name === 'Ajustes') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
          tabBarStyle: {
            backgroundColor: Colors.fondo,
            borderTopColor: 'rgba(255, 255, 255, 0.2)',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontFamily: 'Onest-Regular',
            fontSize: 12,
            marginTop: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Musica" 
          component={MusicaScreen}
          options={{
            title: 'Música',
          }}
        />
        <Tab.Screen 
          name="Juego" 
          component={JuegoScreen}
          options={{
            title: 'Juegos',
          }}
        />
        <Tab.Screen 
          name="Ordenes" 
          component={OrdenesScreen}
          options={{
            title: 'Órdenes',
          }}
        />
        <Tab.Screen 
          name="Ajustes" 
          component={AjustesScreen}
          options={{
            title: 'Ajustes',
          }}
        />
      </Tab.Navigator>
      <StatusBar style="light" />
    </>
  );
};

export default LayoutScreen;
