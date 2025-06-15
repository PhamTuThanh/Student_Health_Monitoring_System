import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppoinments = () => {

  const { dToken, appoinments, getAppoinments,completeAppoinment
    , cancelAppoinment } = useContext(DoctorContext)
  const {calculateAge, slotDateFormat, currency} = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getAppoinments()
    }
  }, [dToken])
  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-3 text-lg font-medium'>All Appoinment</p>
      <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_2fr_1fr_2fr_2fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Actions</p>
        </div>
        {
          appoinments.reverse().map((item, index) => (
            <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_2fr_1fr_2fr_2fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
              <p className='max-sm:hidden'>{index + 1}</p>
              <div className='flex items-center gap-2'>
                <img className='w-8 rounded-full' src={item.userData.image} alt="" /> <p>{item.userData.name}</p>
              </div>
              <div>
                <p className='text-xs inline border border-primary px-2 rounded-full'>
                  {item.payment ? 'Online' : 'CASH'}
                </p>
              </div>
              <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              <p>{currency}{item.amount}</p>
              {
                item.cancelled
                ?<p className='text-red-500 font-medium, text-xs'>Cancelled</p>
                :item.isCompleted
                ?<p className='text-green-500 font-medium text-xs'>Completed</p>
                : <div className='flex'>
                <img onClick={()=>completeAppoinment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                <img onClick={()=> cancelAppoinment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
              </div>
              }
              
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default DoctorAppoinments
