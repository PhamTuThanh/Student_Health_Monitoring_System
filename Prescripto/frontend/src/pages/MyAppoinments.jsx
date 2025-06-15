import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MyAppoinments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);
  const [appoinments, setAppoinments] = useState([]);
  const navigate = useNavigate();

  const getUserAppoinments = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/list-appoinment`, { userId: token }, { headers: { token } });
      if (data.success) {
        setAppoinments(data.appoinments.reverse());
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const cancelAppoinment = async (appoinmentId) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/cancel-appoinment`, { appoinmentId }, { headers: { token } });
      if (data.success) {
        toast.success(data.message);
        getUserAppoinments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const handlePayPalPayment = async (appoinment) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/paypal-payment`, {
        amount: appoinment.docData.fees,
        description: `Payment for appointment with Dr. ${appoinment.docData.name}`,
        appointmentId: appoinment._id
      }, { headers: { token } });

      if (data.success) {
        window.location.href = data.approvalUrl;
        // navigate('/my-appoinments')
        toast.success(data.message) // Redirect to PayPal approval URL
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Payment initiation failed');
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppoinments();
    }
  }, [token]);

  return (
    <div>
      <p>My appoinment</p>
      <div>
        {appoinments.map((item, index) => (
          <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
            <div>
              <img className='w-32 bg-indigo-50' src={item.docData.image} alt="" />
            </div>
            <div className='flex-1 text-sm text-zinc-600'>
              <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <p className='text-zinc-700 font-medium mt-1'>Address:</p>
              <p className='text-xs'>{item.docData.address.line1}</p>
              <p className='text-xs'>{item.docData.address.line2}</p>
              <p className='text-xs mt-1'><span className='text-sm text-neutral-700 font-medium'>Date&Time: </span> {item.slotDate} | {item.slotTime}</p>
            </div>
            <div></div>
            <div className='flex flex-col gap-2 justify-center'>
              {!item.cancelled && item.payment && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Payment Done</button>}
              {!item.cancelled && !item.payment && <button onClick={()=> handlePayPalPayment(item)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>}
              {!item.cancelled && !item.payment && <button onClick={() => cancelAppoinment(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appoinment</button>}
              {item.cancelled && !item.payment && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appoinment Cancelled</button>}
              {item.cancelled && item.payment && <button className='sm:min-w-48 py-2 border border-yellow-600 rounded text-yellow-600'>Refunding Status</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyAppoinments;