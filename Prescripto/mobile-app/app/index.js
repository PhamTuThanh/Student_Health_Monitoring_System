import * as React from "react";
import { View, StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from 'react';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});
  const router = useRouter();

  useEffect(() => {
    registerForPushNotificationsAsync();
    // Lắng nghe khi nhận thông báo foreground
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // Xử lý khi nhận thông báo foreground
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: "https://videos.pexels.com/video-files/5377700/5377700-sd_540_960_25fps.mp4",
        }}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        onPlaybackStatusUpdate={(status) => setStatus(() => status)}
      />
      <View style={styles.overlay}>
        <Text style={styles.mainText}>UTC2</Text>
        <Text style={styles.subText}>Heath</Text>
        <Text style={styles.tagline}></Text>
      </View>
      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/register")}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);
  // Gửi token này lên server để gửi push notification
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    marginTop: 50,
  },
  mainText: {
    color: "white",
    fontSize: 68,
    fontWeight: "bold",
    textAlign: "center",
  },
  subText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  tagline: {
    color: "white",
    fontSize: 18,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
  },
  button: {
    backgroundColor: "#6200ea",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 3, // Adds a shadow effect on Android
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});