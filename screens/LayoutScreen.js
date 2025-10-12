import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import MusicaScreen from './MusicaScreen';
import JuegoScreen from './JuegoScreen';
import OrdenesScreen from './OrdenesScreen';
import AjustesScreen from './AjustesScreen';
import { Colors } from '../constants/Colors';
import { BlurView } from 'expo-blur';

const Tab = createBottomTabNavigator();

const LayoutScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = React.useState('Música');
  const [displayedTab, setDisplayedTab] = React.useState('Música');
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const imageFadeAnim = React.useRef(new Animated.Value(1)).current;

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

    // Animación de la imagen de fondo
    if (newTab === 'Música') {
      // Si va a música, hacer fade in de la imagen
      Animated.timing(imageFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Si va a otro tab, hacer fade out de la imagen
      Animated.timing(imageFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
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
        color={isSelected ? Colors.secundario : 'white'} 
      />
      <Text style={[styles.tabLabel, { color: isSelected ? Colors.secundario : 'white' }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('../assets/imagenes/logo-7.png')} 
        style={[styles.backgroundImage, { opacity: imageFadeAnim }]}
        resizeMode="cover"
      />
      
      <BlurView intensity={0} style={styles.blurContainer}>
        <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
          {renderScreen()}
        </Animated.View>

        <View style={styles.tabBar}>
        <BlurView intensity={15} style={styles.mainTabsContainer}>
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
        </BlurView>

        {/* Botón de Ajustes separado */}
        <BlurView intensity={15} style={styles.settingsContainer}>
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
              color={activeTab === 'Ajustes' ? Colors.secundario : 'white'} 
            />
            <Text style={[styles.tabLabel, { color: activeTab === 'Ajustes' ? Colors.secundario : 'white' }]}>Ajustes</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
      </BlurView>
      
      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    transform: [
      {scale: 1.1}
    ],
    left: 0,
    right: 0,
    bottom: 0,
    width: '110%',
    height: '150%',
    // zIndex: -1,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: Colors.fondo,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 40,
  },
  tabBar: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.tab,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.tabBorde,
    paddingVertical: 4,
    paddingHorizontal: 4,
    flex: 1,
    marginRight: 10,
    overflow: 'hidden'
  },
  settingsContainer: {
    borderRadius: 99,
    overflow: 'hidden',
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
    backgroundColor: Colors.tabSeleccionado,
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
    borderColor: Colors.tabBorde,
    minWidth: 80,
  },
  settingsButtonSelected: {
      backgroundColor: Colors.tabSeleccionado,
    },
    settingsButtonUnselected: {
      backgroundColor: Colors.tab,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Michroma-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default LayoutScreen;
