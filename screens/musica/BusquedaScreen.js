import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const genres = [
  { id: '1', name: 'Pop' },
  { id: '2', name: 'Rock' },
  { id: '3', name: 'Reggaeton' },
  { id: '4', name: 'Rap' },
  { id: '5', name: 'Electrónica' },
  { id: '6', name: 'House' },
  { id: '7', name: 'Regional' },
  { id: '8', name: 'Urbano' },
  { id: '9', name: 'Urbano' },
  { id: '10', name: 'Urbano' },
  { id: '11', name: 'Urbano' },
  { id: '12', name: 'Urbano' },
  { id: '13', name: 'Urbano' },
];

const songs = [
  { id: 's1', title: 'Cancion Pop de Prueba', artist: 'Artista Pop', genre: 'Pop' },
  { id: 's2', title: 'Hit Rock Duro', artist: 'Banda Rock', genre: 'Rock' },
  { id: 's3', title: 'Ritmo Reggaeton', artist: 'Cantante Reggaeton', genre: 'Reggaeton' },
  { id: 's4', title: 'Flow de Rap', artist: 'MC Rap', genre: 'Rap' },
  { id: 's5', title: 'Beat Electronico', artist: 'DJ Electronica', genre: 'Electrónica' },
  { id: 's6', title: 'House Party', artist: 'House Master', genre: 'House' },
  { id: 's7', title: 'Melodia Regional', artist: 'Cantante Regional', genre: 'Regional' },
  { id: 's8', title: 'Urbano Total', artist: 'Artista Urbano', genre: 'Urbano' },
  { id: 's9', title: 'Pop Version 2', artist: 'Artista Pop', genre: 'Pop' },
  { id: 's10', title: 'Rock Alternativo', artist: 'Banda Rock', genre: 'Rock' },
];

export default function BusquedaScreen({
  onOpenAddSongModal
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [selectedGenre, setSelectedGenre] = React.useState(null);

  React.useEffect(() => {
    if (searchTerm === '') {
      setSearchResults([]);
      return;
    }
    const filteredSongs = songs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(filteredSongs);
  }, [searchTerm]);

  const handleGenrePress = (genreName) => {
    setSelectedGenre(genreName);
    setSearchTerm(''); // Limpiar el término de búsqueda al seleccionar un género
  };

  const handleBackToGenres = () => {
    setSelectedGenre(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

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
    <ScrollView style={styles.scroll}>
      {searchTerm !== '' ? (
        // Mostrar resultados de búsqueda si hay un término de búsqueda
        <View style={styles.resultsContainer}>
          {searchResults.map((song) => (
            <TouchableOpacity key={song.id} onPress={() => onOpenAddSongModal(song)} style={styles.songResultButtonWrapper}>
              <BlurView intensity={20} tint='dark' style={styles.songResultButton}>
              <View style={styles.portada}>
              <MaterialIcons name="music-note" size={15} color="gray" />
              </View>
              <View style={styles.infoCancion}>
                <Text style={styles.songTitle}>{song.title}</Text>
                <Text style={styles.songArtist}>{song.artist}</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
          {searchResults.length === 0 && (
            <Text style={styles.noResultsText}>No se encontraron canciones para "{searchTerm}"</Text>
          )}
        </View>
      ) : selectedGenre !== null ? (
        // Mostrar canciones de la categoría seleccionada si hay un género seleccionado
        <View style={styles.genreSongsContainer}>
          <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToGenres} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.genreTitle}>{selectedGenre}</Text>
          </View>
          {songs.filter(song => song.genre === selectedGenre).map((song) => (
            <TouchableOpacity key={song.id} onPress={() => onOpenAddSongModal(song)} style={styles.songResultButtonWrapper}>
              <BlurView intensity={20} tint='dark' style={styles.songResultButton}>
              <View style={styles.portada}>
              <MaterialIcons name="music-note" size={15} color="gray" />
              </View>
                <View style={styles.infoCancion}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songArtist}>{song.artist}</Text>
                  </View>
              </BlurView>
            </TouchableOpacity>
          ))}
          {songs.filter(song => song.genre === selectedGenre).length === 0 && (
            <Text style={styles.noResultsText}>No se encontraron canciones en la categoría "{selectedGenre}"</Text>
          )}
        </View>
      ) : (
        // Mostrar géneros si no hay término de búsqueda ni género seleccionado
        <View style={styles.genresContainer}>
          {genres.map((genre) => (
            <TouchableOpacity key={genre.id} onPress={() => handleGenrePress(genre.name)} style={styles.genreButtonWrapper}>
              <BlurView intensity={20} style={styles.genreButton}>
                <Text style={styles.genreText}>{genre.name}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  contenido: {
    // borderWidth: 1,
    // borderColor: 'lime',
    flex: 1,
    gap: 20,
  },
  blurContainer: {
    backgroundColor: Colors.tab,
    borderWidth: 1,
    borderColor: Colors.tabBorde,
    borderRadius: 99,
    display: 'flex',
    padding: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    color: 'white',
    flex: 1,
    fontFamily: 'Onest-Regular', 
  },
  scroll: {
    // borderWidth: 1,
    // borderColor: 'pink',
  },
  texto: {
    color: 'white',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: 10, 
  },
  genreButton: {
    backgroundColor: Colors.tab,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 15,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  genreText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Onest-Bold', 
  },
  resultsContainer: {
    gap: 10
  },
  songResultButton: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  portada: {
    backgroundColor: Colors.tabSeleccionado,
    aspectRatio: 1/1,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10
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
  genreSongsContainer: {
    gap: 10,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  backButton: {
    aspectRatio: 1/1,
    justifyContent: 'center',
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  genreTitle: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Onest-Bold',
  },
  noResultsText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
    textAlign: 'center',
    marginTop: 10,
  },
  genreButtonWrapper: {
    width: '48%',
  },
  songResultButtonWrapper: {
    borderRadius: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: Colors.tab,
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.tabBorde,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Onest-Bold',
    marginBottom: 10,
  },
  modalMessage: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButtonCancel: {
    backgroundColor: Colors.tabBorde,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '40%',
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
  },
  modalButtonAdd: {
    backgroundColor: Colors.tab,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '40%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.tabBorde,
  },
  modalButtonTextAdd: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
  },
});