import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import axios from "axios";
axios.defaults.withCredentials = true;

const useGetMessages = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

	useEffect(() => {
		const getMessages = async () => {
			if (!selectedConversation?._id) return;
			setLoading(true);
			try {
				const res = await axios.get(`${backendUrl}/api/messages/${selectedConversation._id}`, {
					withCredentials: true
				});
				
				if (res.data.error) throw new Error(res.data.error);
				setMessages(res.data);

			} catch (error) {
				const errorMessage = error.response?.data?.message || error.message;
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		getMessages();
	}, [selectedConversation?._id, setMessages, backendUrl]);

	return { messages, loading };
};
export default useGetMessages; 