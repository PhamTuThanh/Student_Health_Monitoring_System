import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useGetMessages = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const dToken = localStorage.getItem("dToken");

	useEffect(() => {
		const getMessages = async () => {
			setLoading(true);
			try {
				// Check if token exists
				if (!dToken) {
					throw new Error("Authentication token is missing. Please log in again.");
				}
				
				console.log("Using token:", dToken);
				
				const res = await fetch(`${backendUrl}/api/messages/${selectedConversation._id}`, {
					headers:{
						"Authorization": `Bearer ${dToken}`
					}
				});
				
				if (!res.ok) {
					throw new Error(`Request failed with status ${res.status}: ${res.statusText}`);
				}
				
				const data = await res.json();
				console.log("data tesst: ", data);
				if (data.error) throw new Error(data.error);
				setMessages(data);
			} catch (error) {
				console.error("Message fetch error:", error);
				toast.error(error.message);
			} finally {
				setLoading(false);
			}
		};

		if (selectedConversation?._id) getMessages();
	}, [selectedConversation?._id, setMessages]);

	return { messages, loading };
};
export default useGetMessages; 