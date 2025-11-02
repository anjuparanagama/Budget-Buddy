import React, { useState } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';

type Props = {
  onAuth: (token: string, user: any) => void;
  switchToSignup: () => void;
};

const BASE_URL = 'http://192.168.8.101:5000';

export const LoginScreen = ({ onAuth, switchToSignup }: Props) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send identifier (email or username)
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Login failed', data.error || 'Unknown error');
        return;
      }
      onAuth(data.token, data.user);
    } catch (e) {
      Alert.alert('Login failed', String(e));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-full max-w-lg">
              <View className="bg-white rounded-2xl p-6 shadow-lg">
                <Text className="text-3xl font-extrabold text-center text-slate-800 mb-1">Welcome back</Text>
                <Text className="text-center text-slate-500 mb-6">Sign in to continue to Budget Buddy</Text>

                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="Email or username"
                  keyboardType="default"
                  autoCapitalize="none"
                  textContentType="username"
                  accessibilityLabel="Email or username"
                  className="border border-gray-200 rounded-xl px-4 py-3 mb-4 bg-gray-50"
                  editable={true}
                />

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry
                  textContentType="password"
                  accessibilityLabel="Password"
                  className="border border-gray-200 rounded-xl px-4 py-3 mb-4 bg-gray-50"
                  editable={true}
                />

                <TouchableOpacity
                  onPress={submit}
                  accessibilityRole="button"
                  className="bg-indigo-600 rounded-xl py-3 items-center mb-3"
                >
                  <Text className="text-white font-semibold">Sign in</Text>
                </TouchableOpacity>

                <View className="flex-row justify-between items-center">
                  <TouchableOpacity onPress={switchToSignup} className="py-2">
                    <Text className="text-indigo-600 font-medium">Create an account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Alert.alert('Not implemented', 'Forgot password flow') } className="py-2">
                    <Text className="text-slate-500">Forgot?</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  decorTop: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99,102,241,0.08)',
    top: -80,
    left: -60,
    transform: [{ rotate: '15deg' }],
    // allow touches to pass through decorative views
    pointerEvents: 'none',
  },
  decorBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59,130,246,0.06)',
    right: -40,
    bottom: -60,
    transform: [{ rotate: '-10deg' }],
    // allow touches to pass through decorative views
    pointerEvents: 'none',
  },
});

export default LoginScreen;
