import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const [conversations, setConversations] = useState([]);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

	useEffect(() => {
		const getConversations = async () => {
			setLoading(true);
			try {
                // Cookies will be sent automatically with withCredentials=true
				const res = await axios.get(`${backendUrl}/api/doctor/users-for-chat`);
				
				if (res.data.error) {
					throw new Error(res.data.error);
				}
				setConversations(res.data);

			} catch (error) {
				const errorMessage = error.response?.data?.message || error.message;
				toast.error(errorMessage);
				setConversations([]);
			} finally {
				setLoading(false);
			}
		};

		getConversations();
	}, [backendUrl]);

	return { loading, conversations };
};
export default useGetConversations; 