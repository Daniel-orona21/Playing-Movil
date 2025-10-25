import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../../services/AuthService';

export default function BusquedaScreen({ onShowModalChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [genres, setGenres] = useState([]);
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [genreSongs, setGenreSongs] = useState([]);
  const [artistSongs, setArtistSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [establecimientoId, setEstablecimientoId] = useState(null);
  const searchTimeout = useRef(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Cargar establecimientoId al inicio
  useEffect(() => {
    const fetchEstablecimientoId = async () => {
      try {
        await AuthService.loadStoredAuth();
        if (AuthService.isAuthenticated()) {
          const res = await AuthService.verifyToken();
          if (res && res.success && res.user && res.user.mesa_id_activa) {
            const token = await AsyncStorage.getItem('token');
            
            const mesaRes = await fetch(`${API_URL}/establecimientos/mesa/${res.user.mesa_id_activa}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (mesaRes.ok) {
              const mesaData = await mesaRes.json();
              if (mesaData.success && mesaData.mesa) {
                setEstablecimientoId(mesaData.mesa.establecimiento_id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error obteniendo establecimiento:', error);
      }
    };

    fetchEstablecimientoId();
  }, []);

  // Cargar géneros
  useEffect(() => {
    const loadGenres = async () => {
      if (!establecimientoId) return;
      
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${API_URL}/musica/genres?establecimientoId=${establecimientoId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.genres) {
            setGenres(data.genres);
          }
        }
      } catch (error) {
        console.error('Error cargando géneros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGenres();
  }, [establecimientoId]);

  // Búsqueda con debounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchTerm.trim().length === 0) {
      setSongs([]);
      setArtists([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      await searchTracksAndArtists();
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, establecimientoId]);

  const searchTracksAndArtists = async () => {
    if (!establecimientoId) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/musica/search?q=${encodeURIComponent(searchTerm)}&establecimientoId=${establecimientoId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSongs(data.tracks || []);
          setArtists(data.artists || []);
        }
      }
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleGenrePress = async (genreName) => {
    setSelectedGenre(genreName);
    setSearchTerm('');
    setSongs([]);
    setArtists([]);
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/musica/genres/${encodeURIComponent(genreName)}/tracks?establecimientoId=${establecimientoId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.blocked) {
            // Género bloqueado por el establecimiento
            Alert.alert(
              'Género no disponible',
              data.message || 'Este género está bloqueado por el establecimiento',
              [{ text: 'OK', onPress: () => handleBackToGenres() }]
            );
          } else {
            setGenreSongs(data.tracks || []);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando canciones del género:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArtistPress = async (artist) => {
    setSelectedArtist(artist);
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/musica/artists/${encodeURIComponent(artist.spotify_id)}/tracks?establecimientoId=${establecimientoId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.blocked) {
            // Artista bloqueado por el establecimiento
            Alert.alert(
              'Artista no disponible',
              data.message || 'Este artista está bloqueado por el establecimiento',
              [{ text: 'OK', onPress: () => handleBackToResults() }]
            );
          } else {
            setArtistSongs(data.tracks || []);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando canciones del artista:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToGenres = () => {
    setSelectedGenre(null);
    setGenreSongs([]);
  };

  const handleBackToResults = () => {
    setSelectedArtist(null);
    setArtistSongs([]);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSongs([]);
    setArtists([]);
  };

  const handleSongPress = (song) => {
    if (onShowModalChange) {
      onShowModalChange(true, song);
    }
  };

  // Vista de canciones de artista
  if (selectedArtist) {
    return (
      <View style={styles.contenido}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToResults} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.artistHeaderInfo}>
            {selectedArtist.imagen_url ? (
              <Image 
                source={{ uri: selectedArtist.imagen_url }} 
                style={styles.artistHeaderImage}
              />
            ) : (
              <View style={styles.artistHeaderImage}>
                <Ionicons name="person" size={30} color="gray" />
              </View>
            )}
            <Text style={styles.artistHeaderName}>{selectedArtist.nombre}</Text>
          </View>
        </View>
        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={loading ? styles.scrollContentLoading : null}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.loadingText}>Cargando...</Text>
                  </View>
          ) : (
            <View style={styles.resultsContainer}>
              {artistSongs.map((song, index) => (
                <TouchableOpacity 
                  key={`${song.spotify_id}-${index}`} 
                  onPress={() => handleSongPress(song)} 
                  style={styles.songResultButtonWrapper}
                >
                  <BlurView intensity={50} tint='dark' style={styles.songResultButton}>
                    {song.imagen_url ? (
                      <Image 
                        source={{ uri: song.imagen_url }} 
                        style={styles.portada}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.portada}>
                        <MaterialIcons name="music-note" size={15} color="gray" />
                      </View>
                    )}
                    <View style={styles.infoCancion}>
                      <Text style={styles.songTitle} numberOfLines={1}>{song.titulo}</Text>
                      <Text style={styles.songArtist} numberOfLines={1}>{song.artista}</Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))}
              {artistSongs.length === 0 && (
                <Text style={styles.noResultsText}>No se encontraron canciones</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Vista de canciones por género
  if (selectedGenre) {
    return (
      <View style={styles.contenido}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToGenres} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.genreTitle}>{selectedGenre}</Text>
        </View>
        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={loading ? styles.scrollContentLoading : null}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.loadingText}>Cargando...</Text>
                  </View>
          ) : (
            <View style={styles.resultsContainer}>
              {genreSongs.map((song, index) => (
                <TouchableOpacity 
                  key={`${song.spotify_id}-${index}`} 
                  onPress={() => handleSongPress(song)} 
                  style={styles.songResultButtonWrapper}
                >
                  <BlurView intensity={50} tint='dark' style={styles.songResultButton}>
                    {song.imagen_url ? (
                      <Image 
                        source={{ uri: song.imagen_url }} 
                        style={styles.portada}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.portada}>
                        <MaterialIcons name="music-note" size={15} color="gray" />
                      </View>
                    )}
                    <View style={styles.infoCancion}>
                      <Text style={styles.songTitle} numberOfLines={1}>{song.titulo}</Text>
                      <Text style={styles.songArtist} numberOfLines={1}>{song.artista}</Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))}
              {genreSongs.length === 0 && (
                <Text style={styles.noResultsText}>No se encontraron canciones en este género</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Vista principal (géneros o resultados de búsqueda)
  return (
    <View style={styles.contenido}>
      <BlurView intensity={15} style={styles.blurContainer}>
      <Ionicons style={styles.iconoBuscar} name="search-outline" size={20} color={'white'} />
      <TextInput
        placeholder="Buscar..."
        placeholderTextColor="rgba(255,255,255,0.6)"
        style={styles.input}
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {searchTerm !== '' && (
        <TouchableOpacity onPress={handleClearSearch}>
          <Ionicons style={styles.iconoBuscar} name="close" size={20} color={'white'} />
        </TouchableOpacity>
      )}
    </BlurView>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={(searching || loading) ? styles.scrollContentLoading : null}
      >
      {searchTerm !== '' ? (
          // Resultados de búsqueda
          <View style={styles.searchResultsContainer}>
            {searching ? (
              <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.loadingText}>Buscando...</Text>
                  </View>
            ) : (
              <>
                {/* Artistas */}
                {artists.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Artistas</Text>
                    <View style={styles.artistsContainer}>
                      {artists.map((artist, index) => (
                        <TouchableOpacity
                          key={`${artist.spotify_id}-${index}`}
                          onPress={() => handleArtistPress(artist)}
                          style={styles.artistCard}
                        >
                          <BlurView intensity={0} tint='dark' style={styles.artistCardBlur}>
                            {artist.imagen_url ? (
                              <Image 
                                source={{ uri: artist.imagen_url }} 
                                style={styles.artistImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.artistImage}>
                                <Ionicons name="person" size={40} color="gray" />
              </View>
                            )}
                            <Text style={styles.artistName} numberOfLines={2}>{artist.nombre}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
          </View>
                )}

                {/* Canciones */}
                {songs.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Canciones</Text>
                    <View style={styles.resultsContainer}>
                      {songs.map((song, index) => (
                        <TouchableOpacity 
                          key={`${song.spotify_id}-${index}`} 
                          onPress={() => handleSongPress(song)} 
                          style={styles.songResultButtonWrapper}
                        >
                          <BlurView intensity={50} tint='dark' style={styles.songResultButton}>
                            {song.imagen_url ? (
                              <Image 
                                source={{ uri: song.imagen_url }} 
                                style={styles.portada}
                                resizeMode="cover"
                              />
                            ) : (
              <View style={styles.portada}>
              <MaterialIcons name="music-note" size={15} color="gray" />
              </View>
                            )}
                <View style={styles.infoCancion}>
                              <Text style={styles.songTitle} numberOfLines={1}>{song.titulo}</Text>
                              <Text style={styles.songArtist} numberOfLines={1}>{song.artista}</Text>
                  </View>
              </BlurView>
            </TouchableOpacity>
          ))}
                    </View>
                  </View>
                )}

                {songs.length === 0 && artists.length === 0 && (
                  <Text style={styles.noResultsText}>No se encontraron resultados para "{searchTerm}"</Text>
                )}
              </>
          )}
        </View>
      ) : (
          // Géneros
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.loadingText}>Cargando...</Text>
                  </View>
            ) : (
        <View style={styles.genresContainer}>
                {genres.map((genre, index) => (
                  <TouchableOpacity 
                    key={`${genre}-${index}`} 
                    onPress={() => handleGenrePress(genre)} 
                    style={styles.genreButtonWrapper}
                  >
                    <BlurView intensity={30} style={styles.genreButton}>
                      <Text style={styles.genreText}>{genre.charAt(0).toUpperCase() + genre.slice(1)}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
            )}
          </>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: {
    flex: 1,
    gap: 20,
  },
  blurContainer: {
    backgroundColor: Colors.tab,
    borderWidth: 1,
    borderColor: Colors.tabBorde,
    borderRadius: 99,
    padding: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    color: 'white',
    flex: 1,
    fontFamily: 'Onest-Regular', 
  },
  iconoBuscar: {
    // Icon styling
  },
  scroll: {
    flex: 1,
  },
  scrollContentLoading: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginVertical: 40,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: 10, 
  },
  genreButtonWrapper: {
    width: '48%',
  },
  genreButton: {
    backgroundColor: Colors.tab,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 15,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  genreText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Onest-Bold', 
  },
  searchResultsContainer: {
    gap: 20,
  },
    loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    color: Colors.textoSecundario,
    fontSize: 16,
    fontFamily: 'Onest-Regular',
  },
  sectionContainer: {
    gap: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Onest-Bold',
    marginLeft: 5,
  },
  artistsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  artistCard: {
    width: '48%',
  },
  artistCardBlur: {
    backgroundColor: 'transparent',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.tabSeleccionado,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artistName: {
    color: Colors.textoPrincipal,
    fontSize: 14,
    fontFamily: 'Onest-Bold',
    textAlign: 'center',
  },
  resultsContainer: {
    gap: 10,
  },
  songResultButtonWrapper: {
    borderRadius: 10,
  },
  songResultButton: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  portada: {
    backgroundColor: Colors.tabSeleccionado,
    aspectRatio: 1/1,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  infoCancion: {
    flex: 1,
  },
  songTitle: {
    color: Colors.textoPrincipal,
    fontSize: 16,
    fontFamily: 'Onest-Bold',
  },
  songArtist: {
    color: Colors.textoSecundario,
    fontSize: 14,
    fontFamily: 'Onest-Regular',
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  genreTitle: {
    color: 'white',
    flex: 1,
    textTransform: 'capitalize',
    fontSize: 24,
    fontFamily: 'Onest-Bold',
  },
  artistHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  artistHeaderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.tabSeleccionado,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artistHeaderName: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Onest-Bold',
    flex: 1,
  },
  noResultsText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
    textAlign: 'center',
    marginTop: 40,
  },
});
