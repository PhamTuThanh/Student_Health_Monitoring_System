import useGetConversations from "../../hooks/useGetConversations";
import Conversation from "./Conversation";
import { getRandomEmoji } from "../../utils/emojis";
import { useSocketContext } from "../../context/SocketContext";

const Conversations = () => {
    const { loading, conversations } = useGetConversations();
    const { onlineUsers } = useSocketContext();
    
    // Sắp xếp conversations: online users trước, offline users sau
    const sortedConversations = Array.isArray(conversations) ? 
        [...conversations].sort((a, b) => {
            const aIsOnline = onlineUsers.includes(String(a._id));
            const bIsOnline = onlineUsers.includes(String(b._id));
            
            // Nếu a online và b offline, a sẽ được ưu tiên (trả về -1)
            if (aIsOnline && !bIsOnline) return -1;
            // Nếu a offline và b online, b sẽ được ưu tiên (trả về 1)
            if (!aIsOnline && bIsOnline) return 1;
            // Nếu cả hai cùng trạng thái, giữ nguyên thứ tự theo tên
            return a.name.localeCompare(b.name);
        }) : [];
    
    return (
        <div className='flex-1 overflow-y-auto flex flex-col gap-1'>
            {sortedConversations.map((conversation, idx) => (
                <Conversation
                    key={conversation._id}
                    conversation={conversation}
                    emoji={getRandomEmoji()}
                    lastIdx={idx === sortedConversations.length - 1}
                />
            ))}
            {loading ? <span className='loading loading-spinner mx-auto'></span> : null}
        </div>
    );
};
export default Conversations;