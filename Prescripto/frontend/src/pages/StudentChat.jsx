import Sidebar from '../components/sidebar/SideBar';
import MessageContainer from '../components/messages/MessageContainer';
const StudentChat = () => {
    return (
        <div className='flex h-[500px] rounded-lg overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
			<Sidebar />
			<MessageContainer />
		</div>

    ) 
}

export default StudentChat;