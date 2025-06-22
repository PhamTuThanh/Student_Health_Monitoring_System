import { createContext, useState, useEffect, useContext } from "react";
import { useAppContext } from "./AppContext";
import io from "socket.io-client";
import { toast } from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;
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
			const socket = io(BACKEND_URL, {
				withCredentials: true
			});
			socket.on("connect", () => {
				console.log("Socket connected successfully:", socket.id);
			});

			socket.on("connect_error", (error) => {	
				console.error("Socket connection error:", error.message);
			});

			setSocket(socket);

			socket.on("auth_error", (error) => {
				console.error("Socket authentication error:", error.message);
				toast.error(`Socket Auth Error: ${error.message}`);
			});

			socket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

			return () => {
				console.log("Closing socket connection");
				socket.disconnect();
				setSocket(null);
			};
		} else {
			if (socket) {
				socket.disconnect();
				setSocket(null);
			}
		}
	}, [userData]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
}; 