import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../services/api/api";
import { useDispatch, useSelector } from "react-redux";
import { loginAction } from "../redux/authSlice";

const { width } = Dimensions.get('window');

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(6, "Too Short!").required("Required"),
});

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  const mutation = useMutation({
    mutationFn: loginUser,
    mutationKey: ["login"],
  });
  
  const user = useSelector((state) => state.auth.user);
  
  useEffect(() => {
    if (user) {
      router.push("/tabs");
    }
  }, [user]);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  console.log("user", user);
  
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>
      
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        {/* Logo/Icon Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>📚</Text>
          </View>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your health tracking journey</Text>
        
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={(values) => {
            console.log(values);
            animateButton();
            mutation
              .mutateAsync(values)
              .then((data) => {
                if (data.user) {
                  console.log("Login response data:", data);
                  console.log("User object from response:", data.user);
                  dispatch(loginAction(data.user));
                  router.push("/tabs");
                } else {
                  console.log("Login failed:", data);
                }
              })
              .catch((err) => {
                console.log(err);
                // Error shake animation
                Animated.sequence([
                  Animated.timing(slideAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
                  Animated.timing(slideAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
                  Animated.timing(slideAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
                  Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]).start();
              });
          }}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>✉️</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && touched.email && styles.inputError
                  ]}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  value={values.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && touched.email ? (
                <Animated.Text style={styles.errorText}>{errors.email}</Animated.Text>
              ) : null}

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.password && touched.password && styles.inputError
                  ]}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? "👁️" : "🙈"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && touched.password ? (
                <Animated.Text style={styles.errorText}>{errors.password}</Animated.Text>
              ) : null}

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push("/auth/forgotPassword")}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity 
                  style={[
                    styles.button,
                    mutation.isPending && styles.buttonLoading
                  ]} 
                  onPress={handleSubmit}
                  disabled={mutation.isPending}
                >
                  <Text style={styles.buttonText}>
                    {mutation.isPending ? "Logging in..." : "Login"}
                  </Text>
                  {mutation.isPending && (
                    <View style={styles.loadingIndicator}>
                      <Text style={styles.loadingText}>⏳</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialIcon}>🔍</Text>
                  <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialIcon}>📘</Text>
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  backgroundGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#6366f1',
    opacity: 0.1,
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#8b5cf6',
    opacity: 0.08,
    bottom: 100,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#06b6d4',
    opacity: 0.06,
    top: 200,
    left: 50,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1f2937",
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  inputIconContainer: {
    width: 50,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1f2937",
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 1,
  },
  eyeButton: {
    width: 50,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    height: 56,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#6366f1",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    flexDirection: 'row',
  },
  buttonLoading: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});