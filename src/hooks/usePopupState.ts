/**
 * @fileoverview Custom hook for managing popup state with mutual exclusion logic.
 *
 * This hook provides centralized state management for the ProjectPopup and AboutPopup
 * components in App.tsx. It implements mutual exclusion between the two popups and
 * a debounce mechanism to prevent accidental popup switching.
 *
 * @module hooks/usePopupState
 * @see {@link ../App.tsx} - Primary consumer of this hook
 * @see {@link ../components/ProjectPopup.tsx} - Project details popup
 * @see {@link ../components/AboutPopup.tsx} - About information popup
 */

import { useCallback, useState } from 'react'
import { useBoolean } from 'usehooks-ts'

/**
 * Project data structure for popup display.
 *
 * @interface ProjectData
 */
interface ProjectData {
  /** The project title displayed in the popup header */
  title: string

  /** The project description text */
  description: string

  /** Optional list of responsibilities/roles for the project */
  responsibility?: string[]
}

/**
 * Return type for the usePopupState hook.
 *
 * @interface UsePopupStateReturn
 */
interface UsePopupStateReturn {
  /** Whether the project popup is currently visible */
  showPopup: boolean

  /** The title of the currently displayed project */
  popupProjectTitle: string

  /** The description of the currently displayed project */
  popupProjectDescription: string

  /** The responsibilities list for the currently displayed project */
  popupProjectResponsibility: string[]

  /** Whether the about popup is currently visible */
  showAboutPopup: boolean

  /**
   * Opens the project popup with the specified project's data.
   * Automatically closes the about popup if open (mutual exclusion).
   *
   * @param projectTitle - The title of the project to display
   */
  handleShowPopup: (projectTitle: string) => void

  /**
   * Closes the project popup and triggers the debounce timer.
   * The about popup cannot be opened for 100ms after closing.
   */
  handleClosePopup: () => void

  /**
   * Opens the about popup if the project popup is not open and
   * the debounce period has not been triggered.
   *
   * @remarks
   * This function implements the mutual exclusion logic:
   * - Returns early if showPopup is true (project popup open)
   * - Returns early if canOpenAboutPopup is false (debounce active)
   */
  handleShowAboutPopup: () => void

  /** Closes the about popup */
  handleCloseAboutPopup: () => void
}

/**
 * Custom hook for managing popup state with mutual exclusion and debouncing.
 *
 * This hook manages the state for two popup components that should never be
 * visible simultaneously. It implements:
 *
 * **Mutual Exclusion Logic:**
 * - Opening one popup automatically closes the other
 * - The handleShowPopup function always calls setShowAboutPopupFalse()
 * - The handleShowAboutPopup function calls setShowPopupFalse() for consistency
 *
 * **Debounce Mechanism (canOpenAboutPopup):**
 * - When the project popup is closed, canOpenAboutPopup is set to false
 * - After a 100ms timeout, canOpenAboutPopup is set back to true
 * - This prevents accidental about popup opening when closing the project popup
 * - The user must wait 100ms before opening the about popup after closing project
 *
 * @param projectsData - Array of project data for looking up popup content
 * @returns Object containing popup state and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   showPopup,
 *   popupProjectTitle,
 *   showAboutPopup,
 *   handleShowPopup,
 *   handleClosePopup,
 *   handleShowAboutPopup,
 * } = usePopupState(projectsData);
 *
 * // Open project popup (closes about popup automatically)
 * handleShowPopup('Project Name');
 *
 * // Close project popup (triggers 100ms debounce)
 * handleClosePopup();
 *
 * // Open about popup (only works if project popup closed and debounce passed)
 * handleShowAboutPopup();
 * ```
 */
export function usePopupState(projectsData: ProjectData[]): UsePopupStateReturn {
  const {
    value: showPopup,
    setTrue: setShowPopupTrue,
    setFalse: setShowPopupFalse,
  } = useBoolean(false)
  const [popupProjectTitle, setPopupProjectTitle] = useState('')
  const [popupProjectDescription, setPopupProjectDescription] = useState('')
  const [popupProjectResponsibility, setPopupProjectResponsibility] = useState<
    string[]
  >([])
  const {
    value: showAboutPopup,
    setTrue: setShowAboutPopupTrue,
    setFalse: setShowAboutPopupFalse,
  } = useBoolean(false)

  /**
   * Debounce flag for about popup opening.
   * Set to false when project popup closes, reset to true after 100ms.
   * Prevents accidental about popup triggering when closing project popup.
   */
  const {
    value: canOpenAboutPopup,
    setTrue: setCanOpenAboutPopupTrue,
    setFalse: setCanOpenAboutPopupFalse,
  } = useBoolean(true)

  /**
   * Opens the project popup with data for the specified project.
   *
   * Implementation details:
   * 1. Finds the project in projectsData by title
   * 2. Sets all popup content state (title, description, responsibility)
   * 3. Closes the about popup (mutual exclusion)
   * 4. Opens the project popup
   */
  const handleShowPopup = useCallback(
    (projectTitle: string) => {
      const project = projectsData.find(p => p.title === projectTitle)
      setPopupProjectTitle(projectTitle)
      setPopupProjectDescription(project?.description || '')
      setPopupProjectResponsibility(project?.responsibility || [])
      setShowAboutPopupFalse()
      setShowPopupTrue()
    },
    [projectsData, setShowAboutPopupFalse, setShowPopupTrue],
  )

  /**
   * Closes the project popup and triggers the debounce mechanism.
   *
   * The debounce prevents the about popup from being opened for 100ms
   * after closing the project popup. This handles the edge case where
   * a user's click/touch might unintentionally trigger the about popup
   * button while closing the project popup.
   */
  const handleClosePopup = useCallback(() => {
    setShowPopupFalse()
    setCanOpenAboutPopupFalse()
    setTimeout(() => {
      setCanOpenAboutPopupTrue()
    }, 100)
  }, [setShowPopupFalse, setCanOpenAboutPopupFalse, setCanOpenAboutPopupTrue])

  /**
   * Opens the about popup if conditions allow.
   *
   * Conditions checked (in order):
   * 1. showPopup must be false (project popup not open)
   * 2. canOpenAboutPopup must be true (debounce not active)
   *
   * If both conditions pass:
   * - Closes project popup (for consistency, though already closed)
   * - Opens about popup
   */
  const handleShowAboutPopup = useCallback(() => {
    if (showPopup || !canOpenAboutPopup)
      return

    setShowPopupFalse()
    setShowAboutPopupTrue()
  }, [showPopup, canOpenAboutPopup, setShowPopupFalse, setShowAboutPopupTrue])

  const handleCloseAboutPopup = useCallback(() => {
    setShowAboutPopupFalse()
  }, [setShowAboutPopupFalse])

  return {
    showPopup,
    popupProjectTitle,
    popupProjectDescription,
    popupProjectResponsibility,
    showAboutPopup,
    handleShowPopup,
    handleClosePopup,
    handleShowAboutPopup,
    handleCloseAboutPopup,
  }
}
