import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import RelatedDoctors from '../components/RelatedDoctors';
import { toast } from 'react-toastify';
import axios from 'axios';

const Appoinment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext);
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; 
  const navigate = useNavigate()

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');

  const fetchDocInfo = async () => {
    if (!doctors || doctors.length === 0) return;
    const docInfo = doctors.find(doc => doc._id === docId);
    setDocInfo(docInfo);
  };

const getAvailableSlots = () => {
  let today = new Date();
  let slots = [];
  for (let i = 0; i < 7; i++) {
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + i);
    let endTime = new Date(currentDate);
    endTime.setHours(21, 0, 0, 0);
    if (today.getDate() === currentDate.getDate()) {
      currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10);
      currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
    } else {
      currentDate.setHours(10);
      currentDate.setMinutes(0);
    }
    let timeSlots = [];
    while (currentDate < endTime) {
      let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let day = currentDate.getDate()
      let month = currentDate.getMonth()+1
      let year = currentDate.getFullYear()

      const slotDate = day + "_" + month + "_" + year
      const slotTime = formattedTime

      const isSlotAvailable = docInfo.slot_booked[slotDate] && docInfo.slot_booked[slotDate].includes(slotTime) ? false : true

      if(isSlotAvailable){
        //add slot to array
        timeSlots.push({
                datetime: new Date(currentDate),
                time: formattedTime,
              });
      }
      //Increment current time by 30 minutes
      currentDate.setMinutes(currentDate.getMinutes() + 30);
    }
    slots.push(timeSlots);
  }
  setDocSlots(slots);
};

  const bookAppoinment = async ()=>{
    if(!token){
      toast.warn('Login to book appoinment')
      return navigate('/login')
    }
    try {
      const date = docSlots[slotIndex][0].datetime

      let day = date.getDate()
      let month = date.getMonth()+1
      let year = date.getFullYear()

      const slotDate = day + "_" + month + "_" + year
      //console.log(slotDate);
      const { data } = await axios.post(backendUrl + '/api/user/book-appoinment', {docId, slotDate, slotTime}, {headers:{token}})
      if(data.success){
        toast.success(data.message)
        getDoctorsData()
        navigate('/my-appoinments') 
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  } 

  useEffect(() => {
    if (doctors.length > 0) {
      fetchDocInfo();
    }
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) {
      getAvailableSlots();
    }
  }, [docInfo]);

  useEffect(() => {
    console.log(docSlots);
  }, [docSlots]);

  if (!docInfo) {
    return <p>Loading doctor information...</p>;
  }

  return (
    <div>
      {/* Doctor Detail */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-secondary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>

        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          {/* Doc Info */}
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>

          {/* Doctor About */}
          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'>
              About <img src={assets.info_icon} alt="" />
            </p>
            <p className='text-sm text-gray-500 max-w-[700px] mt-1'>{docInfo.about}</p>
          </div>
          <p className='text-gray-500 font-medium mt-4'>
            Appoinment Fee: <span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span>
          </p>
        </div>
      </div>

      {/* Booking slots */}

      <div className='sm:ml-72 sm-pl-4 mt-4 front-medium text-gray-700'>
          <p>Booking Slots</p>
          <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
            {
            docSlots.length && docSlots.map((item, index) =>(
              <div onClick={() => setSlotIndex(index)}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                slotIndex === index ? 'bg-secondary text-white' : 'border border-gray-200'
              }`}
              key={index}
            >
                <p>{item[0] && dayOfWeek[item[0].datetime.getDay()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))
            }
          </div>

          <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
            {
              docSlots.length && docSlots[slotIndex].map((item, index) => (
                <p onClick={()=> setSlotTime(item.time)}
  className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
    item.time === slotTime ? 'bg-secondary text-white' : 'text-gray-400 border border-gray-300'
  }`} key={index}>
                    {item.time.toLowerCase()}
                </p>
              ))
            }
          </div>
          <button onClick={bookAppoinment} className='bg-secondary text-white text-sm font-light px-14 py-3 rounded-full my-6'>Book an appoinment</button>
      </div>
            {/* listing related doctors */}
            <RelatedDoctors docId = {docId} speciality={docInfo.speciality} />
    </div>
  );
};

export default Appoinment;
