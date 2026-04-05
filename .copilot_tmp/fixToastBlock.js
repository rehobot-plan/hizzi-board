const fs = require('fs');
const path = require('path');

const pagePath = path.join('d:/Dropbox/Dropbox/hizzi-board', 'src/app/page.tsx');
const page = fs.readFileSync(pagePath, 'utf8');
const pattern = /        <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">[\s\S]*?        <\/div>\r?\n      <\/main>/;
const replacement = `        <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={\`px-4 py-2 rounded shadow-lg text-sm flex items-center gap-2 min-w-[200px] \${toast.type === 'error' ? 'bg-[#7A2828] text-[#FDF8F4]' : 'bg-gray-800 text-white'}\`}
            >
              <span className="flex-1">{toast.message}</span>
              <button
                className="ml-2 text-white text-lg hover:text-red-300 focus:outline-none"
                aria-label="알림 닫기"
                onClick={() => useToastStore.getState().removeToast(toast.id)}
                tabIndex={0}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </main>`;

if (!pattern.test(page)) {
  throw new Error('Toast block not found');
}

fs.writeFileSync(pagePath, page.replace(pattern, replacement), 'utf8');
