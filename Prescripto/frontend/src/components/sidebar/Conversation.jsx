import useConversation from "../../zustand/useConversation";
import { useSocketContext } from "../../context/SocketContext";

const Conversation = ({ conversation, emoji, lastIdx }) => {
	const {selectedConversation, setSelectedConversation} = useConversation();
	const isSelected = selectedConversation?._id === conversation._id;
	const {onlineUsers} = useSocketContext()
	const isOnline = onlineUsers.includes(String(conversation._id))
	// console.log("isOnline: ", isOnline)
    	return (
    		<>
    			<div className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer ${isSelected ? 'bg-sky-500' : ''}`} onClick={() => setSelectedConversation(conversation)}>
    				<div className="avatar">
    					<div
    						className={`w-12 rounded-full ${isOnline ? "online" : ""}`}
    						style={isOnline ? { border: "2px solid green" } : {}}
    					>
    						<img
    							src={conversation.image}
    							alt='user avatar'
    						/>
    					</div>
    				</div>
    
    				<div className='flex flex-col flex-1'>
    					<div className='flex gap-3 justify-between'>
    						<p className='font-bold text-gray-200'>{conversation.name}</p>
    						<span className='text-xl'>{emoji}</span>
    					</div>
    				</div>
    			</div>
    
    			{!lastIdx && <div className='divider my-0 py-0 h-1' />}
    		</>
    	);
    };
    export default Conversation;