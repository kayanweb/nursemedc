const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add to context default
code = code.replace(
  `    premiumTitleEn: "Baheya Premium Forms",\n  },`,
  `    premiumTitleEn: "Baheya Premium Forms",\n    themeMode: "light",\n    themeColor: "pink",\n    timezone: "Africa/Cairo",\n    dateFormat: "DD/MM/YYYY hh:mm A",\n    tenants: [{ name: "مستشفى بهية الرئيسي (الشيخ زايد)", legalId: "BHY-MAIN-1001", taxId: "543-210-987" }]\n  },`
);

// Add to hospitalSettings state
code = code.replace(
  `    appVersion: "1.0.0",\n  });`,
  `    appVersion: "1.0.0",\n    themeMode: "light",\n    themeColor: "pink",\n    timezone: "Africa/Cairo",\n    dateFormat: "DD/MM/YYYY hh:mm A",\n    tenants: [{ name: "مستشفى بهية الرئيسي (الشيخ زايد)", legalId: "BHY-MAIN-1001", taxId: "543-210-987" }]\n  });`
);

// Add to settingsForm initial state
code = code.replace(
  `      corporate: false\n    }\n  });`,
  `      corporate: false\n    },\n    themeMode: "light",\n    themeColor: "pink",\n    timezone: "Africa/Cairo",\n    dateFormat: "DD/MM/YYYY hh:mm A",\n    tenants: [{ name: "مستشفى بهية الرئيسي (الشيخ زايد)", legalId: "BHY-MAIN-1001", taxId: "543-210-987" }]\n  });`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated state defaults.");
