import useConversation from "../../zustand/useConversation";
import { useSocketContext } from "../../context/SocketContext";

const Conversation = ({ conversation, emoji, lastIdx }) => {
    const { selectedConversation, setSelectedConversation } = useConversation();
    const isSelected = selectedConversation?._id === conversation._id;
    const { onlineUsers } = useSocketContext();
    const isOnline = onlineUsers.includes(String(conversation._id));

    return (
        <>
            <div 
                className={`
                    group relative flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer
                    transition-all duration-200 ease-in-out
                    ${isSelected 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transform scale-[1.02]' 
                        : 'hover:bg-gray-100 hover:shadow-md hover:transform hover:scale-[1.01]'
                    }
                    ${isSelected ? 'text-white' : 'text-gray-800'}
                `}
                onClick={() => setSelectedConversation(conversation)}
            >
                {/* Avatar Container */}
                <div className="relative flex-shrink-0">
                    <div className="relative">
                        <img
                            src={conversation.image}
                            alt={`${conversation.name} avatar`}
                            className={`
                                w-12 h-12 rounded-full object-cover
                                transition-all duration-200
                                ${isSelected ? 'ring-4 ring-white/30' : 'ring-2 ring-gray-200'}
                                ${isOnline ? 'ring-green-400' : ''}
                            `}
                        />
                        
                        {/* Online Status Indicator */}
                        {isOnline && (
                            <div className="absolute -bottom-1 -right-1">
                                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white">
                                    <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className={`
                            font-semibold text-sm truncate
                            ${isSelected ? 'text-white' : 'text-gray-900'}
                            transition-colors duration-200
                        `}>
                            {conversation.name}
                        </h3>
                        
                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            {isOnline && (
                                <span className={`
                                    text-xs px-2 py-1 rounded-full font-medium
                                    ${isSelected 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-green-100 text-green-800'
                                    }
                                `}>
                                    Online
                                </span>
                            )}
                            
                            {emoji && (
                                <span className="text-lg opacity-70">
                                    {emoji}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Last seen or status */}
                    <p className={`
                        text-xs mt-1
                        ${isSelected ? 'text-white/70' : 'text-gray-500'}
                        transition-colors duration-200
                    `}>
                        {isOnline ? 'Active now' : 'Last seen recently'}
                    </p>
                </div>

                {/* Hover Effect Indicator */}
                <div className={`
                    absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full
                    transition-all duration-200
                    ${isSelected ? 'bg-white' : 'bg-blue-500 opacity-0 group-hover:opacity-100'}
                `}></div>
            </div>

            {/* Modern Divider */}
            {!lastIdx && (
                <div className="my-1">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                </div>
            )}
        </>
    );
};

export default Conversation;