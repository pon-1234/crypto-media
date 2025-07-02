import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  const defaultProps = {
    basePath: '/news',
  }

  it('1ページのみの場合は何も表示しない', () => {
    const { container } = render(
      <Pagination {...defaultProps} currentPage={1} totalPages={1} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('0ページの場合は何も表示しない', () => {
    const { container } = render(
      <Pagination {...defaultProps} currentPage={1} totalPages={0} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('基本的なページネーションを表示する', () => {
    render(<Pagination {...defaultProps} currentPage={2} totalPages={5} />)

    // ページ番号の確認
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    // 前へ・次へボタンの確認
    expect(screen.getByText('前へ')).toBeInTheDocument()
    expect(screen.getByText('次へ')).toBeInTheDocument()
  })

  it('最初のページでは「前へ」ボタンを表示しない', () => {
    render(<Pagination {...defaultProps} currentPage={1} totalPages={5} />)

    expect(screen.queryByText('前へ')).not.toBeInTheDocument()
    expect(screen.getByText('次へ')).toBeInTheDocument()
  })

  it('最後のページでは「次へ」ボタンを表示しない', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={5} />)

    expect(screen.getByText('前へ')).toBeInTheDocument()
    expect(screen.queryByText('次へ')).not.toBeInTheDocument()
  })

  it('現在のページにハイライトスタイルを適用する', () => {
    render(<Pagination {...defaultProps} currentPage={3} totalPages={5} />)

    const currentPageLink = screen.getByRole('link', { name: '3' })
    expect(currentPageLink).toHaveClass('border-blue-500', 'text-blue-600')

    const otherPageLink = screen.getByRole('link', { name: '2' })
    expect(otherPageLink).not.toHaveClass('border-blue-500', 'text-blue-600')
  })

  it('ページ数が多い場合は省略記号を表示する（前後の省略）', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={10} siblingCount={1} />)

    // 最初のページ
    expect(screen.getByText('1')).toBeInTheDocument()

    // 省略記号
    const ellipses = screen.getAllByText('...')
    expect(ellipses).toHaveLength(2)

    // 現在ページ周辺
    expect(screen.queryByText('3')).not.toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.queryByText('7')).not.toBeInTheDocument()

    // 最後のページ
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('ページ数が多い場合は省略記号を表示する（後ろのみ省略）', () => {
    render(<Pagination {...defaultProps} currentPage={3} totalPages={10} siblingCount={1}/>)

    // 最初のページ付近
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()

    // 省略記号
    const ellipses = screen.getAllByText('...')
    expect(ellipses).toHaveLength(1)

    // 最後のページ
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('ページ数が多い場合は省略記号を表示する（前のみ省略）', () => {
    render(<Pagination {...defaultProps} currentPage={8} totalPages={10} siblingCount={1} />)

    // 最初のページ
    expect(screen.getByText('1')).toBeInTheDocument()

    // 省略記号
    const ellipses = screen.getAllByText('...')
    expect(ellipses).toHaveLength(1)

    // 最後のページ付近
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('siblingCountを指定できる', () => {
    render(
      <Pagination
        {...defaultProps}
        currentPage={5}
        totalPages={10}
        siblingCount={1}
      />
    )

    // siblingCount=1の場合、現在ページの前後1ページのみ表示
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()

    // 3と7は表示されない
    expect(screen.queryByText('3')).not.toBeInTheDocument()
    expect(screen.queryByText('7')).not.toBeInTheDocument()
  })

  it('正しいリンクを生成する', () => {
    render(<Pagination {...defaultProps} currentPage={2} totalPages={3} />)

    // ページ番号のリンク
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
      'href',
      '/news?page=1'
    )
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute(
      'href',
      '/news?page=3'
    )

    // 前へ・次へのリンク
    expect(screen.getByRole('link', { name: '前へ' })).toHaveAttribute(
      'href',
      '/news?page=1'
    )
    expect(screen.getByRole('link', { name: '次へ' })).toHaveAttribute(
      'href',
      '/news?page=3'
    )
  })

  it('境界値のケース：隣接ページの場合は省略記号を表示しない', () => {
    render(
      <Pagination
        {...defaultProps}
        currentPage={4}
        totalPages={6}
        siblingCount={1}
      />
    )

    // 3,4,5,6ページが表示され、...は表示されない
    expect(screen.queryByText('...')).not.toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('境界値のケース：最初と最後が隣接する場合', () => {
    render(
      <Pagination
        {...defaultProps}
        currentPage={1}
        totalPages={4}
        siblingCount={2}
      />
    )

    // すべてのページが表示される（省略記号なし）
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.queryByText('...')).not.toBeInTheDocument()
  })

  it('複数の省略記号がある場合、それぞれユニークなキーを持つ', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={10} siblingCount={1}/>)

    // 省略記号の要素を取得
    const ellipses = screen.getAllByText('...')
    expect(ellipses).toHaveLength(2)

    // ページ番号の要素を確認（ユニークなものが表示されている）
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.queryByText('3')).not.toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.queryByText('7')).not.toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })
})
