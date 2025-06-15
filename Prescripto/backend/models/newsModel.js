import mongoose from 'mongoose'

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    file: {
        type: String,
        required: true
    }
})

const News = mongoose.models.News || mongoose.model('News', newsSchema)

export default News
