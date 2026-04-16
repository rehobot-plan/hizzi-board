const fs = require('fs')
const path = require('path')
const https = require('https')

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const [key, ...val] = line.split('=')
    if (key && val.length) process.env[key.trim()] = val.join('=').trim()
  }
}

loadEnv()

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('[ask-claude] ANTHROPIC_API_KEY 없음. .env.local 확인.')
  process.exit(1)
}

const question = process.argv.slice(2).join(' ')
if (!question) {
  console.error('[ask-claude] 사용법: node .claude/commands/ask-claude.js "질문 내용"')
  process.exit(1)
}

const body = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1000,
  system: `너는 히찌보드 Next.js 프로젝트의 설계자 Claude야.
Claude Code(실행자)가 두 가지 상황에서 너에게 호출한다.

[질문 모드] 입력이 "질문:" 으로 시작할 때
- 작업 중 막혔을 때 판단을 요청하는 것
- 핵심만 짧게 답해. 코드가 필요하면 코드 블록으로.
- 판단 불가능하면 "오너 결정 필요: [이유]" 로 끝내.

[완료 보고 모드] 입력이 "완료보고:" 로 시작할 때
- Claude Code가 작업을 끝내고 결과를 보고하는 것
- 보고 내용을 검토하고 아래 형식으로만 답해.

  PASS
  (한 줄 요약)

  또는

  수정 필요: [구체적 이유]
  수정 방향: [한 줄 지시]

- PASS 기준: rules.md 체크리스트 항목 위반 없음 + 수용 기준 충족
- 보고 내용이 불충분하면 "수정 필요: 보고 내용 부족 - [무엇이 빠졌는지]" 로 끝내.`,
  messages: [{ role: 'user', content: question }]
})

const options = {
  hostname: 'api.anthropic.com',
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  }
}

const req = https.request(options, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    try {
      const json = JSON.parse(data)
      if (json.error) {
        console.error('[ask-claude] API 오류:', json.error.message)
        process.exit(1)
      }
      const answer = json.content?.[0]?.text || '응답 없음'
      console.log('\n[Claude 설계자 답변]\n')
      console.log(answer)
      console.log('')
    } catch (e) {
      console.error('[ask-claude] 파싱 실패:', e.message)
      process.exit(1)
    }
  })
})

req.on('error', (e) => {
  console.error('[ask-claude] 네트워크 오류:', e.message)
  process.exit(1)
})

req.write(body)
req.end()
