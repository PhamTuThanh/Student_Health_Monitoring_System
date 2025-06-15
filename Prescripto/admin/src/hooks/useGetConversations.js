import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const [conversations, setConversations] = useState([]);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
	const dToken = localStorage.getItem("dToken");

	useEffect(() => {
		const getConversations = async () => {
			setLoading(true);
			try {
				const res = await fetch(`${backendUrl}/api/doctor/users-for-chat`, {
					headers:{dToken}
				});
				const data = await res.json();
				if (data.error) {
					setConversations([]);
					throw new Error(data.error);
				}
				setConversations(data.data);
			} catch (error) {
				setConversations([]);
				toast.error(error.message);
			} finally {
				setLoading(false);
			}
		};

		getConversations();
	}, []);

	return { loading, conversations };
};
export default useGetConversations; 