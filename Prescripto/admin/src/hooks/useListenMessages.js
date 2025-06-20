import { useEffect } from "react";

import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";

import notificationSound from "../assets/sounds/notification.mp3";
import { toast } from "react-toastify";
// const useListenMessages = () => {
// 	const { socket } = useSocketContext();
// 	const { messages, setMessages } = useConversation();

// 	useEffect(() => {
// 		if(!socket) return;

// 		const handleNewMessage = (newMessage) => {
// 			newMessage.shouldShake = true;
// 			const sound = new Audio(notificationSound);
// 			sound.play();
// 			toast.success("New message received");
// 			setMessages([...messages, newMessage]);
// 		};

// 		socket.on("newMessage", handleNewMessage);

// 		// socket?.on("newMessage", (newMessage) => {
// 		// 	newMessage.shouldShake = true;
// 		// 	const sound = new Audio(notificationSound);
// 		// 	sound.play();
// 		// 	toast.success("New message received");
// 		// 	setMessages([...messages, newMessage]);
// 		// });

// 		return () => socket?.off("newMessage", handleNewMessage);
// 	}, [socket, setMessages]);
// };
const useListenMessages = () => {
	const { socket } = useSocketContext();
	const { messages, setMessages } = useConversation();

	useEffect(() => {
		socket?.on("newMessage", (newMessage) => {
			newMessage.shouldShake = true;
			const sound = new Audio(notificationSound);
			sound.play();
			toast.success("New message received");
			setMessages([...messages, newMessage]);
		});

		return () => socket?.off("newMessage");
	}, [socket, setMessages, messages]);
};
export default useListenMessages;