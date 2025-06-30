import express from 'express';
import { 
    doctorList, 
    loginDoctor, 
    logoutDoctor, 
    appoinmentsDoctor, 
    appoinmentComplete, 
    appoinmentCancel, 
    doctorDashboard, 
    doctorProfile, 
    updateDoctorProfile, 
    savePhysicalFitness, 
    getAllPhysicalFitness,
    getAllAbnormality, 
    createAbnormality, 
    getAbnormalityByStudentId, 
    deleteAbnormality, 
    getPhysicalFitnessStatus, 
    importPhysicalFitnessExcel, 
    addDrug, 
    importDrugExcel, 
    getDrugStock, 
    deleteDrug, 
    updateDrug, 
    getUsersForChat,
    getPhysicalFitnessBySession, 
    getListExamSession, 
    addPrescription, 
    getPrescriptionByStudentId, 
    getPrescriptionByAbnormalityId,
    checkEditPermission,
    requestEditAccess,
    getMyEditRequests,
    cancelEditRequest
} from '../controllers/doctorController.js';
import { authDoctor, checkEditPermissionMiddleware } from '../middlewares/authDoctor.js';
import upload from '../middlewares/multer.js';
const doctorRouter = express.Router();

doctorRouter.get('/list', doctorList);
doctorRouter.post('/login', loginDoctor);
doctorRouter.post('/logout', logoutDoctor);
doctorRouter.get('/appoinments', authDoctor, appoinmentsDoctor)
doctorRouter.post('/complete-appoinment', authDoctor, appoinmentComplete)
doctorRouter.post('/cancel-appoinment', authDoctor, appoinmentCancel)
doctorRouter.get('/dashboard', authDoctor, doctorDashboard)
doctorRouter.get('/profile', authDoctor, doctorProfile)
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile)

// Physical fitness routes với edit permission checking
doctorRouter.post('/physical-fitness', authDoctor, checkEditPermissionMiddleware, savePhysicalFitness);
doctorRouter.get('/get-physical-fitness', getAllPhysicalFitness);
doctorRouter.post('/import-physical-fitness-excel', authDoctor, upload.single('file'), importPhysicalFitnessExcel);

doctorRouter.get('/abnormality', getAllAbnormality);
doctorRouter.post('/abnormality', createAbnormality);
doctorRouter.get('/abnormality/:studentId', getAbnormalityByStudentId);
doctorRouter.delete('/abnormality/:id', authDoctor, deleteAbnormality);
doctorRouter.get('/physical-fitness-status', getPhysicalFitnessStatus);
doctorRouter.post('/add-drug', authDoctor,upload.single('drugImage'), addDrug);
doctorRouter.post('/import-drug-excel',upload.single('file'), importDrugExcel);
doctorRouter.get('/get-drug-stock', getDrugStock);
doctorRouter.delete('/delete-drug/:drugId', deleteDrug);
doctorRouter.put('/update-drug/:_id', updateDrug);
doctorRouter.get('/users-for-chat', authDoctor, getUsersForChat);
doctorRouter.get('/physical-fitness-by-session', authDoctor, getPhysicalFitnessBySession);
doctorRouter.get('/list-exam-sessions', getListExamSession);
doctorRouter.post('/add-prescription', authDoctor, addPrescription);
doctorRouter.get('/get-prescription/:studentId', authDoctor, getPrescriptionByStudentId);
doctorRouter.get('/get-prescription/abnormality/:abnormalityId', authDoctor, getPrescriptionByAbnormalityId);

//--------------------Lock Management Routes--------------------
doctorRouter.get('/check-edit-permission/:examSessionId', authDoctor, checkEditPermission);
doctorRouter.post('/request-edit-access', authDoctor, requestEditAccess);
doctorRouter.get('/my-edit-requests', authDoctor, getMyEditRequests);
doctorRouter.post('/cancel-edit-request', authDoctor, cancelEditRequest);

export default doctorRouter;