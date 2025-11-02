import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* use vector icon as the splash visual */}
        <MaterialCommunityIcons name="cash-multiple" size={140} color="#fff" />

        <Text style={styles.title}>Budget Buddy</Text>
        <Text style={styles.subtitle}>Manage your money, effortlessly</Text>
      </View>

      <Text style={styles.powered}>Powered by Budget Buddy™</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 20,
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
  powered: {
    color: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    bottom: 18,
    fontSize: 12,
  },
});

export default SplashScreen;
