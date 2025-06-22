import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BACKEND_URL } from '../../ngrok-urls.json';

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email của bạn');
      return;
    }

    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      // Gọi API quên mật khẩu
      const response = await fetch(`${BACKEND_URL}/api/user/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        Alert.alert(
          'Thành công',
          'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LinearGradient
            colors={['#2196F3', '#1976D2']}
            style={styles.header}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <FontAwesome name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <FontAwesome name="lock" size={60} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Quên mật khẩu</Text>
              <Text style={styles.headerSubtitle}>
                Nhập email của bạn để nhận link đặt lại mật khẩu
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <FontAwesome name="envelope" size={20} color="#90A4AE" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập email của bạn"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#90A4AE"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Gửi email đặt lại mật khẩu</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={handleBackToLogin}
            >
              <Text style={styles.backToLoginText}>
                ← Quay lại đăng nhập
              </Text>
            </TouchableOpacity>

            {emailSent && (
              <View style={styles.successMessage}>
                <FontAwesome name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.successText}>
                  Email đã được gửi thành công!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 40,
    left: 20,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#263238',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backToLoginText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ForgotPassword; 