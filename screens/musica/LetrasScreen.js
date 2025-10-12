import { StyleSheet, View, Text } from 'react-native'
import React from 'react'


export default function LetrasScreen() {
    return (
        <View>
            <Text style={styles.texto}>LetrasScreen</Text>
        </View>
  )
}

const styles = StyleSheet.create({
  texto: {
    color: 'white',
  },
});