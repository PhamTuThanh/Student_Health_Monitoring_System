import { useAppContext } from "../../context/AppContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";

const Message = ({ message }) => {
	const { userData } = useAppContext();
	const { selectedConversation } = useConversation();
	const fromMe = message && userData ? message.senderId === userData._id : false;
	const formattedTime = extractTime(message.createdAt);
	const image = fromMe ? userData.image : selectedConversation?.image;

	// Giả sử bạn có các trạng thái tin nhắn (có thể thêm vào message object)
	// message.status có thể là: 'sent', 'delivered', 'read'
	const messageStatus = message.status || 'read'; // default là sent

	const renderMessageStatus = () => {
		if (!fromMe) return null;

		switch (messageStatus) {
			case 'sent':
				// 1 dấu tích xám - đã gửi
				return (
					<svg className="w-3 h-3 text-gray-400 ml-2" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
					</svg>
				);
			case 'delivered':
				// 2 dấu tích xám - đã nhận
				return (
					<div className="inline-flex items-center ml-2">
						<svg className="w-3 h-3 text-gray-400 -mr-1" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
						</svg>
						<svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
						</svg>
					</div>
				);
			case 'read':
				// 2 dấu tích xanh - đã đọc
				return (
					<div className="inline-flex items-center ml-2">
						<svg className="w-3 h-3 text-blue-500 -mr-1" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
						</svg>
						<svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
						</svg>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className={`flex w-full mb-4 ${fromMe ? 'justify-end' : 'justify-start'}`}>
			<div className={`flex max-w-[75%] ${fromMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
				{/* Avatar */}
				<div className="flex-shrink-0">
					<div className="relative">
						<img
							src={image || '/default-avatar.png'}
							alt={fromMe ? 'Your avatar' : `${selectedConversation?.name} avatar`}
							className={`
								w-8 h-8 rounded-full object-cover
								${fromMe ? 'ring-2 ring-blue-500/30' : 'ring-2 ring-gray-300/50'}
								transition-all duration-200
							`}
						/>
						{/* Online indicator for other users */}
						{!fromMe && (
							<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
						)}
					</div>
				</div>

				{/* Message Content */}
				<div className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'}`}>
					{/* Message Bubble */}
					<div
						className={`
							relative px-4 py-2 rounded-2xl max-w-full break-words
							transition-all duration-200 hover:shadow-md
							${message.shouldShake ? 'animate-shake' : ''}
							${fromMe 
								? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md shadow-lg hover:shadow-blue-500/25' 
								: 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm hover:shadow-gray-300/50'
							}
						`}
					>
						{/* Message Text */}
						<p className={`text-sm leading-relaxed ${fromMe ? 'text-white' : 'text-gray-800'}`}>
							{message.message}
						</p>

						{/* Message Tail */}
						<div
							className={`
								absolute bottom-0 w-3 h-3 transform rotate-45
								${fromMe 
									? 'bg-blue-600 -right-1.5 rounded-br-sm' 
									: 'bg-white border-r border-b border-gray-200 -left-1.5 rounded-bl-sm'
								}
							`}
						></div>
					</div>

					{/* Timestamp và Status */}
					<div className={`mt-1 px-2 flex items-center ${fromMe ? 'flex-row-reverse' : 'flex-row'}`}>
						<span className="text-xs text-gray-500 font-medium">
							{formattedTime}
						</span>
						
						{/* Message Status - chỉ hiển thị logic đúng */}
						{renderMessageStatus()}
					</div>
				</div>
			</div>

			{/* Custom Styles */}
			<style jsx>{`
				@keyframes shake {
					0%, 100% { transform: translateX(0); }
					10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
					20%, 40%, 60%, 80% { transform: translateX(2px); }
				}
				
				.animate-shake {
					animation: shake 0.5s ease-in-out;
				}

				/* Custom scrollbar for long messages */
				.break-words {
					word-wrap: break-word;
					overflow-wrap: break-word;
				}
			`}</style>
		</div>
	);
};

export default Message;