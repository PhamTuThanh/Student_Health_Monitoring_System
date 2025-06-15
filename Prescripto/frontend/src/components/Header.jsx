import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

const Header = () => {
  const { userData } = useContext(AppContext);

  const navItems = [
    { label: 'Appointment', icon: assets.schedule_an_appoinment, link: '/doctors' },
    { label: 'Messages', icon: assets.messange, link: '/student_chat' },
    { label: 'Visits', icon: assets.visits, link: '/visits' },
    { label: 'Test Results', icon: assets.test_result, link: '/test-results' },
    { label: 'Billing', icon: assets.billing, link: '/billing-summary' },
  ];

  return (
    <div className="flex flex-col md:flex-row flex-wrap bg-secondary rounded-lg px-6 md:px-10 lg:px-20">
      {/* Left Side */}
      <div className="md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto  md:mb-[-30px]">
        <p className=" pr-[50px] text-xl justify-center md:text-3xl lg:text-4xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight">
          Welcome,
          {userData.name}  
        </p>
      </div>

      {/* Navigation Items */}
      <div className="flex sm:justify-center gap-4 pt-5 w-full overflow-scroll pb-3">
        {navItems.map((item, index) => (
          <a
            key={index}
            href={item.link}
            className="bg-white w-[100px] pt-2 flex flex-col items-center text-sm flex-shrink-0 border-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <img
              className="w-35 h-10 cursor-pointer hover:translate-y-[-2px] transition-all duration-500"
              src={item.icon}
              alt={item.label}
            />
            <p className="mt-2 text-center text-base font-medium pb-2">{item.label}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Header;