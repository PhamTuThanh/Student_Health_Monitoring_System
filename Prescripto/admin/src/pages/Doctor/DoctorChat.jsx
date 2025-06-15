import React from 'react'
import MessageContainer from '../../components/messages/MessageContainer';
import Sidebar from '../../components/sidebar/Sidebar';

const DoctorChat = () => {
    return (
        <div className=" max-w-6xl h-screen flex flex-col">
            <div className='flex h-full rounded-lg overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
                <Sidebar />
                <MessageContainer />
            </div>
        </div>
    );
}

export default DoctorChat;
