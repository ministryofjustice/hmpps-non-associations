const notNumber = (n: unknown): n is number => typeof n !== 'number' || Number.isNaN(n)

export default {
  dateAndTime(date: Date): string {
    const formatted = date.toLocaleDateString('en-GB', {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/London',
    })
    return formatted.replace(' at ', ', ')
  },

  date(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/London',
    })
  },

  thousands(integer: number): string {
    if (notNumber(integer)) return '?'
    return Math.round(integer).toLocaleString('en-GB')
  },

  possessiveName(name: string): string {
    if (!name) {
      return ''
    }
    return name.endsWith('s') || name.endsWith('S') ? `${name}’` : `${name}’s`
  },
}
