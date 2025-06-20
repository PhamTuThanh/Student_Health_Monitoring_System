import express from 'express';
import { doctorList, loginDoctor, appoinmentsDoctor, appoinmentComplete, appoinmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile, savePhysicalFitness, getAllPhysicalFitness
    , getAllAbnormality, createAbnormality, getAbnormalityByStudentId, getPhysicalFitness, importPhysicalFitnessExcel, addDrug, importDrugExcel, getDrugStock, deleteDrug, updateDrug, getUsersForChat
    , getPhysicalFitnessBySession, getListExamSession } from '../controllers/doctorController.js'; 
import { authDoctor } from '../middlewares/authDoctor.js';
import upload from '../middlewares/multer.js';
const doctorRouter = express.Router();

doctorRouter.get('/list', doctorList);
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appoinments', authDoctor, appoinmentsDoctor)
doctorRouter.post('/complete-appoinment', authDoctor, appoinmentComplete)
doctorRouter.post('/cancel-appoinment', authDoctor, appoinmentCancel)
doctorRouter.get('/dashboard', authDoctor, doctorDashboard)
doctorRouter.get('/profile', authDoctor, doctorProfile)
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile)
doctorRouter.post('/physical-fitness', savePhysicalFitness);
doctorRouter.get('/get-physical-fitness', getAllPhysicalFitness);
doctorRouter.get('/abnormality', getAllAbnormality);
doctorRouter.post('/abnormality', createAbnormality);
doctorRouter.get('/abnormality/:studentId', getAbnormalityByStudentId);
doctorRouter.get('/physical-fitness-status', getPhysicalFitness);
doctorRouter.post('/import-physical-fitness-excel',upload.single('file'), importPhysicalFitnessExcel);
doctorRouter.post('/add-drug', authDoctor,upload.single('drugImage'), addDrug);
doctorRouter.post('/import-drug-excel',upload.single('file'), importDrugExcel);
doctorRouter.get('/get-drug-stock', getDrugStock);
doctorRouter.delete('/delete-drug/:drugId', deleteDrug);
doctorRouter.put('/update-drug/:drugId', updateDrug);
doctorRouter.get('/users-for-chat', authDoctor, getUsersForChat);
doctorRouter.get('/physical-fitness-by-session', authDoctor, getPhysicalFitnessBySession);
doctorRouter.get('/list-exam-sessions', getListExamSession);
export default doctorRouter;