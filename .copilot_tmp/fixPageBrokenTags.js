const fs = require('fs');
const path = require('path');

const pagePath = path.join('d:/Dropbox/Dropbox/hizzi-board', 'src/app/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

const replacements = [
  [
    '<h2 className="text-base font-semibold text-[#2C1810]">愿由ъ옄 - ?ъ슜??願由?/h2>',
    '<h2 className="text-base font-semibold text-[#2C1810]">관리자 - 사용자 관리</h2>'
  ],
  [
    '<span className="text-xs text-[#C17B6B]">誘몃같??{unassignedCount}紐?/span>',
    '<span className="text-xs text-[#C17B6B]">미할당 {unassignedCount}명</span>'
  ],
  [
    '<option value="self">蹂몄씤留?/option>',
    '<option value="self">본인만</option>'
  ],
  [
    '<label className="text-[11px] text-[#9E8880] uppercase tracking-wider mb-2 block">?대찓??/label>',
    '<label className="text-[11px] text-[#9E8880] uppercase tracking-wider mb-2 block">이메일</label>'
  ]
];

for (const [from, to] of replacements) {
  if (!content.includes(from)) {
    throw new Error(`Missing target: ${from}`);
  }
  content = content.replace(from, to);
}

fs.writeFileSync(pagePath, content, 'utf8');
