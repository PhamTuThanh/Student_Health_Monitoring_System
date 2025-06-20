import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { logoutAction } from "../redux/authSlice";
import ProtectedRoute from "../../components/ProtectedRoute";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logoutAction());
    AsyncStorage.removeItem("token");
    router.push("/auth/login");
  };

  const handleChangePassword = () => {

  };

  return (
    <ProtectedRoute>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header} />
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.image || "https://via.placeholder.com/100" }}
              style={styles.avatar}
            />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera-outline" size={20} color="white" />
            </View>
          </View>
          <Text style={styles.profileTitle}>THÔNG TIN CÁ NHÂN</Text>
          <Text style={styles.label}>HỌ TÊN: <Text style={styles.value}>{user?.name}</Text></Text>
          <Text style={styles.label}>LỚP: <Text style={styles.value}>{user?.major}</Text></Text>
          <Text style={styles.label}>KHÓA: <Text style={styles.value}>{user?.cohort}</Text></Text>
          <Text style={styles.label}>MSSV: <Text style={styles.value}>{user?.studentId}</Text></Text>

          <TouchableOpacity style={styles.changePassword} onPress={handleChangePassword}>
            <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoItem}>NGÀY SINH: </Text>
          <Text style={styles.infoValue}>{user?.dob}</Text>
          <View style={styles.separator} />
          <Text style={styles.infoItem}>EMAIL: </Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
          <View style={styles.separator} />
          <Text style={styles.infoItem}>SỐ ĐIỆN THOẠI: </Text>
          <Text style={styles.infoValue}>{user?.phone}</Text>
          <View style={styles.separator} />
          <Text style={styles.infoItem}>ĐỊA CHỈ: </Text>
          <Text style={styles.infoValue}>{user?.address?.line1} {user?.address?.line2}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </ProtectedRoute>
  );
}


const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: "#fff",
    paddingBottom: 40,
    marginTop: 30,
  },
  header: {
    backgroundColor: "#FFD700",
    height: 160,
  },
  profileContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginTop: -60,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
    marginTop: -60,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    padding: 4,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  value: {
    fontWeight: "normal",
  },
  changePassword: {
    backgroundColor: "#009688",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    width: "80%",
    alignSelf: "center",
    alignItems: "center",
  },
  changePasswordText: {
    color: "white",
    fontWeight: "bold",
  },
  infoSection: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  infoItem: {
    fontSize: 16,
    marginBottom: 2,
    color: "#043d64",
    fontWeight: "bold",
  },
  infoValue: {
    fontWeight: "normal",
    color: "black",
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#FF3B30",
    marginHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  separator: {
    height: 1,
    backgroundColor: "gray",
    marginVertical: 10,
  },
});
