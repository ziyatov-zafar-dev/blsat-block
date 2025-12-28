
export async function generateDeviceId(): Promise<string> {
  const existing = localStorage.getItem('X-Device-Id');
  if (existing) return existing;

  const userAgent = navigator.userAgent;
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(7);
  const data = `${userAgent}-${timestamp}-${random}`;

  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  localStorage.setItem('X-Device-Id', hashHex);
  return hashHex;
}

export function maskEmail(email: string): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Human-friendly last seen string (uzbek-ish phrasing)
export function formatLastSeen(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);

  const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isSameDay = now.toDateString() === date.toDateString();

  if (minutes < 1) return "Hozirgina ko'rildi";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  if (isSameDay) return `Bugun ${timePart}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return `Kecha ${timePart}`;

  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  return `${datePart} ${timePart}`;
}

export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
