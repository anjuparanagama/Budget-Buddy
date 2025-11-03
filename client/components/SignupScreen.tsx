import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  ScrollView,
  StyleSheet,
} from 'react-native';

type Props = {
  onAuth: (token: string, user: any) => void;
  switchToLogin: () => void;
};

const BASE_URL = 'http://192.168.8.100:5000';

export const SignupScreen = ({ onAuth, switchToLogin }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return; // Prevent multiple submissions
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Signup failed', data.error || 'Unknown error');
        setLoading(false);
        return;
      }
      onAuth(data.token, data.user);
    } catch (e) {
      Alert.alert('Signup failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={[styles.decorTop, { pointerEvents: 'none' }]} />
      <View style={[styles.decorBottom, { pointerEvents: 'none' }]} />

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-lg">
          <View className="bg-white rounded-2xl p-6 shadow-lg">
            <Text className="text-3xl font-extrabold text-center text-slate-800 mb-1">Create account</Text>
            <Text className="text-center text-slate-500 mb-6">Sign up to continue to Budget Buddy</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              keyboardType="default"
              autoCapitalize="words"
              accessibilityLabel="Full name"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, backgroundColor: '#f9fafb' }}
              editable={true}
            />

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="username"
              accessibilityLabel="Email"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, backgroundColor: '#f9fafb' }}
              editable={true}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              textContentType="password"
              accessibilityLabel="Password"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, backgroundColor: '#f9fafb' }}
              editable={true}
            />

            <TouchableOpacity
              onPress={submit}
              accessibilityRole="button"
              className="bg-indigo-600 rounded-xl py-3 items-center mb-3"
            >
              <Text className="text-white font-semibold">{loading ? 'Creating...' : 'Create account'}</Text>
            </TouchableOpacity>

            <View className="flex-row justify-between items-center">
              <TouchableOpacity onPress={switchToLogin} className="py-2">
                <Text className="text-indigo-600 font-medium">Sign in</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Not implemented', 'Help/Privacy') } className="py-2">
                <Text className="text-slate-500">Help</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
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
  },
});

export default SignupScreen;
