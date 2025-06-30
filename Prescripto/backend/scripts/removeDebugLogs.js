import fs from 'fs';
import path from 'path';

const removeDebugLogs = () => {
  const filePath = path.join(process.cwd(), 'controllers', 'doctorController.js');
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove debug logging lines
    const debugPatterns = [
      /console\.log\(`\\n=== Processing Row for StudentId.*?\n/g,
      /console\.log\('Raw studentId from Excel:'.*?\n/g,
      /console\.log\('Processed studentId:'.*?\n/g,
      /console\.log\('StudentId type:'.*?\n/g,
      /console\.log\('StudentId length:'.*?\n/g,
      /console\.log\('ExamSessionId:'.*?\n/g,
      /console\.log\('UpdateData studentId:'.*?\n/g,
      /console\.log\('UpdateData examSessionId:'.*?\n/g,
      /console\.log\('Existing record found:'.*?\n/g,
      /console\.log\('Existing record _id:'.*?\n/g,
      /console\.log\('Existing record studentId:'.*?\n/g,
      /console\.log\('StudentId match:'.*?\n/g,
      /console\.log\('Result _id:'.*?\n/g,
      /console\.log\('Result studentId:'.*?\n/g,
      /console\.log\('Operation: UPDATE'\);\n/g,
      /console\.log\('Operation: INSERT'\);\n/g,
      /\s*\/\/ Debug logging[\s\S]*?console\.log\('ExamSessionId:', examSessionId\);\s*\n/g
    ];
    
    debugPatterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Remove empty lines that might be left
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Debug logs removed successfully from doctorController.js');
    
  } catch (error) {
    console.error('❌ Error removing debug logs:', error);
  }
};

removeDebugLogs(); 