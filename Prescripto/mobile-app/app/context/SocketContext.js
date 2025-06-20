import { createContext, useState, useEffect, useContext } from "react";
import { useSelector } from 'react-redux';
import { io } from "socket.io-client";
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
		if (!loading && user?.id) {
			const socketInstance = io(BACKEND_URL, {
			//	transports: ['websocket', 'polling'],
				query: {
					userId: user.id,
				},
				// reconnection: true,
				// reconnectionAttempts: 5,
				// reconnectionDelay: 1000,
				// timeout: 10000,
			});
		
			console.log("Connecting socket with user ID:", user.id);
			console.log("Connecting to backend URL:", BACKEND_URL);
			socketInstance.on("connect", () => {
				console.log("Socket connected successfully");
			});

			socketInstance.on("connect_error", (error) => {
				console.error("Socket connection error1:", error.message);
				console.error("Error details:", error);
				
				
			});

			setSocket(socketInstance);

			socketInstance.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

			socketInstance.on("newMessage", (message) => {
				// Handle new message
			});

			return () => {
				if (socketInstance.connected) {
					socketInstance.disconnect();
				}
				setSocket(null);
			};
		} else if (socket) {
			socket.disconnect();
			setSocket(null);
		}
	}, [user, loading]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};