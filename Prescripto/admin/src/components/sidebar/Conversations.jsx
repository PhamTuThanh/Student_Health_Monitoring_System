import useGetConversations from "../../hooks/useGetConversations";
import Conversation from "./Conversation";
import { getRandomEmoji } from "../../utils/emojis";

const Conversations = () => {
    const { loading, conversations } = useGetConversations();
    return (
        <div className='flex-1 overflow-y-auto flex flex-col gap-1'>
            {Array.isArray(conversations) && conversations.map((conversation, idx) => (
                <Conversation
                    key={conversation._id}
                    conversation={conversation}
                    emoji={getRandomEmoji()}
                    lastIdx={idx === conversations.length - 1}
                />
            ))}
            {loading ? <span className='loading loading-spinner mx-auto'></span> : null}
        </div>
    );
};
export default Conversations;