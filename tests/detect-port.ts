import { findDevServerPort } from './utils/port';
import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  if (process.env.BASE_URL) {
    console.log(`[detect-port] using BASE_URL from env: ${process.env.BASE_URL}`);
    return;
  }
  const port = await findDevServerPort();
  const url = `http://localhost:${port}`;
  process.env.BASE_URL = url;
  // .env.test 파일에 저장하여 config 재로딩 시 참조 가능
  fs.writeFileSync(path.join(__dirname, '..', '.env.test'), `BASE_URL=${url}\n`);
  console.log(`[detect-port] dev server found on port ${port}`);
}
