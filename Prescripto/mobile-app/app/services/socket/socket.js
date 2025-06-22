import { io } from "socket.io-client";
const { BACKEND_URL } = require('../../../ngrok-urls.json');
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket;

export const initializeSocket = async () => {
    try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
            console.error("No token found, cannot connect socket.");
            return null;
        }
        if (!socket) {
            console.log("Socket connecting with token:", token);
            socket = io(BACKEND_URL, {
                transports: ['websocket','polling'],  
                auth: { token }
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