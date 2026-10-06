import { useState, useRef } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { wedding } from '../config/wedding';
import { submitRsvp, validateRsvp } from '../services/rsvp';
import type { RsvpData, RsvpErrors } from '../services/rsvp';
export function useRsvp() {
  const [data, setData] = useState<RsvpData>({ fullName: '', email: '', attendance: '', guests: 1, dietary: '', message: '' });
  const [errors, setErrors] = useState<RsvpErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [failure, setFailure] = useState('');
  return { data, setData, errors, setErrors, status, setStatus, failure, setFailure };
}
export function RsvpForm({ model }: { model: ReturnType<typeof useRsvp> }) {
  const { data, setData, errors, setErrors, status, setStatus, failure, setFailure } = model;
  const form = useRef<HTMLFormElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const change = <K extends keyof RsvpData>(key: K, value: RsvpData[K]) => { setData(prev => ({ ...prev, [key]: value })); setErrors(prev => ({ ...prev, [key]: undefined })); };
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (status === 'loading') return;
    const invalid = validateRsvp(data, wedding.rsvp.maxGuests); setErrors(invalid);
    if (Object.keys(invalid).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    setStatus('loading');
    try { await submitRsvp(data, wedding.rsvp.maxGuests); setStatus('success'); requestAnimationFrame(() => confirmation.current?.focus()); }
    catch (error) { setFailure(error instanceof Error ? error.message : 'Something went wrong. Please try again.'); setStatus('error'); }
  }
  const error = (key: keyof RsvpData) => errors[key] && <span className="field-error" id={`${key}-error`} role="alert">{errors[key]}</span>;
  if (status === 'success') return <div className="confirmation" tabIndex={-1} ref={confirmation} role="status"><span className="success-mark"><Check size={24}/></span><h3>{wedding.rsvp.successTitle}</h3><p>{data.attendance === 'accept' ? wedding.rsvp.acceptMessage : wedding.rsvp.declineMessage}</p><p className="demo-note">This is a demo saved on this device only. Your response has not been delivered to {wedding.names.join(' & ')}.</p></div>;
  return <form ref={form} onSubmit={submit} noValidate className="rsvp-form" aria-busy={status === 'loading'}>
    <p className="required-note">Fields marked * are required.</p>
    <div className="field"><label htmlFor="fullName">Full name *</label><input disabled={status === 'loading'} id="fullName" autoComplete="name" required maxLength={150} value={data.fullName} onChange={e => change('fullName', e.target.value)} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'fullName-error' : undefined}/>{error('fullName')}</div>
    <div className="field"><label htmlFor="email">Email address *</label><input disabled={status === 'loading'} id="email" type="email" autoComplete="email" required maxLength={254} value={data.email} onChange={e => change('email', e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined}/>{error('email')}</div>
    <fieldset><legend>Will you be joining us? *</legend><div className="attendance-options">{(['accept', 'decline'] as const).map(value => <label className={`radio-option ${data.attendance === value ? 'selected' : ''}`} key={value}><input disabled={status === 'loading'} type="radio" name="attendance" value={value} required checked={data.attendance === value} onChange={() => change('attendance', value)} aria-invalid={!!errors.attendance} aria-describedby={errors.attendance ? 'attendance-error' : undefined}/><span>{value === 'accept' ? 'Joyfully accept' : 'Regretfully decline'}</span></label>)}</div>{error('attendance')}</fieldset>
    {data.attendance === 'accept' && <><div className="field"><label htmlFor="guests">Number of guests <span>(including you)</span></label><select disabled={status === 'loading'} id="guests" value={data.guests} onChange={e => change('guests', Number(e.target.value))} aria-invalid={!!errors.guests}>{Array.from({ length: wedding.rsvp.maxGuests }, (_, i) => <option key={i} value={i + 1}>{i + 1} {i ? 'guests' : 'guest'}</option>)}</select>{error('guests')}</div><div className="field"><label htmlFor="dietary">Dietary requirements <span>(optional)</span></label><input disabled={status === 'loading'} id="dietary" maxLength={1000} value={data.dietary} onChange={e => change('dietary', e.target.value)} placeholder="Any allergies or preferences"/></div></>}
    <div className="field"><label htmlFor="message">A note to the couple <span>(optional)</span></label><textarea disabled={status === 'loading'} id="message" maxLength={2000} rows={2} value={data.message} onChange={e => change('message', e.target.value)} placeholder="Leave a little love…"/></div>
    {status === 'error' && <p role="alert" className="field-error">{failure}</p>}
    <button type="submit" className="submit-button" disabled={status === 'loading'}>{status === 'loading' ? <><LoaderCircle className="spin" size={17}/> Saving your response…</> : 'Save demo response'}</button>
    <p className="demo-note">{wedding.rsvp.demoNotice}</p>
  </form>;
}
