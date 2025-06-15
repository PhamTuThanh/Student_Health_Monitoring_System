import mongoose from "mongoose";

const drugStockSchema = new mongoose.Schema({
    drugImage: {
        type: String,
        required: true
    },
    drugName: {
        type: String,
        required: true
    },
    drugCode: {
        type: String,
        required: true
    },
    drugType: {
        type: String,
        required: true
    },
    drugUnit: {
        type: String,
        required: true
    },
    inventoryQuantity: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    supplierName: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        required: true
    }
})

const drugStockModel = mongoose.model.drugStock || mongoose.model('drugStock', drugStockSchema);

export default drugStockModel;
