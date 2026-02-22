import type { About, Homepage, Settings } from '../../config/pocketbase'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb, { clearCache, getImageUrl } from '../../config/pocketbase'
import AboutPopup from '../AboutPopup'

interface SettingsSidebarProps {
  isOpen: boolean
  onClose: () => void
  onShowToast: (message: string, type: 'success' | 'error') => void
}

export default function SettingsSidebar({
  isOpen,
  onClose,
  onShowToast,
}: SettingsSidebarProps) {
  const [loading, setLoading] = useState(false)
  const [aboutData, setAboutData] = useState<About | null>(null)
  const [homepageData, setHomepageData] = useState<Homepage | null>(null)
  const [settingsData, setSettingsData] = useState<Settings | null>(null)
  const faviconFileInputRef = useRef<HTMLInputElement>(null)

  // Form fields - Homepage
  const [heroTitle, setHeroTitle] = useState('')

  // Form fields - Settings
  const [showTopProgressBar, setShowTopProgressBar] = useState(false)
  const [mobileFontSize, setMobileFontSize] = useState(1.25)
  const [tabletFontSize, setTabletFontSize] = useState(1.875)
  const [desktopFontSize, setDesktopFontSize] = useState(2.25)
  const [largeDesktopFontSize, setLargeDesktopFontSize] = useState(3)
  const [faviconUrl, setFaviconUrl] = useState<string>('')

  // Form fields - About
  const [aboutDescription, setAboutDescription] = useState('')
  const [expertiseDescription, setExpertiseDescription] = useState('')
  const [clientList, setClientList] = useState<string[]>([])
  const [newClient, setNewClient] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch About data
      const about = await pb
        .collection('About')
        .getFirstListItem<About>('Is_Active = true')
      setAboutData(about)
      setAboutDescription(about.About_Description)
      setExpertiseDescription(about.Expertise_Description)
      setClientList(about.Client_List_Json || about.Client_List || [])
      setContactEmail(about.Contact_Email)

      // Fetch Homepage data
      const homepage = await pb
        .collection('Homepage')
        .getFirstListItem<Homepage>('Is_Active = true')
      setHomepageData(homepage)
      setHeroTitle(homepage.Hero_Title)

      // Fetch Settings data
      const settings = await pb
        .collection('Settings')
        .getFirstListItem<Settings>('')
      setSettingsData(settings)
      setShowTopProgressBar(settings.Show_Top_Progress_Bar)
      setMobileFontSize(settings.Mobile_Font_Size)
      setTabletFontSize(settings.Tablet_Font_Size)
      setDesktopFontSize(settings.Desktop_Font_Size)
      setLargeDesktopFontSize(settings.Large_Desktop_Font_Size)

      // Load favicon if exists
      if (settings.favicon) {
        const faviconImageUrl = getImageUrl(settings, settings.favicon)
        setFaviconUrl(faviconImageUrl)
      }
    }
    catch (err) {
      console.error('Error fetching settings:', err)
    }
    finally {
      setLoading(false)
    }
  }

  // Fetch data when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const handleAddClient = () => {
    if (newClient.trim()) {
      setClientList([...clientList, newClient.trim()
        .toUpperCase()])
      setNewClient('')
    }
  }

  const handleRemoveClient = (index: number) => {
    setClientList(clientList.filter((_, i) => i !== index))
  }

  const handleFaviconUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !settingsData)
      return

    try {
      const formData = new FormData()
      formData.append('favicon', file)

      await pb.collection('Settings')
        .update(settingsData.id, formData)

      clearCache('Settings')

      // Refresh favicon URL
      const updatedSettings = await pb
        .collection('Settings')
        .getOne<Settings>(settingsData.id)
      if (updatedSettings.favicon) {
        const faviconImageUrl = getImageUrl(
          updatedSettings,
          updatedSettings.favicon,
        )
        setFaviconUrl(faviconImageUrl)
      }

      onShowToast(
        'Favicon updated! Please refresh the page to see the changes.',
        'success',
      )
    }
    catch (err: unknown) {
      console.error('Error updating favicon:', err)
      const error = err as { message?: string }
      onShowToast(
        `Failed to update favicon: ${error?.message || 'Unknown error'}`,
        'error',
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update Homepage
      if (homepageData) {
        await pb.collection('Homepage')
          .update(homepageData.id, {
            Hero_Title: heroTitle,
          })
        clearCache('Homepage')
      }

      // Update About
      if (aboutData) {
        await pb.collection('About')
          .update(aboutData.id, {
            About_Description: aboutDescription,
            Expertise_Description: expertiseDescription,
            Client_List_Json: clientList,
            Contact_Email: contactEmail,
          })
        clearCache('About')
      }

      // Update Settings
      if (settingsData) {
        await pb.collection('Settings')
          .update(settingsData.id, {
            Show_Top_Progress_Bar: showTopProgressBar,
            Mobile_Font_Size: mobileFontSize,
            Tablet_Font_Size: tabletFontSize,
            Desktop_Font_Size: desktopFontSize,
            Large_Desktop_Font_Size: largeDesktopFontSize,
          })
        clearCache('Settings')
      }

      onShowToast('Settings saved successfully!', 'success')
      onClose()
    }
    catch (err: unknown) {
      console.error('Error saving settings:', err)
      const error = err as { message?: string }
      onShowToast(
        `Failed to save settings: ${error?.message || 'Unknown error'}`,
        'error',
      )
    }
    finally {
      setLoading(false)
    }
  }

  // Create preview data combining form values with existing aboutData
  const previewAboutData: About | null = aboutData
    ? {
        ...aboutData,
        About_Description: aboutDescription,
        Expertise_Description: expertiseDescription,
        Client_List_Json: clientList,
        Contact_Email: contactEmail,
      }
    : null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="bg-muted/70 fixed inset-0 z-40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* About Popup Preview */}
          <div
            className="fixed top-1/2"
            style={{
              left: '25%',
              transform: 'translate(-50%, -50%)',
              zIndex: 45,
            }}
          >
            <AboutPopup
              isVisible={true}
              onClose={() => {}}
              aboutData={previewAboutData}
            />
          </div>

          {/* Sidebar */}
          <motion.div
            className="bg-popover border-border fixed top-0 right-0 z-50 flex h-full w-3/4 flex-col border-l backdrop-blur-xl md:w-1/2"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ fontFamily: 'EnduroWeb, sans-serif' }}
          >
            <form onSubmit={handleSubmit} className="flex h-full flex-col">
              {/* Sticky Header */}
              <div className="border-border flex flex-shrink-0 items-center gap-4 border-b p-8 backdrop-blur-sm">
                {/* Header Text */}
                <div className="flex-1">
                  <h2 className="text-foreground text-xl font-medium tracking-tight">
                    Settings
                  </h2>
                  <p className="text-muted-foreground mt-1 text-xs tracking-wide uppercase">
                    Configure site content
                  </p>
                </div>

                {/* Favicon Avatar */}
                <div
                  onClick={() => faviconFileInputRef.current?.click()}
                  className="bg-muted border-border hover:border-ring/50 group h-12 w-12 flex-shrink-0 cursor-pointer overflow-hidden rounded-sm border transition-all"
                  title="Click to update favicon"
                >
                  {faviconUrl
                    ? (
                        <img
                          src={faviconUrl}
                          alt="Favicon"
                          className="h-full w-full object-cover"
                        />
                      )
                    : (
                        <div className="text-muted-foreground group-hover:text-foreground flex h-full w-full items-center justify-center transition-colors">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={faviconFileInputRef}
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  onChange={handleFaviconUpdate}
                  className="hidden"
                />
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 space-y-8 overflow-y-auto p-8">
                {/* Hero Section */}
                <div>
                  <h3 className="text-foreground mb-4 text-sm font-medium tracking-wider uppercase">
                    Hero Section
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-xs tracking-wider uppercase">
                      Hero Title
                    </Label>
                    <Input
                      value={heroTitle}
                      onChange={e => setHeroTitle(e.target.value)}
                      placeholder="Creative Strategy and Communication"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-border border-t"></div>

                {/* About Section */}
                <div>
                  <h3 className="text-foreground mb-4 text-sm font-medium tracking-wider uppercase">
                    About Section
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider uppercase">
                        About Description
                      </Label>
                      <textarea
                        value={aboutDescription}
                        onChange={e => setAboutDescription(e.target.value)}
                        rows={4}
                        className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full resize-none rounded-md border bg-transparent px-4 py-3 text-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider uppercase">
                        Expertise Description
                      </Label>
                      <textarea
                        value={expertiseDescription}
                        onChange={e =>
                          setExpertiseDescription(e.target.value)}
                        rows={3}
                        className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full resize-none rounded-md border bg-transparent px-4 py-3 text-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <Label className="mb-3 text-xs tracking-wider uppercase">
                        Client List
                      </Label>

                      <div className="mb-3 flex gap-2">
                        <Input
                          value={newClient}
                          onChange={e => setNewClient(e.target.value)}
                          onKeyPress={e =>
                            e.key === 'Enter'
                            && (e.preventDefault(), handleAddClient())}
                          placeholder="e.g., NIKE"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddClient}
                        >
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {clientList.map((client, idx) => (
                          <div
                            key={`${client}-${idx}`}
                            className="bg-muted text-foreground border-border flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs"
                          >
                            {client}
                            <button
                              type="button"
                              onClick={() => handleRemoveClient(idx)}
                              className="text-destructive hover:text-destructive/80 text-sm transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-border border-t"></div>

                {/* Global Settings */}
                <div>
                  <h3 className="text-foreground mb-4 text-sm font-medium tracking-wider uppercase">
                    Global Settings
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider uppercase">
                        Contact Email
                      </Label>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        placeholder="hello@example.com"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 text-xs tracking-wider uppercase">
                        Font Sizes (rem)
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">
                            Mobile
                          </Label>
                          <Input
                            type="number"
                            step="0.125"
                            value={mobileFontSize}
                            onChange={e =>
                              setMobileFontSize(Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">
                            Tablet
                          </Label>
                          <Input
                            type="number"
                            step="0.125"
                            value={tabletFontSize}
                            onChange={e =>
                              setTabletFontSize(Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">
                            Desktop
                          </Label>
                          <Input
                            type="number"
                            step="0.125"
                            value={desktopFontSize}
                            onChange={e =>
                              setDesktopFontSize(Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">
                            Large
                          </Label>
                          <Input
                            type="number"
                            step="0.125"
                            value={largeDesktopFontSize}
                            onChange={e =>
                              setLargeDesktopFontSize(Number.parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={showTopProgressBar}
                          onChange={e =>
                            setShowTopProgressBar(e.target.checked)}
                          className="border-input bg-background h-4 w-4 rounded-sm border"
                        />
                        <span className="text-foreground text-xs font-medium tracking-wider uppercase">
                          Show Top Progress Bar
                        </span>
                      </label>
                      <p className="text-muted-foreground mt-1 ml-7 text-xs">
                        Display progress bar at top of carousel
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="border-border flex flex-shrink-0 gap-3 border-t p-8 backdrop-blur-sm">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
