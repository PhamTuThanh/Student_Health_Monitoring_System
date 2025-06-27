import React, { useState, useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddNews = () => {
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('')
    const [date, setDate] = useState('')
    const [content, setContent] = useState('')
    const [file, setFile] = useState('')
    const [loading, setLoading] = useState(false)

    const {backendUrl, aToken} = useContext(AdminContext)

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type !== 'application/pdf') {
            toast.error('Please select a PDF file');
            e.target.value = null;
            return;
        }
        setFile(selectedFile);
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        try {
            if(!file){
                return toast.error('Please select a PDF file')
            }
            setLoading(true)
            const formData = new FormData()
            formData.append('title', title)
            formData.append('category', category)
            formData.append('date', date)
            formData.append('content', content)
            formData.append('file', file)

            const {data} = await axios.post(`${backendUrl}/api/admin/add-news`, formData, {
                headers: {
                    aToken
                }
            })
            if(data.success){
                toast.success(data.message)
                setTitle('')
                setCategory('')
                setDate('')
                setContent('')
                setFile('')
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <div className='min-h-screen bg-gray-50 py-8 px-4 ml-10 max-h-[80vh] overflow-y-scroll pb-20 '>
            <div className='max-w-2xl mx-auto'>
                <div className='mb-8'>
                    <h1 className='text-2xl font-semissbold text-gray-900'>Add News</h1>
                    <p className='text-gray-600 mt-1'>Create a new news article</p>
                </div>

                <form onSubmit={onSubmitHandler} className='bg-white rounded-lg shadow-sm border border-gray-200'>
                    <div className='p-6 space-y-6'>
                        {/* Tiêu đề */}
                        <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>
                                Title
                            </label>
                            <input
                                type="text"
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder='Enter the title of the article'
                                required
                            />
                        </div>

                        {/* Danh mục và Ngày */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='space-y-2'>
                                <label className='block text-sm font-medium text-gray-700'>
                                    Category
                                </label>
                                <input
                                    type="text"
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    placeholder='Enter the category'
                                    required
                                />
                            </div>
                            <div className='space-y-2'>
                                <label className='block text-sm font-medium text-gray-700'>
                                    Date
                                </label>
                                <input
                                    type="date"
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Nội dung */}
                        <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>
                                Content
                            </label>
                            <textarea
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none'
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={6}
                                placeholder='Enter the content of the article...'
                                required
                            />
                        </div>

                        {/* File PDF */}
                        <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>
                                Attachment
                            </label>
                            <div className='border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-gray-400 transition-colors'>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className='w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                                    required
                                />
                                {file && (
                                    <div className='mt-2 flex items-center text-sm text-green-600'>
                                        <svg className='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                        </svg>
                                        Selected: {file.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg'>
                        <button
                            type="submit"
                            disabled={loading}
                            className='w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors'
                        >
                            {loading ? (
                                <div className='flex items-center justify-center'>
                                    <svg className='animate-spin -ml-1 mr-3 h-4 w-4 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                                    </svg>
                                    Loading...
                                </div>
                            ) : (
                                'Add News'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddNews