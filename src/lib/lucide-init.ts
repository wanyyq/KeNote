/**
 * Lucide Icons initialization utility.
 * Debounced MutationObserver to handle dynamic DOM without infinite loops.
 */
const lucideInit = () => {
  if (typeof window === 'undefined') return
  const lucide = (window as any).lucide
  if (!lucide) return

  // Initial render
  lucide.createIcons()

  // Debounced mutation observer - batched at 60ms
  let timer: ReturnType<typeof setTimeout> | null = null
  const observer = new MutationObserver(() => {
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      lucide.createIcons()
    }, 60)
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

export default lucideInit
