import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

export default function HistorialScreen() {
  return (
    <View>
      <Text style={styles.texto}>HistorialScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  texto: {
    color: 'white',
  },
});