const fs = require('fs');
const path = require('path');

function mustReplace(text, from, to, label) {
  if (!text.includes(from)) throw new Error('Missing: ' + label);
  return text.replace(from, to);
}

const root = 'd:/Dropbox/Dropbox/hizzi-board';

// CreatePost
const cp = path.join(root, 'src/components/CreatePost.tsx');
let c = fs.readFileSync(cp, 'utf8');
c = mustReplace(c,
  "import { useEscClose } from '@/hooks/useEscClose';",
  "import { useEscClose } from '@/hooks/useEscClose';\nimport { useToastStore } from '@/store/toastStore';",
  'createpost import toast'
);
c = mustReplace(c,
  "interface CreatePostProps {\n  panelId: string;\n  onClose: (savedCategory?: string) => void;\n  categories?: string[];\n  defaultCategory?: string;\n}\n\nconst BASE_CATEGORIES = ['할일', '메모'];",
  "interface CreatePostProps {\n  panelId: string;\n  onClose: (savedCategory?: string) => void;\n  categories?: string[];\n  defaultCategory?: string;\n}\n\ninterface PostData {\n  panelId: string;\n  content: string;\n  author: string;\n  category: string;\n  visibleTo: string[];\n  taskType?: 'work' | 'personal';\n  attachment?: { type: 'image' | 'file' | 'link'; url: string; name?: string };\n}\n\ninterface RequestData {\n  fromEmail: string;\n  fromPanelId: string;\n  toEmail: string;\n  toPanelId: string;\n  title: string;\n  content: string;\n  visibleTo: string[];\n  teamLabel?: string;\n  teamRequestId?: string;\n  dueDate?: string;\n}\n\nconst BASE_CATEGORIES = ['할일', '메모'];",
  'createpost interfaces'
);
c = mustReplace(c,
  "  const { addRequest } = useTodoRequestStore();",
  "  const { addRequest } = useTodoRequestStore();\n  const { addToast } = useToastStore();",
  'createpost addToast'
);
c = mustReplace(c, "      const postData: any = {", "      const postData: PostData = {", 'createpost postData');
c = mustReplace(c, "        const requestData: any = {", "        const requestData: RequestData = {", 'createpost requestData');
c = mustReplace(c,
  "    } catch (err) {\n      console.error('저장 오류:', err);\n    } finally {",
  "    } catch (err) {\n      console.error('저장 오류:', err);\n      addToast({ message: '게시물 저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    } finally {",
  'createpost save catch'
);
c = mustReplace(c,
  "    } catch (err) {\n      console.error('요청 오류:', err);\n    } finally {",
  "    } catch (err) {\n      console.error('요청 오류:', err);\n      addToast({ message: '요청 전송에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    } finally {",
  'createpost request catch'
);
fs.writeFileSync(cp, c, 'utf8');

// LeaveManager
const lp = path.join(root, 'src/components/LeaveManager.tsx');
let l = fs.readFileSync(lp, 'utf8');
l = mustReplace(l,
  "import { useEscClose } from '@/hooks/useEscClose';",
  "import { useEscClose } from '@/hooks/useEscClose';\nimport { useToastStore } from '@/store/toastStore';",
  'leave import toast'
);
l = mustReplace(l,
  "  const { settings, events, upsertSetting, addLeaveEvent, updateLeaveEvent, deleteLeaveEvent } = useLeaveStore();",
  "  const { settings, events, upsertSetting, addLeaveEvent, updateLeaveEvent, deleteLeaveEvent } = useLeaveStore();\n  const { addToast } = useToastStore();",
  'leave addToast'
);
l = mustReplace(l,
  "    await upsertSetting({\n      userId: selectedUser.id,\n      userName: selectedUser.name,\n      joinDate: normalizedJoinDate,\n      manualUsedDays: Number(manualUsedDraft) || 0,\n    });",
  "    try {\n      await upsertSetting({\n        userId: selectedUser.id,\n        userName: selectedUser.name,\n        joinDate: normalizedJoinDate,\n        manualUsedDays: Number(manualUsedDraft) || 0,\n      });\n    } catch (e) {\n      console.error(e);\n      addToast({ message: '설정 저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    }",
  'leave saveSetting'
);
l = mustReplace(l,
  "    if (editTargetId) {\n      const current = userEvents.find((e) => e.id === editTargetId);\n      if (!current) return;\n      const locked = current.confirmed || isPastOrToday(current.date);\n      if (locked && !isAdmin) return;\n      await updateLeaveEvent(editTargetId, payload);\n    } else {\n      await addLeaveEvent(payload);\n    }\n\n    setShowAdd(false);",
  "    try {\n      if (editTargetId) {\n        const current = userEvents.find((e) => e.id === editTargetId);\n        if (!current) return;\n        const locked = current.confirmed || isPastOrToday(current.date);\n        if (locked && !isAdmin) return;\n        await updateLeaveEvent(editTargetId, payload);\n      } else {\n        await addLeaveEvent(payload);\n      }\n      setShowAdd(false);\n    } catch (e) {\n      console.error(e);\n      addToast({ message: '연차 저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    }",
  'leave saveLeave'
);
l = mustReplace(l,
  "    await deleteLeaveEvent(event.id);",
  "    try {\n      await deleteLeaveEvent(event.id);\n    } catch (e) {\n      console.error(e);\n      addToast({ message: '연차 삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    }",
  'leave delete'
);
fs.writeFileSync(lp, l, 'utf8');

// Calendar
const calp = path.join(root, 'src/components/Calendar.tsx');
let a = fs.readFileSync(calp, 'utf8');
a = mustReplace(a,
  "import { LeaveEvent, LeaveType, useLeaveStore } from '@/store/leaveStore';",
  "import { LeaveEvent, LeaveType, useLeaveStore } from '@/store/leaveStore';",
  'calendar import already'
);
a = mustReplace(a,
  "  const [deleteConfirm, setDeleteConfirm] = useState<{\n    type: 'single' | 'repeat' | 'leave';\n    target: any;\n  } | null>(null);",
  "  const [deleteConfirm, setDeleteConfirm] = useState<{\n    type: 'single' | 'repeat' | 'leave';\n    target: CalendarEvent | LeaveEvent;\n  } | null>(null);",
  'calendar target type'
);
a = mustReplace(a,
  "                  if (deleteConfirm.type === 'single') await executeDeleteSingle(deleteConfirm.target);\n                  if (deleteConfirm.type === 'repeat') await executeDeleteRepeat(deleteConfirm.target);\n                  if (deleteConfirm.type === 'leave') await executeLeaveDelete(deleteConfirm.target);",
  "                  if (deleteConfirm.type === 'single') await executeDeleteSingle(deleteConfirm.target as CalendarEvent);\n                  if (deleteConfirm.type === 'repeat') await executeDeleteRepeat(deleteConfirm.target as CalendarEvent);\n                  if (deleteConfirm.type === 'leave') await executeLeaveDelete(deleteConfirm.target as LeaveEvent);",
  'calendar casts'
);
fs.writeFileSync(calp, a, 'utf8');

console.log('done');
