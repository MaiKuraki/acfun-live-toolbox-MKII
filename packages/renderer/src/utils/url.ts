export function normalizeAvatarUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return ''
  const cleaned = String(url).trim().replace(/[`'\\"]/g, '')
  if (cleaned.startsWith('//')) return 'https:' + cleaned
  return /^https?:\/\//i.test(cleaned) ? cleaned : ''
}

