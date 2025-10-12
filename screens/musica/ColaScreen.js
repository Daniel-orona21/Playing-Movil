import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

export default function ColaScreen() {
  return (
    <View>
      <Text style={styles.texto}>ColaScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  texto: {
    color: 'white',
  },
});