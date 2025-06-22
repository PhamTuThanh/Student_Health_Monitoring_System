import mongoose from 'mongoose';

const medicineInPrescriptionSchema = new mongoose.Schema({
    drugId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'drugStock',
        required: true
    },
    dosage: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        required: true
    },
    duration: {
        type: String
    },
    instructions: {
        type: String
    },
    beforeAfterMeal: {
        type: String,
        enum: ['before', 'after', 'with', 'anytime'],
        default: 'after'
    }
});

const prescriptionSchema = new mongoose.Schema({
    abnormalityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Abnormality',
        required: true
    },
    studentId: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    prescriptionDate: {
        type: Date,
        default: Date.now
    },
    diagnosis: {
        type: String
    },
    medicines: [medicineInPrescriptionSchema],
    notes: {
        type: String
    }
}, { timestamps: true });

const prescriptionModel = mongoose.models.prescription || mongoose.model('prescription', prescriptionSchema);
export default prescriptionModel;