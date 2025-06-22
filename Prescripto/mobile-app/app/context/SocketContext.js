import { createContext, useState, useEffect, useContext } from "react";
import { useSelector } from 'react-redux';
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from '../../ngrok-urls.json';

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
					auth: { token }
				});

				socketInstance.on("connect", () => {
					console.log("Socket connected successfully");
				});

				socketInstance.on("connect_error", (error) => {
					console.error("Socket connection error1:", error.message);
					console.error("Error details:", error);
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