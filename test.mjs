const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');
const items = new Set();
lines.forEach(line => {
    const match = line.match(/localStorage\.getItem\("([^"]+)"\)/);
    if(match) items.add(match[1]);
});
console.log(Array.from(items));
