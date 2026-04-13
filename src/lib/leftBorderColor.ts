import { Post } from '@/store/postStore';

/** 메모 좌측 띠 (2분기: 업무/개인) */
export function postLeftBorderColor(post: Post): string {
  if (post.taskType === 'personal') return '#7B5EA7';
  return '#C17B6B';
}

/** 할일 좌측 띠 (3분기: 요청/개인/업무) */
export function todoLeftBorderColor(todo: Post): string {
  if (todo.requestFrom) return '#993556';
  if (todo.taskType === 'personal') return '#7B5EA7';
  return '#C17B6B';
}
