import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add loginMethods to both hospitalSettings and settingsForm initializations using regex over jobTitles
content = content.replace(
  /jobTitles: \["Head Nurse", "General Practitioner", "Staff Nurse"\],/g,
  `jobTitles: ["Head Nurse", "General Practitioner", "Staff Nurse"],
    loginMethods: {
      hospital_id: true,
      employee_code: true,
      sso: false,
      biometric: false,
      sms: false,
      corporate: false
    },`
);

fs.writeFileSync('src/App.tsx', content);
