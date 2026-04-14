import { Post } from '@/store/postStore';
import { tagColors } from '@/styles/tokens';

/** 메모 좌측 띠 (2분기: 업무/개인) */
export function postLeftBorderColor(post: Post): string {
  if (post.taskType === 'personal') return tagColors.category.personal.fg;
  return tagColors.category.work.fg;
}

/** 할일 좌측 띠 (3분기: 요청/개인/업무) */
export function todoLeftBorderColor(todo: Post): string {
  if (todo.requestFrom) return tagColors.category.request.fg;
  if (todo.taskType === 'personal') return tagColors.category.personal.fg;
  return tagColors.category.work.fg;
}
