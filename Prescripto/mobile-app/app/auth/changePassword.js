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
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 8 ký tự.');
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
        Alert.alert('Thành công', 'Mật khẩu đã được thay đổi thành công.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        setError(response.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        Alert.alert('Lỗi', response.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
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
            <Text style={styles.title}>Đổi Mật Khẩu</Text>
        </View>

        <Text style={styles.subtitle}>
            Để bảo vệ tài khoản của bạn, hãy đảm bảo mật khẩu mới có ít nhất 8 ký tự.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu cũ</Text>
            <View style={styles.passwordInput}>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu cũ của bạn"
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
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.passwordInput}>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu mới"
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
            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <View style={styles.passwordInput}>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu mới"
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
            <Text style={styles.buttonText}>Đổi Mật Khẩu</Text>
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
