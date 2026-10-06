export type Attendance = '' | 'accept' | 'decline';
export interface RsvpData { fullName: string; email: string; attendance: Attendance; guests: number; dietary: string; message: string; }
export type RsvpErrors = Partial<Record<keyof RsvpData, string>>;
export const STORAGE_KEY = 'emma-daniel:rsvp-demo:v1';
export function validateRsvp(data: RsvpData, maxGuests: number): RsvpErrors {
  const errors: RsvpErrors = {};
  if (!data.fullName.trim()) errors.fullName = 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Please enter a valid email address.';
  if (data.attendance !== 'accept' && data.attendance !== 'decline') errors.attendance = 'Please let us know if you can join us.';
  if (data.attendance === 'accept' && (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > maxGuests)) errors.guests = `Choose between 1 and ${maxGuests} guests.`;
  return errors;
}
/** Replace this adapter with a backend request. Never place secret keys in client code. */
export async function submitRsvp(data: RsvpData, maxGuests: number): Promise<{ id: string }> {
  if (Object.keys(validateRsvp(data, maxGuests)).length) throw new Error('Please check your response and try again.');
  await new Promise(resolve => setTimeout(resolve, 700));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const responses: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(responses)) throw new Error('Invalid storage');
    const id = crypto.randomUUID();
    const response = { ...data, fullName: data.fullName.trim(), email: data.email.trim(), guests: data.attendance === 'accept' ? data.guests : 0, dietary: data.attendance === 'accept' ? data.dietary.trim() : '', message: data.message.trim(), id, submittedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...responses, response]));
    return { id };
  } catch { throw new Error('We couldn’t save this demo response. Check that browser storage is available, then try again.'); }
}
