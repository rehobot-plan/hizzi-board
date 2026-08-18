// stamp-version.js — 배포 판번호 도장 (2026-08-18 previewset 레인)
//
// 왜 있나 — 미리보기 주소를 열어도 그것이 어느 커밋인지 물어볼 자리가 없었다. 이 스크립트가
//   public/version.txt 를 써서 `curl {주소}/version.txt` 한 줄로 답하게 한다.
//
// 본은 르호봇 scripts/build-sw-config.mjs:138-140 이다. 그 파일은 서비스워커 설정을 겸하므로
//   판번호 부분만 가져왔다. 이 저장소는 npm·CommonJS 라 확장자와 문법이 다르다.
//
// 시각을 섞는 이유 — 같은 커밋을 다시 배포하거나 되돌린 자리를 해시만으로는 못 가른다.
//
// 'dev' 가 되는 자리 — Vercel 은 git 커밋이 부른 배포에만 VERCEL_GIT_COMMIT_SHA 를 채우고
//   아니면 빈 문자열을 준다. 로컬 빌드도 같다. 빈 값을 그대로 쓰면 판번호가 시각만 남아
//   어느 커밋인지 못 묻게 되므로 'dev' 로 세운다.

const fs = require('fs');
const path = require('path');

const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || '';
const stamp = `${(sha || 'dev').slice(0, 12)}-${Date.now()}`;

const dest = path.join(__dirname, '..', 'public', 'version.txt');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, stamp);

console.log(`[stamp-version] public/version.txt = ${stamp}`);
