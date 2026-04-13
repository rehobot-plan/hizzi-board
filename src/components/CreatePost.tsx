'use client';

import { useState, useRef, type CSSProperties } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePostStore } from '@/store/postStore';
import { useUserStore } from '@/store/userStore';
import { usePanelStore } from '@/store/panelStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useEscClose } from '@/hooks/useEscClose';
import { useToastStore } from '@/store/toastStore';
import { getEventColor } from '@/lib/calendar-helpers';

interface CreatePostProps {
  panelId: string;
  onClose: (savedCategory?: string) => void;
  categories?: string[];
  defaultCategory?: string;
}

interface PostData {
  panelId: string;
  title?: string;
  content: string;
  author: string;
  category: string;
  visibleTo: string[];
  taskType?: 'work' | 'personal';
  dueDate?: string;
  attachment?: { type: 'image' | 'file' | 'link'; url: string; name?: string };
}

interface RequestData {
  fromEmail: string;
  fromPanelId: string;
  toEmail: string;
  toPanelId: string;
  title: string;
  content: string;
  visibleTo: string[];
  teamLabel?: string;
  teamRequestId?: string;
  dueDate?: string;
}

type TabType = 'todo' | 'memo' | 'request';
type TaskType = 'work' | 'personal';
type VisibilityType = 'all' | 'me' | 'specific';
type RequestVisibilityType = 'requestOnly' | 'all' | 'specific';

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const cleaned = { ...obj } as Record<string, unknown>;
  Object.keys(cleaned).forEach(k => {
    if (cleaned[k] === undefined) delete cleaned[k];
  });
  return cleaned as Partial<T>;
}

const parseDateInput = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  return '';
};

export default function CreatePost({ panelId, onClose }: CreatePostProps) {
  const { user } = useAuthStore();
  const { addPost } = usePostStore();
  const { users } = useUserStore();
  const { panels } = usePanelStore();
  const { addRequest } = useTodoRequestStore();
  const { addToast } = useToastStore();

  const myEmail = user?.email ?? '';
  const myPanel = panels.find(p => p.ownerEmail === myEmail);
  const otherUsers = users.filter(u => u.email !== myEmail && u.role !== 'admin');

  const [activeTab, setActiveTab] = useState<TabType>('todo');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [taskType, setTaskType] = useState<TaskType>('work');
  const [visibility, setVisibility] = useState<VisibilityType>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [dueDateInput, setDueDateInput] = useState('');
  const [requestDueDateInput, setRequestDueDateInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);

  const [requestTo, setRequestTo] = useState<string[]>([]);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestContent, setRequestContent] = useState('');
  const [requestDueDate, setRequestDueDate] = useState('');
  const [requestVisibility, setRequestVisibility] = useState<RequestVisibilityType>('requestOnly');
  const [requestSpecificUsers, setRequestSpecificUsers] = useState<string[]>([]);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  useEscClose(onClose, true);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setTitle('');
    setContent('');
    setAttachFile(null);
    setDueDate('');
    setDueDateInput('');
    setAddToCalendar(false);
    setRequestDueDateInput('');
    setVisibility('all');
    setSelectedUsers([]);
  };

  const getVisibleTo = (): string[] => {
    if (visibility === 'all') return [];
    if (visibility === 'me') return [myEmail];
    return [myEmail, ...selectedUsers.filter(e => e !== myEmail)];
  };

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;
    setUploading(true);
    try {
      let attachment: PostData['attachment'] = undefined;
      if (attachFile) {
        const storageRef = ref(storage, `uploads/${panelId}/${Date.now()}_${attachFile.name}`);
        await uploadBytes(storageRef, attachFile);
        const url = await getDownloadURL(storageRef);
        const ext = attachFile.type.startsWith('image/') ? 'image' : 'file';
        attachment = { type: ext, url, name: attachFile.name };
      }

      const postData: PostData = {
        panelId,
        content: content.trim(),
        author: myEmail,
        category: activeTab === 'todo' ? '할일' : '메모',
        visibleTo: getVisibleTo(),
      };

      if (activeTab === 'todo') {
        if (title.trim()) postData.title = title.trim();
        postData.taskType = taskType;
        if (dueDate) postData.dueDate = dueDate;
      }
      if (activeTab === 'memo') {
        postData.taskType = taskType;
      }
      if (attachment) postData.attachment = attachment;

      await addPost(stripUndefined(postData) as PostData);

      if (activeTab === 'todo' && dueDate && addToCalendar) {
        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
          const visibleTo = getVisibleTo();
          const visibility = !visibleTo || visibleTo.length === 0 ? 'all' : visibleTo.length === 1 && visibleTo[0] === myEmail ? 'me' : 'specific';
          const color = getEventColor(taskType, visibility);
        await addDoc(collection(db, 'calendarEvents'), stripUndefined({
          title: content.trim(),
          startDate: dueDate,
          endDate: dueDate,
          authorId: myEmail,
          authorName: users.find(u => u.email === myEmail)?.name || myEmail.split('@')[0],
          color,
          taskType,
          visibility: visibility === 'all' ? 'all' : visibility === 'me' ? 'me' : 'specific',
          createdAt: serverTimestamp(),
        }));
      }

      onClose(activeTab === 'todo' ? '할일' : '메모');
    } catch (err) {
      console.error('저장 오류:', err);
      addToast({ message: '게시물 저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleRequestSubmit = async () => {
    if (!requestTitle.trim() || requestTo.length === 0) return;
    const panelOwnerEmail = myPanel?.ownerEmail || myEmail;
    const fromPanelId = myPanel?.id || 'admin';
    setRequestSubmitting(true);
    try {
      const isTeam = requestTo.length > 1;
      const teamLabel = isTeam
        ? requestTo.map(e => users.find(u => u.email === e)?.name || e.split('@')[0]).join(', ')
        : undefined;
      const teamRequestId = isTeam
        ? `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        : undefined;

      for (const toEmail of requestTo) {
        const toPanel = panels.find(p => p.ownerEmail === toEmail);
        if (!toPanel) continue;

        let visibleTo: string[] = [];
        if (requestVisibility === 'requestOnly') visibleTo = [panelOwnerEmail, ...requestTo];
        else if (requestVisibility === 'all') visibleTo = [];
        else if (requestVisibility === 'specific') {
          visibleTo = [panelOwnerEmail, ...requestTo, ...requestSpecificUsers.filter(e => !requestTo.includes(e) && e !== panelOwnerEmail)];
        }

        const requestData: RequestData = {
          fromEmail: panelOwnerEmail,
          fromPanelId,
          toEmail,
          toPanelId: toPanel.id,
          title: requestTitle.trim(),
          content: requestContent.trim(),
          visibleTo,
          teamLabel,
          teamRequestId,
          dueDate: requestDueDate || undefined,
        };

        await addRequest(stripUndefined(requestData) as RequestData);
      }
      onClose();
    } catch (err) {
      console.error('요청 오류:', err);
      addToast({ message: '요청 전송에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setRequestSubmitting(false);
    }
  };

  const divBtn = (active: boolean, colorOn: string, bgOn: string, borderOn: string, colorOff: string, borderOff: string) => ({
    fontSize: 11, padding: '5px 13px', borderRadius: 3, cursor: 'pointer' as const,
    border: `1px solid ${active ? borderOn : borderOff}`,
    color: active ? colorOn : colorOff,
    background: active ? bgOn : 'transparent',
    transition: 'all 0.15s ease',
  });

  const taskBtnStyle = (t: TaskType) => {
    const isOn = taskType === t;
    if (t === 'work') return divBtn(isOn, '#C17B6B', '#FFF5F2', '#C17B6B', 'rgba(193,123,107,0.45)', 'rgba(193,123,107,0.35)');
    return divBtn(isOn, '#7B5EA7', '#F0ECF5', '#7B5EA7', 'rgba(123,94,167,0.45)', 'rgba(123,94,167,0.35)');
  };

  const visBtnStyle = (v: VisibilityType) => {
    const isOn = visibility === v;
    const map = {
      all: { on: '#3B6D11', border: '#639922', offC: 'rgba(59,109,17,0.45)', offB: 'rgba(99,153,34,0.35)' },
      me: { on: '#185FA5', border: '#378ADD', offC: 'rgba(24,95,165,0.45)', offB: 'rgba(55,138,221,0.35)' },
      specific: { on: '#854F0B', border: '#BA7517', offC: 'rgba(133,79,11,0.45)', offB: 'rgba(186,117,23,0.35)' },
    };
    const c = map[v];
    return divBtn(isOn, c.on, 'transparent', c.border, c.offC, c.offB);
  };

  const reqVisBtnStyle = (v: RequestVisibilityType) => {
    const isOn = requestVisibility === v;
    if (v === 'requestOnly') return divBtn(isOn, '#993556', '#FBEAF0', '#993556', 'rgba(153,53,86,0.45)', 'rgba(153,53,86,0.35)');
    if (v === 'all') return divBtn(isOn, '#3B6D11', 'transparent', '#639922', 'rgba(59,109,17,0.45)', 'rgba(99,153,34,0.35)');
    return divBtn(isOn, '#854F0B', 'transparent', '#BA7517', 'rgba(133,79,11,0.45)', 'rgba(186,117,23,0.35)');
  };

  const sectionLabel: CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    color: '#C4B8B0', textTransform: 'uppercase', marginBottom: 7,
  };

  const fieldSection: CSSProperties = {
    padding: '12px 20px', borderBottom: '1px solid #EDE5DC',
  };

  const statusTagWork: CSSProperties = {
    fontSize: 10, padding: '2px 7px', borderRadius: 3, marginRight: 4,
    background: taskType === 'personal' ? '#F0ECF5' : '#FFF5F2',
    color: taskType === 'personal' ? '#7B5EA7' : '#C17B6B',
    border: `1px solid ${taskType === 'personal' ? '#7B5EA7' : '#C17B6B'}`,
  };

  const statusTagVis = (): CSSProperties => {
    const map = {
      all: { color: '#3B6D11', border: '1px solid #639922' },
      me: { color: '#185FA5', border: '1px solid #378ADD' },
      specific: { color: '#854F0B', border: '1px solid #BA7517' },
    };
    return { fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'none', ...map[visibility] };
  };

  const tabLabel = { todo: '할일', memo: '메모', request: '요청' };
  const isReady = activeTab === 'request'
    ? requestTitle.trim().length > 0 && requestTo.length > 0
    : activeTab === 'todo' ? title.trim().length > 0 : content.trim().length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', border: '1px solid #EDE5DC', borderRadius: 6, width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#5C1F1F', padding: '15px 20px 13px', flexShrink: 0, minHeight: 52 }}>
          {(() => {
            const titleText = activeTab === 'request' ? requestTitle : activeTab === 'todo' ? title : content;
            if (!titleText.trim()) return null;
            return (
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FDF8F4', lineHeight: 1.4, wordBreak: 'break-word' }}>
                {titleText}
              </div>
            );
          })()}
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #EDE5DC', background: '#fff', flexShrink: 0 }}>
          {(['todo', 'memo', 'request'] as TabType[]).map(tab => (
            <div
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '9px 4px',
                fontSize: 12,
                color: activeTab === tab ? '#5C1F1F' : '#C4B8B0',
                borderBottom: activeTab === tab ? '2px solid #5C1F1F' : '2px solid transparent',
                fontWeight: activeTab === tab ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>
              {tabLabel[tab]}
            </div>
          ))}
        </div>

        <div style={{ background: '#FDF8F4', borderBottom: '1px solid #EDE5DC', padding: '7px 20px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#9E8880', paddingRight: 10, borderRight: '1px solid #D5C9C0', marginRight: 10 }}>
            {activeTab === 'todo' ? '할일' : activeTab === 'memo' ? '메모' : '요청'}
          </span>
          {activeTab === 'request' ? (
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: '#FBEAF0', color: '#993556', border: '1px solid #993556' }}>요청</span>
          ) : (
            <>
              <span style={statusTagWork}>{taskType === 'personal' ? '개인' : '업무'}</span>
              <span style={statusTagVis()}>{visibility === 'all' ? '전체' : visibility === 'me' ? '나만' : '특정'}</span>
            </>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'memo' && (
            <>
              <div style={fieldSection}>
                <div style={sectionLabel}>내용</div>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용을 입력하세요 (선택)" rows={4} style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={fieldSection}>
                <div style={sectionLabel}>첨부파일</div>
                {attachFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '0.5px solid #EDE5DC', background: '#FDFAF8', borderRadius: 3, marginBottom: 6 }}>
                    <span style={{ flex: 1, fontSize: 12, color: '#2C1810' }}>{attachFile.name}</span>
                    <span onClick={() => setAttachFile(null)} style={{ fontSize: 13, color: '#C4B8B0', cursor: 'pointer' }}>✕</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#C4B8B0', marginBottom: 7 }}>없음</div>
                )}
                <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, border: '0.5px dashed #C17B6B', color: '#C17B6B', fontSize: 12, padding: '7px 10px', borderRadius: 3, cursor: 'pointer', width: '100%' }}>
                  + 파일 추가
                </div>
                <input ref={fileInputRef} type="file" onChange={e => { const f = e.target.files?.[0]; if (f) setAttachFile(f); }} style={{ display: 'none' }} />
              </div>
              <div style={{ borderTop: '1px solid #EDE5DC', margin: '0 20px' }} />
              <div style={{ ...fieldSection, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...sectionLabel, marginBottom: 0, minWidth: 28, flexShrink: 0 }}>구분</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['work', 'personal'] as TaskType[]).map(t => (
                    <div key={t} onClick={() => setTaskType(t)} style={taskBtnStyle(t)}>
                      {t === 'work' ? '업무' : '개인'}
                    </div>
                  ))}
                </div>
              </div>
              <div style={fieldSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ ...sectionLabel, marginBottom: 0, minWidth: 52, flexShrink: 0 }}>보이는 범위</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(['all', 'me', 'specific'] as VisibilityType[]).map(v => (
                      <div key={v} onClick={() => setVisibility(v)} style={visBtnStyle(v)}>
                        {v === 'all' ? '전체' : v === 'me' ? '나만' : '특정'}
                      </div>
                    ))}
                  </div>
                </div>
                {visibility === 'specific' && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                    {otherUsers.map(u => {
                      const sel = selectedUsers.includes(u.email);
                      return (
                        <div key={u.email} onClick={() => setSelectedUsers(prev => sel ? prev.filter(e => e !== u.email) : [...prev, u.email])} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', border: sel ? '1px solid #BA7517' : '1px solid rgba(186,117,23,0.32)', color: sel ? '#854F0B' : 'rgba(133,79,11,0.42)', background: sel ? 'rgba(186,117,23,0.07)' : 'none' }}>
                          {u.name || u.email.split('@')[0]}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'todo' && (
            <>
              <div style={fieldSection}>
                <div style={sectionLabel}>제목</div>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="할일 제목을 입력하세요"
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }}
                />
              </div>
              <div style={fieldSection}>
                <div style={sectionLabel}>내용</div>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="상세 내용을 입력하세요 (선택)" rows={3} style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={fieldSection}>
                <div style={sectionLabel}>기한</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    value={dueDateInput}
                    onChange={e => {
                      const val = e.target.value;
                      setDueDateInput(val);
                      const parsed = parseDateInput(val);
                      if (parsed) setDueDate(parsed);
                      else if (!val) { setDueDate(''); setAddToCalendar(false); }
                    }}
                    placeholder="yyyymmdd"
                    style={{ border: 'none', borderBottom: `1px solid ${dueDate ? '#C17B6B' : '#EDE5DC'}`, padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', width: 110, letterSpacing: '0.04em', fontFamily: 'inherit' }}
                  />
                  {dueDate && (
                    <span style={{ fontSize: 12, color: '#9E8880' }}>
                      {new Date(dueDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}
                    </span>
                  )}
                  <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 12 12" fill="none" style={{ color: '#C4B8B0', cursor: 'pointer' }}>
                      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                      <path d="M1 5h10M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    <input type="date" value={dueDate}
                      onChange={e => {
                        const val = e.target.value;
                        setDueDate(val);
                        setDueDateInput(val.replace(/-/g, ''));
                      }}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                  </div>
                  {dueDate && (
                    <span onClick={() => { setDueDate(''); setDueDateInput(''); setAddToCalendar(false); }}
                      style={{ fontSize: 13, color: '#C4B8B0', cursor: 'pointer', lineHeight: 1, marginLeft: 2 }}>✕</span>
                  )}
                </div>
                {dueDate && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 10, paddingTop: 9, borderTop: '1px dashed #EDE5DC' }}>
                    <div
                      onClick={() => setAddToCalendar(prev => !prev)}
                      style={{ width: 14, height: 14, borderRadius: 2, border: `1px solid ${addToCalendar ? '#C17B6B' : '#D5C9C0'}`, background: addToCalendar ? '#C17B6B' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
                      {addToCalendar && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5l2.5 2.5L8 1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9E8880', lineHeight: 1.45 }}>
                      <span style={{ color: '#C17B6B', fontWeight: 600 }}>캘린더에도 등록</span> - 체크 시 내 캘린더에 일정이 함께 생성됩니다
                    </div>
                  </div>
                )}
              </div>
              <div style={fieldSection}>
                <div style={sectionLabel}>첨부파일</div>
                {attachFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '0.5px solid #EDE5DC', background: '#FDFAF8', borderRadius: 3, marginBottom: 6 }}>
                    <span style={{ flex: 1, fontSize: 12, color: '#2C1810' }}>{attachFile.name}</span>
                    <span onClick={() => setAttachFile(null)} style={{ fontSize: 13, color: '#C4B8B0', cursor: 'pointer' }}>✕</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#C4B8B0', marginBottom: 7 }}>없음</div>
                )}
                <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, border: '0.5px dashed #C17B6B', color: '#C17B6B', fontSize: 12, padding: '7px 10px', borderRadius: 3, cursor: 'pointer', width: '100%' }}>
                  + 파일 추가
                </div>
                <input ref={fileInputRef} type="file" onChange={e => { const f = e.target.files?.[0]; if (f) setAttachFile(f); }} style={{ display: 'none' }} />
              </div>
              <div style={{ borderTop: '1px solid #EDE5DC', margin: '0 20px' }} />
              <div style={{ ...fieldSection, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...sectionLabel, marginBottom: 0, minWidth: 28, flexShrink: 0 }}>구분</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['work', 'personal'] as TaskType[]).map(t => (
                    <div key={t} onClick={() => setTaskType(t)} style={taskBtnStyle(t)}>
                      {t === 'work' ? '업무' : '개인'}
                    </div>
                  ))}
                </div>
              </div>
              <div style={fieldSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ ...sectionLabel, marginBottom: 0, minWidth: 52, flexShrink: 0 }}>보이는 범위</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(['all', 'me', 'specific'] as VisibilityType[]).map(v => (
                      <div key={v} onClick={() => setVisibility(v)} style={visBtnStyle(v)}>
                        {v === 'all' ? '전체' : v === 'me' ? '나만' : '특정'}
                      </div>
                    ))}
                  </div>
                </div>
                {visibility === 'specific' && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                    {otherUsers.map(u => {
                      const sel = selectedUsers.includes(u.email);
                      return (
                        <div key={u.email} onClick={() => setSelectedUsers(prev => sel ? prev.filter(e => e !== u.email) : [...prev, u.email])} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', border: sel ? '1px solid #BA7517' : '1px solid rgba(186,117,23,0.32)', color: sel ? '#854F0B' : 'rgba(133,79,11,0.42)', background: sel ? 'rgba(186,117,23,0.07)' : 'none' }}>
                          {u.name || u.email.split('@')[0]}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'request' && (
            <>
              <div style={fieldSection}>
                <div style={sectionLabel}>받는 사람</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {otherUsers.map(u => {
                    const sel = requestTo.includes(u.email);
                    return (
                      <div key={u.email} onClick={() => setRequestTo(prev => sel ? prev.filter(e => e !== u.email) : [...prev, u.email])} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', border: sel ? '1px solid #993556' : '1px solid rgba(153,53,86,0.3)', color: sel ? '#993556' : 'rgba(153,53,86,0.4)', background: sel ? '#FBEAF0' : 'none' }}>
                        {u.name || u.email.split('@')[0]}
                        {requestTo.length >= 2 && sel && <span style={{ marginLeft: 3, fontSize: 9, color: '#C17B6B' }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
                {requestTo.length >= 2 && (
                  <div style={{ fontSize: 10, color: '#C17B6B', marginTop: 6 }}>팀 요청 ({requestTo.length}명)</div>
                )}
              </div>
              <div style={fieldSection}>
                <div style={sectionLabel}>제목</div>
                <input value={requestTitle} onChange={e => setRequestTitle(e.target.value)} placeholder="요청 제목을 입력하세요" style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
              </div>
              <div style={fieldSection}>
                <div style={sectionLabel}>내용</div>
                <textarea value={requestContent} onChange={e => setRequestContent(e.target.value)} placeholder="요청 내용을 입력하세요 (선택)" rows={3} style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={fieldSection}>
                <div style={sectionLabel}>기한</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    value={requestDueDateInput}
                    onChange={e => {
                      const val = e.target.value;
                      setRequestDueDateInput(val);
                      const parsed = parseDateInput(val);
                      if (parsed) setRequestDueDate(parsed);
                      else if (!val) setRequestDueDate('');
                    }}
                    placeholder="yyyymmdd"
                    style={{ border: 'none', borderBottom: `1px solid ${requestDueDate ? '#C17B6B' : '#EDE5DC'}`, padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', width: 110, letterSpacing: '0.04em', fontFamily: 'inherit' }}
                  />
                  {requestDueDate && (
                    <span style={{ fontSize: 12, color: '#9E8880' }}>
                      {new Date(requestDueDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}
                    </span>
                  )}
                  <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 12 12" fill="none" style={{ color: '#C4B8B0', cursor: 'pointer' }}>
                      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                      <path d="M1 5h10M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    <input type="date" value={requestDueDate}
                      onChange={e => {
                        const val = e.target.value;
                        setRequestDueDate(val);
                        setRequestDueDateInput(val.replace(/-/g, ''));
                      }}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                  </div>
                  {requestDueDate && (
                    <span onClick={() => { setRequestDueDate(''); setRequestDueDateInput(''); }}
                      style={{ fontSize: 13, color: '#C4B8B0', cursor: 'pointer', lineHeight: 1, marginLeft: 2 }}>✕</span>
                  )}
                </div>
              </div>
              <div style={fieldSection}>
                <div style={sectionLabel}>첨부파일</div>
                {attachFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '0.5px solid #EDE5DC', background: '#FDFAF8', borderRadius: 3, marginBottom: 6 }}>
                    <span style={{ flex: 1, fontSize: 12, color: '#2C1810' }}>{attachFile.name}</span>
                    <span onClick={() => setAttachFile(null)} style={{ fontSize: 13, color: '#C4B8B0', cursor: 'pointer' }}>✕</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#C4B8B0', marginBottom: 7 }}>없음</div>
                )}
                <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, border: '0.5px dashed #C17B6B', color: '#C17B6B', fontSize: 12, padding: '7px 10px', borderRadius: 3, cursor: 'pointer', width: '100%' }}>
                  + 파일 추가
                </div>
                <input ref={fileInputRef} type="file" onChange={e => { const f = e.target.files?.[0]; if (f) setAttachFile(f); }} style={{ display: 'none' }} />
              </div>
              <div style={{ borderTop: '1px solid #EDE5DC', margin: '0 20px' }} />
              <div style={fieldSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ ...sectionLabel, marginBottom: 0, minWidth: 52, flexShrink: 0 }}>보이는 범위</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {[
                      { v: 'requestOnly' as const, label: '요청자+수신자' },
                      { v: 'all' as const, label: '전체공개' },
                      { v: 'specific' as const, label: '특정' },
                    ].map(({ v, label }) => (
                      <div key={v} onClick={() => setRequestVisibility(v)} style={reqVisBtnStyle(v)}>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
                {requestVisibility === 'specific' && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: '#C4B8B0', marginBottom: 5 }}>수신자 외 추가:</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {otherUsers.filter(u => !requestTo.includes(u.email)).map(u => {
                        const sel = requestSpecificUsers.includes(u.email);
                        return (
                          <div key={u.email} onClick={() => setRequestSpecificUsers(prev => sel ? prev.filter(e => e !== u.email) : [...prev, u.email])} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', border: sel ? '1px solid #BA7517' : '1px solid rgba(186,117,23,0.32)', color: sel ? '#854F0B' : 'rgba(133,79,11,0.42)', background: sel ? 'rgba(186,117,23,0.07)' : 'none' }}>
                            {u.name || u.email.split('@')[0]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ background: '#FDF8F4', borderTop: '1px solid #EDE5DC', padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button onClick={() => onClose()} style={{ fontSize: 12, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 2px' }}>
            닫기
          </button>
          {activeTab === 'request' ? (
            <button onClick={handleRequestSubmit} disabled={requestSubmitting || !isReady} style={{ fontSize: 12, fontWeight: 700, padding: '6px 18px', borderRadius: 3, background: !isReady ? '#C4B8B0' : '#72243E', color: '#FDF8F4', border: 'none', cursor: !isReady ? 'not-allowed' : 'pointer' }}>
              {requestSubmitting ? '전송 중...' : '요청 보내기'}
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={uploading || !isReady} style={{ fontSize: 12, fontWeight: 700, padding: '6px 18px', borderRadius: 3, background: !isReady ? '#C4B8B0' : '#2C1810', color: '#FDF8F4', border: 'none', cursor: !isReady ? 'not-allowed' : 'pointer' }}>
              {uploading ? '업로드 중...' : '저장'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
