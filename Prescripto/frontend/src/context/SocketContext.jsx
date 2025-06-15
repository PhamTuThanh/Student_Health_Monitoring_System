import { createContext, useState, useEffect, useContext } from "react";
import { useAppContext } from "./AppContext";
import io from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const SocketContext = createContext();	

export const useSocketContext = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { userData } = useAppContext();

	useEffect(() => {
		if (userData && userData._id) {
			console.log("Connecting socket with userData:", userData);
			console.log("Connecting to backend URL:", BACKEND_URL);
			console.log("user id:", userData._id);

			const socket = io(BACKEND_URL, {
				transports: ['websocket'],
				query: {
					userId: userData._id,
				},
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000,
				timeout: 10000,
				forceNew: true
			});

			socket.on("connect", () => {
				console.log("Socket connected successfully");
				console.log("Socket ID:", socket.id);
			});

			socket.on("connect_error", (error) => {
				console.error("Socket connection error:", error.message);
				console.error("Error details:", error);
			});

			socket.on("error", (err) => {
				console.error("Socket error:", err);
			});

			setSocket(socket);

			socket.on("getOnlineUsers", (users) => {
				console.log("Online users:", users);
				setOnlineUsers(users);
			});

			socket.on("newMessage", (message) => {
				console.log("New message received:", message);
			});

			socket.on("disconnect", (reason) => {
				console.log("Socket disconnected. Reason:", reason);
			});

			return () => {
				console.log("Closing socket connection");
				if (socket.connected) {
					socket.disconnect();
				}
				setSocket(null);
			};
		} else {
			console.log("No userData, skipping socket connection");
			if (socket) {
				socket.disconnect();
				setSocket(null);
			}
		}
	}, [userData]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
}; 