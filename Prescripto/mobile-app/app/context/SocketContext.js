import { createContext, useState, useEffect, useContext } from "react";
import { useSelector } from 'react-redux';
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from '../../ngrok-urls.json';
import store from '../redux/store';
import { logoutAction } from '../redux/authSlice';

const SocketContext = createContext();

export const useSocketContext = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { user, loading } = useSelector((state) => state.auth);

	useEffect(() => {
		let socketInstance;
		const connectSocket = async () => {
			if (!loading && user?.id) {
				const token = await AsyncStorage.getItem("token");
				if (!token) {
					console.error("No token found, cannot connect socket.");
					return;
				}
				console.log("Connecting socket with user ID:", user.id, "and token:", token);
				socketInstance = io(BACKEND_URL, {
					auth: { token },
					transports: ['websocket', 'polling'],
					autoConnect: true,
					reconnection: true,
					reconnectionAttempts: 5,
					reconnectionDelay: 1000,
					reconnectionDelayMax: 5000,
					maxReconnectionAttempts: 5,
					timeout: 20000,
					forceNew: true
				});

				socketInstance.on("connect", () => {
					console.log("Socket connected successfully");
				});

				socketInstance.on("connect_error", (error) => {
					console.error("Socket connection error1:", error.message);
					console.error("Error details:", error);
					
					// Kiểm tra nếu là lỗi xác thực token
					if (
						error.message?.includes("Invalid token") ||
						error.message?.includes("No token provided") ||
						error.message?.toLowerCase().includes("auth")
					) {
						// Tự động logout khi socket báo lỗi xác thực
						store.dispatch(logoutAction());
						console.log("Socket auth error - User logged out automatically");
					}
				});

				socketInstance.on("disconnect", (reason) => {
					console.log("Socket disconnected:", reason);
					if (reason === "io server disconnect") {
						// Server ngắt kết nối, cần reconnect thủ công
						socketInstance.connect();
					}
				});

				socketInstance.on("reconnect", (attemptNumber) => {
					console.log("Socket reconnected after", attemptNumber, "attempts");
				});

				socketInstance.on("reconnecting", (attemptNumber) => {
					console.log("Socket reconnecting... attempt", attemptNumber);
				});

				socketInstance.on("reconnect_error", (error) => {
					console.error("Socket reconnect error:", error.message);
				});

				socketInstance.on("reconnect_failed", () => {
					console.error("Socket failed to reconnect after all attempts");
				});

				socketInstance.on("getOnlineUsers", (users) => {
					setOnlineUsers(users);
				});

				socketInstance.on("newMessage", (message) => {
					// Handle new message
				});

				setSocket(socketInstance);
			}
		};

		connectSocket();

		return () => {
			if (socketInstance && socketInstance.connected) {
				socketInstance.disconnect();
			}
			setSocket(null);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, loading]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};