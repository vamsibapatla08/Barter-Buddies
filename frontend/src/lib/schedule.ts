// Date, time and place choices for the Create Listing coordinates.
// available_when is sent to the backend as one string: "Thu 9 Oct, 6:00 PM".

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Today plus the next 13 days, e.g. "Thu 9 Oct". Computed fresh on each call. */
export function dateOptions(from: Date = new Date()): string[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return Array.from({ length: 14 }, (_, offset) => {
    const day = new Date(start)
    day.setDate(start.getDate() + offset)
    return `${DAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}`
  })
}

/** Every 30 minutes from 8:00 AM to 9:30 PM, e.g. "6:30 PM". */
export const TIME_OPTIONS: string[] = Array.from({ length: 28 }, (_, step) => {
  const minutes = 8 * 60 + step * 30
  const hour24 = Math.floor(minutes / 60)
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const half = minutes % 60 === 0 ? '00' : '30'
  return `${hour12}:${half} ${hour24 < 12 ? 'AM' : 'PM'}`
})

export const SPOTS: string[] = [
  'JPL Library',
  'The Sombrilla',
  'University Center',
  'Chisholm Hall',
  'Rec Center',
  'Arrange in messages',
]
