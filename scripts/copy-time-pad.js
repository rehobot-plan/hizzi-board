const fs = require('fs');
const path = require('path');

const src = 'C:/Users/User/Desktop/time-pad.jpg';
const destDir = path.join(__dirname, '..', 'public');
const dest = path.join(destDir, 'time-pad.jpg');

if (!fs.existsSync(src)) {
  console.log('소스 파일을 찾을 수 없습니다:', src);
  process.exit(0);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log('time-pad.jpg 파일을 public 폴더로 복사했습니다:', dest);
