import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add loginMethods to hospitalSettings Initialization
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

// 2. Add loginMethods to settingsForm 
content = content.replace(
  /welcomeSubtitleEn: "Sign in to access your Patient Records, Appointments, and System Tools."/g,
  `welcomeSubtitleEn: "Sign in to access your Patient Records, Appointments, and System Tools.",
    loginMethods: {
      hospital_id: true,
      employee_code: true,
      sso: false,
      biometric: false,
      sms: false,
      corporate: false
    }`
);

// 3. Make sure when we load hospitalSettings, we populate settingsForm.loginMethods
content = content.replace(
  /setSettingsForm\(settings\);/g,
  `setSettingsForm({
          ...settings,
          loginMethods: settings.loginMethods || {
            hospital_id: true,
            employee_code: true,
            sso: false,
            biometric: false,
            sms: false,
            corporate: false
          }
        });`
);

fs.writeFileSync('src/App.tsx', content);
