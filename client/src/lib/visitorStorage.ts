export function getOrCreateVisitorId(): string {
  try {
    const key = 'scnt_vid'
    let vid = localStorage.getItem(key)
    if (!vid) {
      vid =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `vid_${Math.random().toString(36).slice(2)}_${Date.now()}`
      localStorage.setItem(key, vid)
    }
    return vid
  } catch {
    return 'anonymous_visitor'
  }
}

export function getOrCreateSessionId(): string {
  try {
    const key = 'scnt_sid'
    let sid = sessionStorage.getItem(key)
    if (!sid) {
      sid =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sid_${Math.random().toString(36).slice(2)}_${Date.now()}`
      sessionStorage.setItem(key, sid)
    }
    return sid
  } catch {
    return 'anonymous_session'
  }
}
