import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MusicaScreen from './MusicaScreen';
import JuegoScreen from './JuegoScreen';
import OrdenesScreen from './OrdenesScreen';
import AjustesScreen from './AjustesScreen';
import { Colors } from '../constants/Colors';

const Tab = createBottomTabNavigator();

const LayoutScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = React.useState('Música');
  const [displayedTab, setDisplayedTab] = React.useState('Música');
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const handleTabChange = (newTab) => {
    // No permitir seleccionar el tab que ya está activo
    if (activeTab === newTab) {
      return;
    }
    
    // Cambiar el tab inmediatamente (sin animación)
    setActiveTab(newTab);
    
    // Animación del contenido: fade out, cambio de contenido, fade in
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Cambiar el contenido cuando está invisible
      setDisplayedTab(newTab);
      // Fade in del nuevo contenido
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const renderScreen = () => {
    switch (displayedTab) {
      case 'Música':
        return <MusicaScreen />;
      case 'Juego':
        return <JuegoScreen />;
      case 'Ordenes':
        return <OrdenesScreen />;
      case 'Ajustes':
        return <AjustesScreen />;
      default:
        return <JuegoScreen />;
    }
  };

  const TabButton = ({ tabName, iconName, label, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        isSelected ? styles.tabButtonSelected : styles.tabButtonUnselected
      ]}
      onPress={onPress}
    >
      <Ionicons 
        name={iconName} 
        size={20} 
        color="white" 
      />
      <Text style={styles.tabLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
        {renderScreen()}
      </Animated.View>
      
      <View style={styles.tabBar}>
        <View style={styles.mainTabsContainer}>
            <TabButton
              tabName="Juego"
              iconName="dice"
              label="Juego"
              isSelected={activeTab === 'Juego'}
              onPress={() => handleTabChange('Juego')}
            />
          <TabButton
            tabName="Música"
            iconName="musical-notes"
            label="Música"
            isSelected={activeTab === 'Música'}
            onPress={() => handleTabChange('Música')}
          />
          <TabButton
            tabName="Ordenes"
            iconName="document-text"
            label="Orden"
            isSelected={activeTab === 'Ordenes'}
            onPress={() => handleTabChange('Ordenes')}
          />
        </View>

        {/* Botón de Ajustes separado */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={[
              styles.settingsButton,
              activeTab === 'Ajustes' ? styles.settingsButtonSelected : styles.settingsButtonUnselected
            ]}
            onPress={() => handleTabChange('Ajustes')}
          >
            <Ionicons 
              name="settings" 
              size={20} 
              color="white" 
            />
            <Text style={styles.tabLabel}>Ajustes</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fondo,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.tab,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 4,
    flex: 1,
    marginRight: 10,
  },
  settingsContainer: {
    // Contenedor para el botón de ajustes separado
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  tabButtonSelected: {
    backgroundColor: Colors.tab,
    // backgroundColor: 'red',
  },
  tabButtonUnselected: {
    backgroundColor: 'transparent',
  },
  settingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 80,
  },
  settingsButtonSelected: {
      backgroundColor: Colors.tabSeleccionado,
    },
    settingsButtonUnselected: {
      backgroundColor: Colors.tab,
  },
  tabLabel: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Michroma-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default LayoutScreen;
