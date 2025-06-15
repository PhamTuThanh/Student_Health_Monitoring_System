import SearchInput from "./SearchInput";
import Conversations from "./Conversations";

const Sidebar = () => {
	return (
		
		// <div className='border-r border-slate-500 first-letter:flex flex-col'>
		// 	<SearchInput />
		// 	<div className='divider px-3'></div>
		// 	<Conversations />
		// 	{/* <LogoutButton /> */}
		// </div>
		<div className='border-r border-slate-500 flex flex-col h-full bg-white'>
            <SearchInput />
            <Conversations />
        </div>
	);
};
export default Sidebar;