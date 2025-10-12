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
import Toast from '../components/Toast'; 

const Tab = createBottomTabNavigator();

const LayoutScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = React.useState('Música');
  const [displayedTab, setDisplayedTab] = React.useState('Música');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const imageFadeAnim = React.useRef(new Animated.Value(0)).current;
  const [showMusicaAddSongModal, setShowMusicaAddSongModal] = React.useState(false);
  const [selectedSongForModal, setSelectedSongForModal] = React.useState(null);
  const overlayFadeAnim = React.useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');

  const handleShowMusicaAddSongModalChange = (isVisible, songData) => {
    setShowMusicaAddSongModal(isVisible);
    setSelectedSongForModal(songData);
  };

  const handleCancelAddSongGlobal = () => {
    setShowMusicaAddSongModal(false);
    setSelectedSongForModal(null);
  };

  const handleShowToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleHideToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  const handleAddSongGlobal = () => {
    console.log('Simulando agregar canción:', selectedSongForModal);
    handleShowToast(`"${selectedSongForModal ? selectedSongForModal.title : 'La canción'}" ha sido agregada.`);
    setShowMusicaAddSongModal(false);
    setSelectedSongForModal(null);
  };

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(imageFadeAnim, {
        toValue: activeTab === 'Música' ? 1 : 0, 
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); 

  React.useEffect(() => {
    Animated.timing(overlayFadeAnim, {
      toValue: showMusicaAddSongModal ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showMusicaAddSongModal, overlayFadeAnim]);

  const handleTabChange = (newTab) => {
    if (activeTab === newTab) {
      return;
    }
    
    setActiveTab(newTab);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(imageFadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(newTab);
      setDisplayedTab(newTab);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(imageFadeAnim, {
          toValue: newTab === 'Música' ? 1 : 0, 
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const renderScreen = () => {
    switch (displayedTab) {
      case 'Música':
        return <MusicaScreen onShowModalChange={handleShowMusicaAddSongModalChange} />;
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

  const contentScale = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const contentOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

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
        <Animated.View style={[styles.screenContainer, { opacity: contentOpacity, transform: [{ scale: contentScale }] }]}>
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

      <Animated.View 
        style={[styles.modalOverlay, { opacity: overlayFadeAnim }]} 
        pointerEvents={showMusicaAddSongModal ? 'auto' : 'none'} 
      >
        <BlurView intensity={40} tint='dark' style={[StyleSheet.absoluteFillObject, styles.modalOverlayCentered]}> 
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Agregar canción</Text>
            {selectedSongForModal && (
              <Text style={styles.modalMessage}>¿Agregar "{selectedSongForModal.title}" a la lista de reproducción?</Text>
            )}
            {!selectedSongForModal && (
              <Text style={styles.modalMessage}>¿Agregar canción a la lista de reproduccion?</Text>
            )}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity onPress={handleCancelAddSongGlobal} style={styles.modalButtonCancel}>
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddSongGlobal} style={styles.modalButtonAdd}>
                <Text style={styles.modalButtonTextAdd}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <Toast message={toastMessage} visible={showToast} onHide={handleHideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 60
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalOverlayCentered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 30,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Onest-Bold',
    color: 'black',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Onest-Regular',
    color: Colors.texto,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButtonCancel: {
    backgroundColor: Colors.botonSecundario,
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  modalButtonTextCancel: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
  },
  modalButtonAdd: {
    backgroundColor: 'black',
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  modalButtonTextAdd: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
  },
});

export default LayoutScreen;
