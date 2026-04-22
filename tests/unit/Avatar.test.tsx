import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Avatar from '@/components/common/Avatar'

afterEach(() => cleanup())

describe('Avatar 컴포넌트 분기', () => {
  test('photoURL 빈 값 → data-empty="true" + "?" 텍스트 렌더', () => {
    render(<Avatar photoURL="" name="홍길동" size={40} />)
    const el = screen.getByTestId('avatar')
    expect(el).toHaveAttribute('data-empty', 'true')
    expect(el).toHaveTextContent('?')
    expect(el.querySelector('img')).toBeNull()
  })

  test('photoURL 값 있음 → img 태그 렌더 + data-empty 속성 없음', () => {
    const url = 'https://example.com/profile.jpg'
    render(<Avatar photoURL={url} name="홍길동" size={40} />)
    const el = screen.getByTestId('avatar')
    expect(el).not.toHaveAttribute('data-empty')
    expect(el).not.toHaveTextContent('?')
    const img = el.querySelector('img') as HTMLImageElement | null
    expect(img).not.toBeNull()
    expect(img!.src).toBe(url)
    expect(img!.alt).toBe('홍길동')
  })

  test('photoURL undefined → 기본 아바타로 동일 처리', () => {
    render(<Avatar name="홍길동" size={28} />)
    const el = screen.getByTestId('avatar')
    expect(el).toHaveAttribute('data-empty', 'true')
    expect(el.querySelector('img')).toBeNull()
  })
})
