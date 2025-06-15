import { io } from "socket.io-client";
const { BACKEND_URL } = require('../../../ngrok-urls.json');
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket;

export const initializeSocket = async () => {
    try {
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");
        
        if (!socket) {
            socket = io(BACKEND_URL, {
                query: { userId },
                extraHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });

            socket.on("connect", () => {
                console.log("Socket connected successfully");
            });

            socket.on("connect_error", (error) => {
                console.error("Socket connection error2:", error);
            });

            socket.on("disconnect", () => {
                console.log("Socket disconnected");
            });
        }
        return socket;
    } catch (error) {
        console.error("Error initializing socket:", error);
        throw error;
    }
};

export const getSocket = () => {
    if (!socket) {
        throw new Error("Socket not initialized. Call initializeSocket first.");
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}; 