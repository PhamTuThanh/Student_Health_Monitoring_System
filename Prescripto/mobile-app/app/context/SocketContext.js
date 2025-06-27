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
	const [connectionStatus, setConnectionStatus] = useState('disconnected');
	const { user, loading } = useSelector((state) => state.auth);

	useEffect(() => {
		let socketInstance;
		let reconnectTimer;
		
		const connectSocket = async () => {
			
			if (loading || !user?.id) {
				console.log("Not connecting socket - loading:", loading, "user:", !!user?.id);
				return;
			}

			try {
				const token = await AsyncStorage.getItem("token");
				if (!token) {
					console.error("No token found, cannot connect socket.");
					setConnectionStatus('error');
					return;
				}

				
				if (socketInstance && socketInstance.connected) {
					socketInstance.disconnect();
				}

				console.log("Attempting socket connection...");
				setConnectionStatus('connecting');

				socketInstance = io(BACKEND_URL, {
					auth: { token },
					transports: ['websocket', 'polling'],
					autoConnect: true,
					reconnection: true,
					reconnectionAttempts: 3, 
					reconnectionDelay: 2000, 
					reconnectionDelayMax: 10000, 
					timeout: 30000, 
					forceNew: true,
					upgrade: true,
					rememberUpgrade: false
				});

				socketInstance.on("connect", () => {
					console.log("✅ Socket connected successfully");
					setConnectionStatus('connected');
					
					if (reconnectTimer) {
						clearTimeout(reconnectTimer);
						reconnectTimer = null;
					}
				});

				socketInstance.on("connect_error", (error) => {
					console.error("❌ Socket connection error:", error.message);
					setConnectionStatus('error');
					
					
					if (
						error.message?.includes("Invalid token") ||
						error.message?.includes("No token provided") ||
						error.message?.toLowerCase().includes("auth")
					) {
						console.log("🔒 Socket auth error - logging out user");
						store.dispatch(logoutAction());
						return;
					}

					
					if (!reconnectTimer) {
						reconnectTimer = setTimeout(() => {
							console.log("🔄 Retrying socket connection...");
							connectSocket();
						}, 5000);
					}
				});

				socketInstance.on("disconnect", (reason) => {
					console.log("⚠️ Socket disconnected:", reason);
					setConnectionStatus('disconnected');
					
					if (reason === "io server disconnect") {
						
						setTimeout(() => {
							if (socketInstance) {
								socketInstance.connect();
							}
						}, 1000);
					}
				});

				socketInstance.on("reconnect", (attemptNumber) => {
					console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
					setConnectionStatus('connected');
				});

				socketInstance.on("reconnecting", (attemptNumber) => {
					console.log("🔄 Socket reconnecting... attempt", attemptNumber);
					setConnectionStatus('reconnecting');
				});

				socketInstance.on("reconnect_error", (error) => {
					console.error("❌ Socket reconnect error:", error.message);
				});

				socketInstance.on("reconnect_failed", () => {
					console.error("❌ Socket failed to reconnect after all attempts");
					setConnectionStatus('failed');
					
					
					reconnectTimer = setTimeout(() => {
						console.log("🔄 Final retry attempt...");
						connectSocket();
					}, 30000);
				});

				socketInstance.on("getOnlineUsers", (users) => {
					setOnlineUsers(users);
					console.log("👥 Online users updated:", users.length);
				});

				socketInstance.on("newMessage", (message) => {
					console.log("📨 New message received");
					
				});

				setSocket(socketInstance);

			} catch (error) {
				console.error("❌ Error in connectSocket:", error);
				setConnectionStatus('error');
			}
		};

		connectSocket();

		return () => {
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
			}
			if (socketInstance && socketInstance.connected) {
				console.log("🔌 Disconnecting socket...");
				socketInstance.disconnect();
			}
			setSocket(null);
			setConnectionStatus('disconnected');
		};
	
	}, [user?.id, loading]); 

	return (
		<SocketContext.Provider value={{ 
			socket, 
			onlineUsers, 
			connectionStatus,
			isConnected: connectionStatus === 'connected'
		}}>
			{children}
		</SocketContext.Provider>
	);
};