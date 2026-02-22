import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePopupState } from '@/hooks/usePopupState'

const mockProjects = [
  {
    title: 'Project One',
    description: 'Description one',
    responsibility: ['CREATIVE'],
  },
  {
    title: 'Project Two',
    description: 'Description two',
    responsibility: ['PRODUCTION'],
  },
]

describe('usePopupState', () => {
  it('should initialize with closed popups', () => {
    const { result } = renderHook(() => usePopupState(mockProjects))

    expect(result.current.showPopup).toBe(false)
    expect(result.current.showAboutPopup).toBe(false)
  })

  it('should open project popup with correct data', () => {
    const { result } = renderHook(() => usePopupState(mockProjects))

    act(() => {
      result.current.handleShowPopup('Project One')
    })

    expect(result.current.showPopup).toBe(true)
    expect(result.current.popupProjectTitle).toBe('Project One')
    expect(result.current.popupProjectDescription).toBe('Description one')
    expect(result.current.popupProjectResponsibility).toEqual(['CREATIVE'])
  })

  it('should close project popup', () => {
    const { result } = renderHook(() => usePopupState(mockProjects))

    act(() => {
      result.current.handleShowPopup('Project One')
    })
    expect(result.current.showPopup).toBe(true)

    act(() => {
      result.current.handleClosePopup()
    })
    expect(result.current.showPopup).toBe(false)
  })

  it('should open about popup when project popup is closed', () => {
    const { result } = renderHook(() => usePopupState(mockProjects))

    act(() => {
      result.current.handleShowAboutPopup()
    })

    expect(result.current.showAboutPopup).toBe(true)
  })

  it('should close about popup when project popup opens (mutual exclusion)', () => {
    const { result } = renderHook(() => usePopupState(mockProjects))

    act(() => {
      result.current.handleShowAboutPopup()
    })
    expect(result.current.showAboutPopup).toBe(true)

    act(() => {
      result.current.handleShowPopup('Project One')
    })

    expect(result.current.showPopup).toBe(true)
    expect(result.current.showAboutPopup).toBe(false)
  })

  it('should close about popup', () => {
    const { result } = renderHook(() => usePopupState(mockProjects))

    act(() => {
      result.current.handleShowAboutPopup()
    })
    expect(result.current.showAboutPopup).toBe(true)

    act(() => {
      result.current.handleCloseAboutPopup()
    })
    expect(result.current.showAboutPopup).toBe(false)
  })

  it('should handle unknown project title gracefully', () => {
    const { result } = renderHook(() => usePopupState(mockProjects))

    act(() => {
      result.current.handleShowPopup('Unknown Project')
    })

    expect(result.current.showPopup).toBe(true)
    expect(result.current.popupProjectTitle).toBe('Unknown Project')
    expect(result.current.popupProjectDescription).toBe('')
    expect(result.current.popupProjectResponsibility).toEqual([])
  })
})
