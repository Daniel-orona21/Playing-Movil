import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

export default function BusquedaScreen() {
  return (
    <View>
      <Text style={styles.texto}>BusquedaScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  texto: {
    color: 'white',
  },
});