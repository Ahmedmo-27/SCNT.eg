export const INSTAGRAM_HANDLE = 'scnt.eg'
export const INSTAGRAM_WEB_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`
export const INSTAGRAM_APP_URL = `instagram://user?username=${INSTAGRAM_HANDLE}`

export function openInstagramProfile() {
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (isMobile) {
    const start = Date.now()
    window.location.href = INSTAGRAM_APP_URL
    setTimeout(() => {
      // If document is still active and within threshold, fallback to web
      if (Date.now() - start < 1500 && document.visibilityState !== 'hidden') {
        window.location.href = INSTAGRAM_WEB_URL
      }
    }, 600)
  } else {
    window.open(INSTAGRAM_WEB_URL, '_blank', 'noopener,noreferrer')
  }
}
