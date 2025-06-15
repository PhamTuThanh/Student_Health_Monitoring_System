import { useEffect } from "react";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";
import useConversation from "../../zustand/useConversation";
import { useAppContext } from "../../context/AppContext";

const MessageContainer = () => {
	const { selectedConversation, setSelectedConversation } = useConversation();

	useEffect(() => {
		return () => setSelectedConversation(null);
	}, [setSelectedConversation]);

	return (
		<div className='md:min-w-[860px] flex flex-col h-[calc(100vh-90px)]'>
			{!selectedConversation ? (
				<NoChatSelected />
			) : (
				<>
					{/* Header */}
					<div className='bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0'>
						<div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
							<span className='text-white text-sm font-medium'>
								{selectedConversation.name?.charAt(0) || "U"}
							</span>
						</div>
						<div>
							<div className='text-gray-900 font-semibold'>{selectedConversation.name}</div>
							<div className='text-xs text-gray-500'>Đang hoạt động</div>
						</div>
					</div>
					
					{/* Messages - có thể scroll */}
					<div className='flex-1 overflow-y-auto'>
						<Messages />
					</div>
					
					{/* Input - cố định ở dưới */}
					<div className='flex-shrink-0 border-t border-gray-200 bg-white'>
						<MessageInput />
					</div>
				</>
			)}
		</div>
	);
};

const NoChatSelected = () => {
	const { userData } = useAppContext();
	
	return (
		<div className='flex items-center justify-center w-full h-full bg-gray-50'>
			<div className='text-center p-8'>
				<div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
					<TiMessages className='text-3xl text-blue-600' />
				</div>
				
				<h2 className='text-xl font-semibold text-gray-800 mb-2'>
					Chào {userData?.name || "bạn"}! 👋
				</h2>
				
				<p className='text-gray-600 mb-4'>
					Chọn một cuộc trò chuyện để bắt đầu nhắn tin
				</p>
				
				<div className='text-sm text-gray-400'>
					Tin nhắn của bạn sẽ hiển thị ở đây
				</div>
			</div>
		</div>
	);
};

export default MessageContainer;