const fs = require('fs');
const path = require('path');

function replaceStrict(content, from, to, label) {
  if (!content.includes(from)) {
    throw new Error(`Missing pattern: ${label}`);
  }
  return content.replace(from, to);
}

const root = 'd:/Dropbox/Dropbox/hizzi-board';

const calendarPath = path.join(root, 'src/components/Calendar.tsx');
let calendar = fs.readFileSync(calendarPath, 'utf8');
calendar = replaceStrict(
  calendar,
  "import { LeaveType, useLeaveStore } from '@/store/leaveStore';",
  "import { LeaveEvent, LeaveType, useLeaveStore } from '@/store/leaveStore';",
  'calendar import LeaveEvent'
);
calendar = replaceStrict(
  calendar,
  "  const [deleteConfirm, setDeleteConfirm] = useState<{\n    type: 'single' | 'repeat' | 'leave';\n    target: any;\n  } | null>(null);",
  "  const [deleteConfirm, setDeleteConfirm] = useState<{\n    type: 'single' | 'repeat' | 'leave';\n    target: CalendarEvent | LeaveEvent;\n  } | null>(null);",
  'calendar deleteConfirm type'
);
calendar = replaceStrict(
  calendar,
  "                  if (deleteConfirm.type === 'single') await executeDeleteSingle(deleteConfirm.target);\n                  if (deleteConfirm.type === 'repeat') await executeDeleteRepeat(deleteConfirm.target);\n                  if (deleteConfirm.type === 'leave') await executeLeaveDelete(deleteConfirm.target);",
  "                  if (deleteConfirm.type === 'single') await executeDeleteSingle(deleteConfirm.target as CalendarEvent);\n                  if (deleteConfirm.type === 'repeat') await executeDeleteRepeat(deleteConfirm.target as CalendarEvent);\n                  if (deleteConfirm.type === 'leave') await executeLeaveDelete(deleteConfirm.target as LeaveEvent);",
  'calendar deleteConfirm casts'
);
fs.writeFileSync(calendarPath, calendar, 'utf8');

const createPostPath = path.join(root, 'src/components/CreatePost.tsx');
let createPost = fs.readFileSync(createPostPath, 'utf8');
createPost = replaceStrict(
  createPost,
  "import { useEscClose } from '@/hooks/useEscClose';",
  "import { useEscClose } from '@/hooks/useEscClose';\nimport { useToastStore } from '@/store/toastStore';",
  'createpost import toast'
);
createPost = replaceStrict(
  createPost,
  "interface CreatePostProps {\n  panelId: string;\n  onClose: (savedCategory?: string) => void;\n  categories?: string[];\n  defaultCategory?: string;\n}\n\nconst BASE_CATEGORIES = ['할일', '메모'];",
  "interface CreatePostProps {\n  panelId: string;\n  onClose: (savedCategory?: string) => void;\n  categories?: string[];\n  defaultCategory?: string;\n}\n\ninterface PostData {\n  panelId: string;\n  content: string;\n  author: string;\n  category: string;\n  visibleTo: string[];\n  taskType?: 'work' | 'personal';\n  attachment?: { type: 'image' | 'file' | 'link'; url: string; name?: string };\n}\n\ninterface RequestData {\n  fromEmail: string;\n  fromPanelId: string;\n  toEmail: string;\n  toPanelId: string;\n  title: string;\n  content: string;\n  visibleTo: string[];\n  teamLabel?: string;\n  teamRequestId?: string;\n  dueDate?: string;\n}\n\nconst BASE_CATEGORIES = ['할일', '메모'];",
  'createpost interfaces'
);
createPost = replaceStrict(
  createPost,
  "  const { addRequest } = useTodoRequestStore();",
  "  const { addRequest } = useTodoRequestStore();\n  const { addToast } = useToastStore();",
  'createpost addToast init'
);
createPost = replaceStrict(createPost, "      const postData: any = {", "      const postData: PostData = {", 'createpost postData type');
createPost = replaceStrict(createPost, "        const requestData: any = {", "        const requestData: RequestData = {", 'createpost requestData type');
createPost = replaceStrict(
  createPost,
  "    } catch (err) {\n      console.error('저장 오류:', err);\n    } finally {",
  "    } catch (err) {\n      console.error('저장 오류:', err);\n      addToast({ message: '게시물 저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    } finally {",
  'createpost handleSubmit catch'
);
createPost = replaceStrict(
  createPost,
  "    } catch (err) {\n      console.error('요청 오류:', err);\n    } finally {",
  "    } catch (err) {\n      console.error('요청 오류:', err);\n      addToast({ message: '요청 전송에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    } finally {",
  'createpost handleRequestSubmit catch'
);
fs.writeFileSync(createPostPath, createPost, 'utf8');

const leaveManagerPath = path.join(root, 'src/components/LeaveManager.tsx');
let leaveManager = fs.readFileSync(leaveManagerPath, 'utf8');
leaveManager = replaceStrict(
  leaveManager,
  "import { useEscClose } from '@/hooks/useEscClose';",
  "import { useEscClose } from '@/hooks/useEscClose';\nimport { useToastStore } from '@/store/toastStore';",
  'leavemanager import toast'
);
leaveManager = replaceStrict(
  leaveManager,
  "  const { settings, events, upsertSetting, addLeaveEvent, updateLeaveEvent, deleteLeaveEvent } = useLeaveStore();",
  "  const { settings, events, upsertSetting, addLeaveEvent, updateLeaveEvent, deleteLeaveEvent } = useLeaveStore();\n  const { addToast } = useToastStore();",
  'leavemanager addToast init'
);
leaveManager = replaceStrict(
  leaveManager,
  "    await upsertSetting({\n      userId: selectedUser.id,\n      userName: selectedUser.name,\n      joinDate: normalizedJoinDate,\n      manualUsedDays: Number(manualUsedDraft) || 0,\n    });",
  "    try {\n      await upsertSetting({\n        userId: selectedUser.id,\n        userName: selectedUser.name,\n        joinDate: normalizedJoinDate,\n        manualUsedDays: Number(manualUsedDraft) || 0,\n      });\n    } catch (e) {\n      console.error(e);\n      addToast({ message: '설정 저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    }",
  'leavemanager handleSaveSetting'
);
leaveManager = replaceStrict(
  leaveManager,
  "    if (editTargetId) {\n      const current = userEvents.find((e) => e.id === editTargetId);\n      if (!current) return;\n      const locked = current.confirmed || isPastOrToday(current.date);\n      if (locked && !isAdmin) return;\n      await updateLeaveEvent(editTargetId, payload);\n    } else {\n      await addLeaveEvent(payload);\n    }\n\n    setShowAdd(false);",
  "    try {\n      if (editTargetId) {\n        const current = userEvents.find((e) => e.id === editTargetId);\n        if (!current) return;\n        const locked = current.confirmed || isPastOrToday(current.date);\n        if (locked && !isAdmin) return;\n        await updateLeaveEvent(editTargetId, payload);\n      } else {\n        await addLeaveEvent(payload);\n      }\n      setShowAdd(false);\n    } catch (e) {\n      console.error(e);\n      addToast({ message: '연차 저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    }",
  'leavemanager handleSaveLeave'
);
leaveManager = replaceStrict(
  leaveManager,
  "    await deleteLeaveEvent(event.id);",
  "    try {\n      await deleteLeaveEvent(event.id);\n    } catch (e) {\n      console.error(e);\n      addToast({ message: '연차 삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });\n    }",
  'leavemanager handleDelete'
);
fs.writeFileSync(leaveManagerPath, leaveManager, 'utf8');

console.log('updated');
