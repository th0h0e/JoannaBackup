import type { About, Homepage, Settings } from '../../config/pocketbase'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb, { getImageUrl } from '../../config/pocketbase'
import AboutPopup from '../AboutPopup'

interface SettingsSidebarProps {
  isOpen: boolean
  onClose: () => void
  onShowToast: (message: string, type: 'success' | 'error') => void
}

export default function SettingsSidebar({ isOpen, onClose, onShowToast }: SettingsSidebarProps) {
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
      const about = await pb.collection('About').getFirstListItem<About>('Is_Active = true')
      setAboutData(about)
      setAboutDescription(about.About_Description)
      setExpertiseDescription(about.Expertise_Description)
      setClientList(about.Client_List_Json || about.Client_List || [])
      setContactEmail(about.Contact_Email)

      // Fetch Homepage data
      const homepage = await pb.collection('Homepage').getFirstListItem<Homepage>('Is_Active = true')
      setHomepageData(homepage)
      setHeroTitle(homepage.Hero_Title)

      // Fetch Settings data
      const settings = await pb.collection('Settings').getFirstListItem<Settings>('')
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
      setClientList([...clientList, newClient.trim().toUpperCase()])
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

      await pb.collection('Settings').update(settingsData.id, formData)

      // Refresh favicon URL
      const updatedSettings = await pb.collection('Settings').getOne<Settings>(settingsData.id)
      if (updatedSettings.favicon) {
        const faviconImageUrl = getImageUrl(updatedSettings, updatedSettings.favicon)
        setFaviconUrl(faviconImageUrl)
      }

      onShowToast('Favicon updated! Please refresh the page to see the changes.', 'success')
    }
    catch (err: unknown) {
      console.error('Error updating favicon:', err)
      const error = err as { message?: string }
      onShowToast(`Failed to update favicon: ${error?.message || 'Unknown error'}`, 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update Homepage
      if (homepageData) {
        await pb.collection('Homepage').update(homepageData.id, {
          Hero_Title: heroTitle,
        })
      }

      // Update About
      if (aboutData) {
        await pb.collection('About').update(aboutData.id, {
          About_Description: aboutDescription,
          Expertise_Description: expertiseDescription,
          Client_List_Json: clientList,
          Contact_Email: contactEmail,
        })
      }

      // Update Settings
      if (settingsData) {
        await pb.collection('Settings').update(settingsData.id, {
          Show_Top_Progress_Bar: showTopProgressBar,
          Mobile_Font_Size: mobileFontSize,
          Tablet_Font_Size: tabletFontSize,
          Desktop_Font_Size: desktopFontSize,
          Large_Desktop_Font_Size: largeDesktopFontSize,
        })
      }

      onShowToast('Settings saved successfully!', 'success')
      onClose()
    }
    catch (err: unknown) {
      console.error('Error saving settings:', err)
      const error = err as { message?: string }
      onShowToast(`Failed to save settings: ${error?.message || 'Unknown error'}`, 'error')
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
            className="fixed inset-0 bg-muted/70 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* About Popup Preview */}
          <div className="fixed top-1/2" style={{ left: '25%', transform: 'translate(-50%, -50%)', zIndex: 45 }}>
            <AboutPopup
              isVisible={true}
              onClose={() => {}}
              aboutData={previewAboutData}
            />
          </div>

          {/* Sidebar */}
          <motion.div
            className="fixed right-0 top-0 h-full w-3/4 md:w-1/2 bg-popover backdrop-blur-xl border-l border-border z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ fontFamily: 'EnduroWeb, sans-serif' }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Sticky Header */}
              <div className="flex-shrink-0 p-8 border-b border-border flex items-center gap-4 backdrop-blur-sm">
                {/* Header Text */}
                <div className="flex-1">
                  <h2 className="text-xl font-medium text-foreground tracking-tight">
                    Settings
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">
                    Configure site content
                  </p>
                </div>

                {/* Favicon Avatar */}
                <div
                  onClick={() => faviconFileInputRef.current?.click()}
                  className="flex-shrink-0 w-12 h-12 rounded-sm bg-muted border border-border hover:border-ring/50 cursor-pointer transition-all overflow-hidden group"
                  title="Click to update favicon"
                >
                  {faviconUrl
                    ? (
                        <img
                          src={faviconUrl}
                          alt="Favicon"
                          className="w-full h-full object-cover"
                        />
                      )
                    : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
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
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Hero Section */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider">Hero Section</h3>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider">
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
                <div className="border-t border-border"></div>

                {/* About Section */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider">About Section</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider">
                        About Description
                      </Label>
                      <textarea
                        value={aboutDescription}
                        onChange={e => setAboutDescription(e.target.value)}
                        rows={4}
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider">
                        Expertise Description
                      </Label>
                      <textarea
                        value={expertiseDescription}
                        onChange={e => setExpertiseDescription(e.target.value)}
                        rows={3}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                    </div>

                    <div>
                      <Label className="text-xs uppercase tracking-wider mb-3">
                        Client List
                      </Label>

                      <div className="flex gap-2 mb-3">
                        <Input
                          value={newClient}
                          onChange={e => setNewClient(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddClient())}
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
                            className="flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-sm text-xs border border-border"
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
                <div className="border-t border-border"></div>

                {/* Global Settings */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider">Global Settings</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider">
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
                      <Label className="text-xs uppercase tracking-wider mb-2">
                        Font Sizes (rem)
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Mobile</Label>
                          <Input
                            type="number"
                            step="0.125"
                            value={mobileFontSize}
                            onChange={e => setMobileFontSize(Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Tablet</Label>
                          <Input
                            type="number"
                            step="0.125"
                            value={tabletFontSize}
                            onChange={e => setTabletFontSize(Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Desktop</Label>
                          <Input
                            type="number"
                            step="0.125"
                            value={desktopFontSize}
                            onChange={e => setDesktopFontSize(Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Large</Label>
                          <Input
                            type="number"
                            step="0.125"
                            value={largeDesktopFontSize}
                            onChange={e => setLargeDesktopFontSize(Number.parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showTopProgressBar}
                          onChange={e => setShowTopProgressBar(e.target.checked)}
                          className="w-4 h-4 rounded-sm border border-input bg-background"
                        />
                        <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                          Show Top Progress Bar
                        </span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1 ml-7">
                        Display progress bar at top of carousel
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex-shrink-0 p-8 border-t border-border flex gap-3 backdrop-blur-sm">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
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
