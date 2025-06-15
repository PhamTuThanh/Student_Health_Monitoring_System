import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useSendMessage = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const dToken = localStorage.getItem("dToken");

	const sendMessage = async (message) => {
		setLoading(true);
		try {
			// Kiểm tra xem token có tồn tại không
			if (!dToken) {
				throw new Error("Authentication token is missing. Please log in again.");
			}
			
			console.log("Using token for send:", dToken);
			
			const res = await fetch(`${backendUrl}/api/messages/send/${selectedConversation._id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${dToken}`
				},
				body: JSON.stringify({ message }),
			});
			
			if (!res.ok) {
				throw new Error(`Request failed with status ${res.status}: ${res.statusText}`);
			}
			
			const data = await res.json();
			if (data.error) throw new Error(data.error);

			setMessages([...messages, data]);
		} catch (error) {
			console.error("Send message error:", error);
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { sendMessage, loading };
};
export default useSendMessage;