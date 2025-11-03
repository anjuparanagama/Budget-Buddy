import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  note?: string;
};

export const HomeScreen: React.FC<{ token?: string; onLogout?: () => void; initialUser?: any }> = ({ token, onLogout, initialUser }) => {
  // Base URL for the backend API. Change this when testing on device/emulator:
  // - Android emulator (Android Studio): use 10.0.2.2
  // - Expo on same machine (tunnel): use http://127.0.0.1:5000 or your LAN IP
  const BASE_URL = 'http://192.168.8.100:5000';
  const [formMode, setFormMode] = useState<'none' | 'expense' | 'income'>('none');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState(initialUser?.name ?? 'Guest User');
  const [userImage, setUserImage] = useState(initialUser?.image ?? 'https://i.pravatar.cc/100');
  const [activeQuick, setActiveQuick] = useState<'none' | 'expense' | 'income'>('none');

  const openForm = (mode: 'expense' | 'income') => {
    setFormMode(mode);
    setAmount('');
    setCategory('');
    setNote('');
    setActiveQuick(mode);
  };

  // Load transactions and user from backend on mount
  useEffect(() => {
    fetchTransactions();
    if (token) {
      fetchUser();
      fetchSummary();
    }
  }, [token]);

  // If parent provides an initialUser (from login/signup), prefer that immediately
  useEffect(() => {
    if (initialUser) {
      setUserName(initialUser.name || 'Guest User');
      setUserImage(initialUser.image || 'https://i.pravatar.cc/100');
    }
  }, [initialUser]);

  const fetchTransactions = async () => {
    try {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/api/transactions`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data || []);
      }
    } catch (e) {
      console.warn('Failed to load transactions', e);
    }
  };

  const fetchSummary = async () => {
    try {
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/api/summary`, { headers });
      if (res.ok) {
        const s = await res.json();
        // keep balance baseline as displayed by client
        // if you want to use server balance directly, set it here
      }
    } catch (e) {
      console.warn('Failed to load summary', e);
    }
  };

  const fetchUser = async () => {
    try {
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/api/user`, { headers });
      if (res.ok) {
        const u = await res.json();
        if (u) {
          setUserName(u.name || 'Guest User');
          setUserImage(u.image || 'https://i.pravatar.cc/100');
        }
      }
    } catch (e) {
      console.warn('Failed to load user', e);
    }
  };

  const saveUser = async () => {
    try {
      const payload = { name: userName, image: userImage };
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BASE_URL}/api/user`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) console.warn('Failed to save user', await res.text());
    } catch (e) {
      console.warn('Failed to save user', e);
    }
  };

  const saveTransaction = async (tx: Omit<Transaction, 'id'>) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // Use specific endpoints for income/expense so server routes match
      const endpoint = tx.type === 'income' ? '/api/income' : '/api/expense';
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: tx.amount, category: tx.category, note: tx.note }),
      });
      if (res.ok) {
        // Refresh local data after successful create
        await fetchTransactions();
        await fetchSummary();
      } else {
        Alert.alert('Error', 'Failed to save transaction. Please try again.');
        console.warn('Failed to save transaction', await res.text());
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction. Please check your connection and try again.');
      console.warn('Failed to save transaction', e);
    }
  };

  const removeTransaction = async (id: string) => {
    try {
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/api/transactions/${id}`, { method: 'DELETE', headers });
      if (res.ok) await fetchTransactions();
    } catch (e) {
      console.warn('Failed to delete transaction', e);
    }
  };

  const closeForm = () => {
    setFormMode('none');
    setActiveQuick('none');
  };

  const submit = async () => {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    if (!parsed || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0');
      return;
    }

    const tx: Omit<Transaction, 'id'> = {
      type: formMode === 'income' ? 'income' : 'expense',
      amount: parsed,
      category: category || undefined,
      note: note || undefined,
    };

    // send to backend and refresh list
    await saveTransaction(tx);
    closeForm();
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense; // preserve initial shown balance as baseline

  const theme = {
    background: darkMode ? '#0f172a' : '#ffffff',
    textPrimary: darkMode ? '#e5e7eb' : '#111827',
    muted: darkMode ? '#9ca3af' : '#6b7280',
    cardBg: darkMode ? '#0b1220' : '#ffffff',
    headerBg: darkMode ? '#0b2545' : '#2563EB',
    headerText: '#ffffff',
    navBg: darkMode ? '#020617' : '#ffffff',
    navActive: '#60a5fa',
    navInactive: '#9ca3af',
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="relative flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} style={{ backgroundColor: theme.background }}>
        <View style={{ backgroundColor: theme.headerBg }} className="px-6 pt-10 pb-12">
          <View className="flex-row justify-between items-center">
            <View>
              <Text style={{ color: theme.headerText }} className="text-2xl font-bold">Budget Buddy</Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }} className="mt-2">Track your spending and stay on budget</Text>
            </View>
            <View className="items-center">
              <Image source={{ uri: userImage }} style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 4 }} />
                <Text style={{ color: theme.headerText, fontSize: 12 }}>{userName}</Text>
            </View>
          </View>
        </View>

  {activeTab === 'home' ? (<>

        <View className="-mt-2 px-6">
          <View className="rounded-xl shadow-lg p-6" style={{ backgroundColor: theme.cardBg }}>
            <Text style={{ color: theme.muted }} className="text-sm">Total Balance</Text>
            <Text className="text-3xl font-bold mt-2" style={{ color: darkMode ? '#93c5fd' : '#2563EB' }}>Rs. {balance.toFixed(2)}</Text>

            <View className="flex-row mt-4 justify-between">
              <View>
                <Text className="text-sm" style={{ color: theme.muted }}>Income</Text>
                <Text className="text-lg font-semibold" style={{ color: '#16A34A' }}>Rs. {totalIncome.toFixed(2)}</Text>
              </View>
              <View>
                <Text className="text-sm" style={{ color: theme.muted }}>Expenses</Text>
                <Text className="text-lg font-semibold" style={{ color: '#EF4444' }}>Rs. {totalExpense.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 mt-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: theme.textPrimary }}>Quick Actions</Text>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => openForm('expense')}
              className="flex-1 rounded-lg p-4 items-center"
              style={{ backgroundColor: activeQuick === 'expense' ? '#2563EB' : '#ffffff', borderWidth: activeQuick === 'expense' ? 0 : 1, borderColor: '#DBEAFE' }}
            >
              <Text style={{ color: activeQuick === 'expense' ? '#ffffff' : '#2563EB', fontWeight: '600' }}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openForm('income')}
              className="flex-1 rounded-lg p-4 items-center"
              style={{ backgroundColor: activeQuick === 'income' ? '#2563EB' : '#ffffff', borderWidth: activeQuick === 'income' ? 0 : 1, borderColor: '#DBEAFE' }}
            >
              <Text style={{ color: activeQuick === 'income' ? '#ffffff' : '#2563EB', fontWeight: '600' }}>Add Income</Text>
            </TouchableOpacity>
          </View>
        </View>

        {formMode !== 'none' && (
          <View className="px-6 mt-6">
            <View className="bg-white rounded-lg shadow p-4">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                {formMode === 'expense' ? 'Add Expense' : 'Add Income'}
              </Text>

              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Amount (e.g. 12.50)"
                className="border border-gray-200 rounded-md px-3 py-2 mb-3"
              />

              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Category (optional)"
                className="border border-gray-200 rounded-md px-3 py-2 mb-3"
              />

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Note (optional)"
                className="border border-gray-200 rounded-md px-3 py-2 mb-3"
              />

              <View className="flex-row justify-between">
                <TouchableOpacity onPress={closeForm} className="px-4 py-2 rounded-md">
                  <Text className="text-blue-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submit} className="bg-blue-600 px-4 py-2 rounded-md">
                  <Text className="text-white">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View className="px-6 mt-6 mb-12">
          <Text className="text-lg font-semibold mb-3" style={{ color: theme.textPrimary }}>Recent Transactions</Text>

              {transactions.length === 0 ? (
            <View className="bg-white rounded-lg border border-gray-100 p-4">
              <Text className="text-gray-400">No transactions yet. Start by adding an expense.</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {transactions.map(tx => {
                const isIncome = tx.type === 'income';
                const color = isIncome ? '#16A34A' : '#EF4444';
                return (
                  <View
                    key={tx.id}
                    className="bg-white rounded-lg border border-gray-100 p-4 flex-row justify-between items-center"
                    style={{ borderLeftWidth: 4, borderLeftColor: color }}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name={isIncome ? 'arrow-down' : 'arrow-up'} size={18} color={color} style={{ marginRight: 10 }} />
                      <View>
                        <Text className="font-semibold" style={{ color: '#111827' }}>{tx.category || (isIncome ? 'Income' : 'Expense')}</Text>
                        {tx.note ? <Text className="text-gray-500 text-sm">{tx.note}</Text> : null}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text className="font-semibold" style={{ color }}>
                        Rs. {tx.amount.toFixed(2)}
                      </Text>
                      <TouchableOpacity onPress={() => removeTransaction(tx.id)} className="mt-2">
                        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </>) : (
          <View className="px-6 pt-6">
            <Text className="text-2xl font-bold mb-4" style={{ color: theme.textPrimary }}>Settings</Text>

            <View className="rounded-lg border border-gray-100 p-4 mb-4" style={{ backgroundColor: theme.cardBg }}>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>Appearance</Text>
                  <Text style={{ color: theme.muted, marginTop: 4 }}>Switch between light and dark themes</Text>
                </View>
                <Switch value={darkMode} onValueChange={setDarkMode} />
              </View>
            </View>

            <View className="rounded-lg border border-gray-100 p-4 mb-4" style={{ backgroundColor: theme.cardBg }}>
              <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>Profile</Text>
              <View className="flex-row items-center mt-4">
                <Image source={{ uri: userImage }} style={{ width: 64, height: 64, borderRadius: 32, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={userName}
                    onChangeText={setUserName}
                    placeholder="Your name"
                    style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 8, borderRadius: 8, color: theme.textPrimary }}
                  />
                  <TextInput
                    value={userImage}
                    onChangeText={setUserImage}
                    placeholder="Avatar URL"
                    style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 8, borderRadius: 8, marginTop: 8, color: theme.textPrimary }}
                  />
                </View>
              </View>

              <View className="flex-row mt-4 space-x-3">
                {/* preset avatars */}
                {['https://i.pravatar.cc/100?img=1', 'https://i.pravatar.cc/100?img=5', 'https://i.pravatar.cc/100?img=12'].map(uri => (
                  <TouchableOpacity key={uri} onPress={() => setUserImage(uri)} className="rounded-full" style={{ marginRight: 8 }}>
                    <Image source={{ uri }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: userImage === uri ? 2 : 0, borderColor: '#2563EB' }} />
                  </TouchableOpacity>
                ))}
              </View>
              <View className="mt-4">
                <TouchableOpacity onPress={saveUser} className="bg-blue-600 px-4 py-2 rounded-md">
                  <Text style={{ color: '#fff' }}>Save Profile</Text>
                </TouchableOpacity>
                {onLogout ? (
                  <TouchableOpacity onPress={onLogout} className="mt-3">
                    <Text style={{ color: '#ef4444' }}>Logout</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        )}

      </ScrollView>
      {/* Bottom navigation bar */}
      <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex-row">
        <TouchableOpacity onPress={() => setActiveTab('home')} className="flex-1 items-center">
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? '#2563EB' : '#6B7280'}
          />
          <Text className={`${activeTab === 'home' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('settings')} className="flex-1 items-center">
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'settings' ? '#2563EB' : '#6B7280'}
          />
          <Text className={`${activeTab === 'settings' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>Settings</Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
};

export default HomeScreen;
