import React, { useContext, useState, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Dashboard = () => {
  const { aToken, dashData, getDashData, backendUrl } = useContext(AdminContext)
  const [newsData, setNewsData] = useState([])
  const [examSessions, setExamSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch news data
  const getNewsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/admin/get-news')
      if (data.success) {
        setNewsData(data.news)
      }
    } catch (error) {
      console.log('Error fetching news:', error)
    }
  }

  // Fetch exam sessions data
  const getExamSessions = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/doctor/list-exam-sessions')
      if (data.success) {
        setExamSessions(data.data)
      }
    } catch (error) {
      console.log('Error fetching exam sessions:', error)
    }
  }

  useEffect(() => {
    if (aToken) {
      const fetchData = async () => {
        setLoading(true)
        await Promise.all([
          getDashData(),
          getNewsData(),
          getExamSessions()
        ])
        setLoading(false)
      }
      fetchData()
    }
  }, [aToken])

  // Format date for Vietnamese display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get recent activity from latest news
  const getRecentActivity = () => {
    if (!newsData || newsData.length === 0) return []
    
    return newsData.slice(0, 3).map(news => ({
      message: `Tin tức mới: ${news.title}`,
      time: formatDate(news.date),
      type: 'news',
      category: news.category
    }))
  }

  // Get upcoming events from exam sessions
  const getUpcomingEvents = () => {
    if (!examSessions) return []
    
    const upcoming = examSessions
      .filter(session => new Date(session.examSessionDate) > new Date())
      .sort((a, b) => new Date(a.examSessionDate) - new Date(b.examSessionDate))
      .slice(0, 3)
    
    return upcoming.map(session => ({
      name: session.examSessionName,
      date: formatDate(session.examSessionDate),
      type: 'exam'
    }))
  }

  if (loading) {
    return (
      <div className='bg-gray-50 p-6 max-h-[80vh] overflow-y-scroll ml-10'>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
        </div>
      </div>
    )
  }

  return (
    <div className=' bg-gray-50 p-6 max-h-[80vh] overflow-y-scroll ml-10'>
      {/* Header Section */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6'>
        <div className='flex items-center justify-center mb-6'>
          <div className='w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mr-4'>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
          </div>
          <div>
            <h1 className='text-3xl font-semibold text-gray-900 '>
              Welcome to UTC2 Health Dashboard
            </h1>
            <p className='text-gray-600 mt-2 ml-10'>
              Hello! We are very happy to have you back with our system.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Total Doctors</p>
              <p className='text-2xl font-semibold text-gray-900'>{dashData?.doctors || 0}</p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 01-3 0V5.25m3 0a1.5 1.5 0 01-3 0V5.25m3 0V4.875c0-.621-.504-1.125-1.125-1.125h-.375M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Students</p>
              <p className='text-2xl font-semibold text-gray-900'>{dashData?.students || 0}</p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center'>
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>News</p>
              <p className='text-2xl font-semibold text-gray-900'>{newsData?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9v6a2 2 0 002 2h4a2 2 0 002-2v-6M8 7v10a2 2 0 002 2h4a2 2 0 002-2V7M8 7H6a2 2 0 00-2 2v2a2 2 0 002 2h2m8-6h2a2 2 0 012 2v2a2 2 0 01-2 2h-2" />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Exam Sessions</p>
              <p className='text-2xl font-semibold text-gray-900'>{examSessions?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Recent Activity</h3>
          <div className='space-y-4'>
            {getRecentActivity().length > 0 ? (
              getRecentActivity().map((activity, index) => (
                <div key={index} className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16v6H4V5z" />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm text-gray-900'>{activity.message}</p>
                    <div className='flex items-center space-x-2'>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.category === 'Thông báo' ? 'bg-blue-100 text-blue-800' :
                        activity.category === 'Sự kiện' ? 'bg-green-100 text-green-800' :
                        activity.category === 'Khẩn cấp' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.category}
                      </span>
                      <p className='text-xs text-gray-500'>{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-sm text-gray-500'>No recent news</p>
            )}
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Upcoming Events</h3>
          <div className='space-y-4'>
            {getUpcomingEvents().length > 0 ? (
              getUpcomingEvents().map((event, index) => (
                <div key={index} className='border-l-4 border-blue-500 pl-4'>
                  <p className='text-sm font-medium text-gray-900'>{event.name}</p>
                  <p className='text-xs text-gray-500'>{event.date}</p>
                </div>
              ))
            ) : (
              <p className='text-sm text-gray-500'>Chưa có lịch khám sắp tới</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard