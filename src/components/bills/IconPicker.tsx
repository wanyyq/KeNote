import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Comprehensive list of Lucide icon names for the picker
const ALL_LUCIDE_ICONS = [
  'activity', 'airplay', 'alarm-clock', 'alert-circle', 'anchor', 'aperture', 'archive', 'award',
  'baby', 'banknote', 'barcode', 'battery', 'beef', 'bell', 'bike', 'bird', 'bolt',
  'book-open', 'bookmark', 'briefcase', 'building', 'bus', 'calculator', 'calendar', 'camera',
  'car', 'chart-line', 'check-circle', 'chrome', 'circle', 'clock', 'cloud', 'code', 'coffee',
  'compass', 'cookie', 'copy', 'credit-card', 'crown', 'database', 'diamond', 'dollar-sign',
  'download', 'droplet', 'dumbbell', 'edit', 'eye', 'feather', 'file-text', 'film',
  'flag', 'flame', 'folder', 'gamepad-2', 'gem', 'gift', 'git-branch', 'globe',
  'graduation-cap', 'grid', 'hard-drive', 'hash', 'headphones', 'heart', 'home', 'image',
  'inbox', 'info', 'key', 'laptop', 'layers', 'layout', 'leaf', 'lightbulb', 'link',
  'list', 'lock', 'mail', 'map', 'map-pin', 'message-circle', 'mic', 'monitor', 'moon',
  'more-horizontal', 'mouse-pointer', 'music', 'navigation', 'notebook', 'package', 'palette', 'paperclip',
  'pause', 'pen-tool', 'percent', 'phone', 'pie-chart', 'piggy-bank', 'pin', 'play',
  'power', 'printer', 'radio', 'refresh-cw', 'repeat', 'rocket', 'rss', 'save',
  'scissors', 'search', 'server', 'settings', 'share', 'shield', 'shopping-bag', 'shopping-cart',
  'shuffle', 'skip-back', 'skip-forward', 'sliders', 'smartphone', 'smile', 'speaker', 'star',
  'sun', 'table', 'tag', 'target', 'terminal', 'thermometer', 'thumbs-up', 'toggle-left',
  'trash', 'trending-up', 'truck', 'tv', 'umbrella', 'unlock', 'upload', 'user',
  'users', 'utensils', 'video', 'volume', 'wallet', 'watch', 'wifi', 'wind', 'wrench', 'zap',
]

interface IconPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (iconName: string) => void
  selected?: string
}

export default function IconPicker({ open, onOpenChange, onSelect, selected }: IconPickerProps) {
  const [search, setSearch] = useState('')

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return ALL_LUCIDE_ICONS
    const q = search.toLowerCase()
    return ALL_LUCIDE_ICONS.filter((name) => name.includes(q))
  }, [search])

  const handleSelect = (iconName: string) => {
    onSelect(iconName)
    setSearch('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>选择图标</DialogTitle></DialogHeader>
        <div className="relative">
          <i data-lucide="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
          <Input placeholder="搜索图标..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" autoFocus />
        </div>
        <Separator />
        <ScrollArea className="flex-1 -mx-2">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 p-2">
            {filteredIcons.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => handleSelect(iconName)}
                className={cn(
                  'flex flex-col items-center gap-0.5 p-2 rounded-md transition-colors hover:bg-accent',
                  selected === iconName && 'bg-accent ring-1 ring-ring'
                )}
                title={iconName}
              >
                <i data-lucide={iconName} className="w-[22px] h-[22px]"></i>
                <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">
                  {iconName.length > 8 ? iconName.slice(0, 7) + '…' : iconName}
                </span>
              </button>
            ))}
            {filteredIcons.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">未找到匹配的图标</div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
