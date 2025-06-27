import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { changePassword as changePasswordApi } from '../services/api/api'; // Đổi tên để tránh xung đột
import { Ionicons } from '@expo/vector-icons';

const ChangePasswordScreen = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await changePasswordApi({
        oldPassword,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        Alert.alert('Success', 'Password changed successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        setError(response.message || 'An error occurred. Please try again.');
        Alert.alert('Error', response.message || 'An error occurred. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Could not connect to server. Please check your network connection.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
    >
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Change Password</Text>
        </View>

        <Text style={styles.subtitle}>
            To protect your account, please ensure your new password is at least 8 characters.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputContainer}>
            <Text style={styles.label}>Old Password</Text>
            <View style={styles.passwordInput}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your old password"
                    secureTextEntry={!showOldPassword}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                    <Ionicons name={showOldPassword ? "eye-off" : "eye"} size={24} color="#777" />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordInput}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your new password"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholderTextColor="#999"
                />
                 <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={24} color="#777" />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordInput}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your new password again"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#777" />
                </TouchableOpacity>
            </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Change Password</Text>
          )}
        </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'absolute',
    top: 50,
    left: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
      fontSize: 16,
      color: '#555',
      marginBottom: 8,
      fontWeight: '600'
  },
  passwordInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#ddd',
      paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a0c7ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14
  },
});

export default ChangePasswordScreen;
