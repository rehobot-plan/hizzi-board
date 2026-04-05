const fs = require('fs');
const path = require('path');

const pagePath = path.join('d:/Dropbox/Dropbox/hizzi-board', 'src/app/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

content = content.replace(/(?<!<)\/h2>/g, '</h2>');
content = content.replace(/(?<!<)\/span>/g, '</span>');
content = content.replace(/(?<!<)\/option>/g, '</option>');
content = content.replace(/(?<!<)\/label>/g, '</label>');

fs.writeFileSync(pagePath, content, 'utf8');
