import { useState } from "react";
import { BsSend } from "react-icons/bs";
import { BiSmile } from "react-icons/bi";
import { MdAttachFile } from "react-icons/md";
import useSendMessage from "../../hooks/useSendMessage";

const MessageInput = () => {
	const [message, setMessage] = useState("");
	const { loading, sendMessage } = useSendMessage();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!message.trim()) return;
		await sendMessage(message);
		setMessage("");
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<div className='p-4 bg-white border-t border-gray-200'>
			<form onSubmit={handleSubmit} className='flex items-end gap-3'>
				{/* Attachment button */}
				<button
					type="button"
					className='flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200'
					title="Đính kèm file"
				>
					<MdAttachFile className='w-5 h-5' />
				</button>

				{/* Message input container */}
				<div className='flex-1 relative'>
					<div className='flex items-end bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200'>
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder='Nhập tin nhắn...'
							rows={1}
							className='flex-1 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-500 text-sm leading-6 max-h-32 overflow-y-auto'
							style={{
								minHeight: '24px',
								height: 'auto',
							}}
							onInput={(e) => {
								// Auto-resize textarea
								e.target.style.height = 'auto';
								e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
							}}
						/>
						
						{/* Emoji button */}
						<button
							type="button"
							className='flex-shrink-0 ml-2 p-1 text-gray-500 hover:text-gray-700 rounded-full transition-colors duration-200'
							title="Emoji"
						>
							<BiSmile className='w-5 h-5' />
						</button>
					</div>
				</div>

				{/* Send button */}
				<button
					type='submit'
					disabled={!message.trim() || loading}
					className={`
						flex-shrink-0 p-3 rounded-full transition-all duration-200
						${message.trim() && !loading
							? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25 transform hover:scale-105'
							: 'bg-gray-200 text-gray-400 cursor-not-allowed'
						}
					`}
					title="Gửi tin nhắn"
				>
					{loading ? (
						<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
					) : (
						<BsSend className='w-5 h-5' />
					)}
				</button>
			</form>

			{/* Typing indicator hoặc hints */}
			<div className='mt-2 px-4'>
				<p className='text-xs text-gray-400'>
					Nhấn Enter để gửi, Shift + Enter để xuống dòng
				</p>
			</div>

			{/* Custom styles */}
			<style jsx>{`
				/* Custom scrollbar cho textarea */
				textarea::-webkit-scrollbar {
					width: 4px;
				}
				
				textarea::-webkit-scrollbar-track {
					background: transparent;
				}
				
				textarea::-webkit-scrollbar-thumb {
					background: #cbd5e0;
					border-radius: 2px;
				}
				
				textarea::-webkit-scrollbar-thumb:hover {
					background: #a0aec0;
				}

				/* Animation cho send button */
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.8; }
				}
				
				.animate-pulse {
					animation: pulse 1s ease-in-out infinite;
				}
			`}</style>
		</div>
	);
};

export default MessageInput;