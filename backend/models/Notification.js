const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedTo: {
        modelType: String,
        itemId: mongoose.Schema.Types.ObjectId
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
