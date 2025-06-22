import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import axios from "axios";

const useSendMessage = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

	const sendMessage = async (message) => {
		if (!selectedConversation?._id) return;
		setLoading(true);
		try {
			const res = await axios.post(
				`${backendUrl}/api/messages/send/${selectedConversation._id}`, 
				{ message }
			);
			
			if (res.data.error) throw new Error(res.data.error);

			setMessages([...messages, res.data]);

		} catch (error) {
			const errorMessage = error.response?.data?.message || error.message;
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return { sendMessage, loading };
};
export default useSendMessage;