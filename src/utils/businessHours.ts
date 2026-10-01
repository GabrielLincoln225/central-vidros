export interface BusinessStatus {
  isOpen: boolean;
  statusText: string;
  compactText: string;
  currentDay: number; // 0 (dom) to 6 (sab)
}

export function getBusinessStatus(): BusinessStatus {
  // Use Intl to get exact date and time in America/Cuiaba
  const now = new Date();
  
  // Format options for America/Cuiaba
  const cuiabaDateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Cuiaba',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const partMap: Record<string, string> = {};
  cuiabaDateParts.forEach(p => {
    partMap[p.type] = p.value;
  });

  const hour = parseInt(partMap.hour || '0', 10);
  const minute = parseInt(partMap.minute || '0', 10);
  const timeInMinutes = hour * 60 + minute;

  // Weekday mapping
  // Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
  const weekdayStr = partMap.weekday; // "Sun", "Mon", etc.
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = Math.max(0, daysOfWeek.indexOf(weekdayStr));

  let isOpen = false;
  let statusText = '';
  let compactText = 'Fechado';

  // Hours:
  // Mon-Fri (1-5): 07:00 (420m) to 18:00 (1080m)
  // Sat (6): 07:00 (420m) to 12:00 (720m)
  // Sun (0): Closed

  if (dayIndex >= 1 && dayIndex <= 5) {
    if (timeInMinutes >= 420 && timeInMinutes < 1080) {
      isOpen = true;
      statusText = 'Aberto agora · fecha às 18h';
      compactText = 'Aberto';
    } else if (timeInMinutes < 420) {
      isOpen = false;
      statusText = 'Fechado · abre hoje às 7h';
      compactText = 'Fechado';
    } else {
      // After 18:00
      isOpen = false;
      statusText = 'Fechado · abre amanhã às 7h';
      compactText = 'Fechado';
    }
  } else if (dayIndex === 6) {
    // Saturday
    if (timeInMinutes >= 420 && timeInMinutes < 720) {
      isOpen = true;
      statusText = 'Aberto agora · fecha às 12h';
      compactText = 'Aberto';
    } else if (timeInMinutes < 420) {
      isOpen = false;
      statusText = 'Fechado · abre hoje às 7h';
      compactText = 'Fechado';
    } else {
      // After 12:00 on Saturday -> opens Monday
      isOpen = false;
      statusText = 'Fechado · abre segunda às 7h';
      compactText = 'Fechado';
    }
  } else {
    // Sunday
    isOpen = false;
    statusText = 'Fechado · abre segunda às 7h';
    compactText = 'Fechado';
  }

  return {
    isOpen,
    statusText,
    compactText,
    currentDay: dayIndex,
  };
}
