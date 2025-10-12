import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';

const Toast = ({ message, visible, onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Opacidad
  const slideAnim = useRef(new Animated.Value(0)).current; // Posición vertical

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => onHide && onHide());
        }, 1000);
      });
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim, slideAnim, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.toastMessage}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 99,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  toastMessage: {
    color: 'black',
    fontSize: 14,
    fontFamily: 'Onest-Regular',
    textAlign: 'center',
  },
});

export default Toast;
