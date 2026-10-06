import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, LoaderCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { wedding } from '../config/wedding';
import { submitRsvp, validateRsvp } from '../services/rsvp';
import type { RsvpData, RsvpErrors } from '../services/rsvp';

type FieldId = keyof RsvpData | 'review';
export function useRsvp() {
  const [data, setData] = useState<RsvpData>({ fullName: '', email: '', attendance: '', guests: 1, dietary: '', message: '' });
  const [errors, setErrors] = useState<RsvpErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [failure, setFailure] = useState('');
  const [activeField, setActiveField] = useState<FieldId>('fullName');
  return useMemo(() => ({ data, setData, errors, setErrors, status, setStatus, failure, setFailure, activeField, setActiveField }), [data, errors, status, failure, activeField]);
}

export function RsvpForm({ model, tight }: { model: ReturnType<typeof useRsvp>; tight: boolean }) {
  const { data, setData, errors, setErrors, status, setStatus, failure, setFailure, activeField, setActiveField } = model;
  const form = useRef<HTMLFormElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  const steps: FieldId[][] = [
    ...(tight ? [['fullName'], ['email']] as FieldId[][] : [['fullName', 'email']] as FieldId[][]),
    ['attendance'],
    ...(data.attendance === 'accept' ? tight ? [['guests'], ['dietary']] as FieldId[][] : [['guests', 'dietary']] as FieldId[][] : []),
    ['message'], ['review'],
  ];
  const stepIndex = Math.max(0, steps.findIndex(fields => fields.includes(activeField)));
  const fields = steps[stepIndex];
  const last = fields.includes('review');
  const title = fields.includes('fullName') ? wedding.rsvp.title : fields.includes('email') ? 'Your email address.' : fields.includes('attendance') ? 'Will you join us?' : fields.includes('guests') ? 'Your party.' : fields.includes('dietary') ? 'Around the table.' : fields.includes('message') ? 'A little love note.' : 'Ready to send?';

  useEffect(() => {
    if (status === 'success') confirmation.current?.focus();
    else if (focusNext.current) {
      form.current?.querySelector<HTMLElement>('input, select, textarea, .review-summary')?.focus();
      focusNext.current = false;
    }
  }, [activeField, status, tight]);
  const change = <K extends keyof RsvpData>(key: K, value: RsvpData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };
  const move = (index: number) => { focusNext.current = true; setActiveField(steps[index][0]); };
  async function save() {
    const invalid = validateRsvp(data, wedding.rsvp.maxGuests);
    setErrors(invalid);
    const first = Object.keys(invalid)[0] as FieldId | undefined;
    if (first) { focusNext.current = true; setActiveField(first); return; }
    setStatus('loading');
    try { await submitRsvp(data, wedding.rsvp.maxGuests); setStatus('success'); }
    catch (error) { setFailure(error instanceof Error ? error.message : 'Something went wrong. Please try again.'); setStatus('error'); }
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (status === 'loading') return;
    if (last) { void save(); return; }
    const invalid = validateRsvp(data, wedding.rsvp.maxGuests);
    const current = Object.fromEntries(Object.entries(invalid).filter(([key]) => fields.includes(key as FieldId)));
    setErrors(current);
    if (Object.keys(current).length) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    move(stepIndex + 1);
  }
  const error = (key: keyof RsvpData) => errors[key] && <span className="field-error" id={`${key}-error`} role="alert">{errors[key]}</span>;
  if (status === 'success') return <div className="confirmation" tabIndex={-1} ref={confirmation} role="status"><Check className="success-mark" size={28}/><h2>{wedding.rsvp.successTitle}</h2><p>{data.attendance === 'accept' ? wedding.rsvp.acceptMessage : wedding.rsvp.declineMessage}</p><p className="demo-note">Your response has not been delivered to {wedding.names.join(' & ')}. It is saved on this device only.</p></div>;
  if (status === 'error') return <div className="rsvp-failure"><p className="eyebrow">RSVP / TRY AGAIN</p><h2>One more try.</h2><p role="alert" className="field-error">{failure}</p><div className="rsvp-actions"><button type="button" className="form-back" onClick={() => setStatus('idle')}>Back to review</button><button type="button" className="submit-button" onClick={() => void save()}>Try again</button></div></div>;
  return <form ref={form} onSubmit={submit} noValidate className="rsvp-form" aria-busy={status === 'loading'}>
    <div className="rsvp-heading"><p className="eyebrow">RSVP · {wedding.rsvp.deadline}</p><h2>{title}</h2><p className="step-progress" aria-live="polite">STEP {stepIndex + 1} OF {steps.length}</p></div>
    <div className="rsvp-fields">
      {fields.includes('fullName') && <div className="field"><label htmlFor="fullName">Full name *</label><input disabled={status === 'loading'} id="fullName" autoComplete="name" required maxLength={150} value={data.fullName} onChange={e => change('fullName', e.target.value)} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'fullName-error' : undefined}/>{error('fullName')}</div>}
      {fields.includes('email') && <div className="field"><label htmlFor="email">Email address *</label><input disabled={status === 'loading'} id="email" type="email" autoComplete="email" required maxLength={254} value={data.email} onChange={e => change('email', e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined}/>{error('email')}</div>}
      {fields.includes('attendance') && <fieldset><legend>Will you be joining us? *</legend><div className="attendance-options">{(['accept', 'decline'] as const).map(value => <label className={`radio-option ${data.attendance === value ? 'selected' : ''}`} key={value}><input disabled={status === 'loading'} type="radio" name="attendance" value={value} required checked={data.attendance === value} onChange={() => change('attendance', value)} aria-invalid={!!errors.attendance} aria-describedby={errors.attendance ? 'attendance-error' : undefined}/><span>{value === 'accept' ? 'Joyfully accept' : 'Regretfully decline'}</span></label>)}</div>{error('attendance')}</fieldset>}
      {fields.includes('guests') && <div className="field"><label htmlFor="guests">Number of guests <span>(including you)</span></label><select disabled={status === 'loading'} id="guests" value={data.guests} onChange={e => change('guests', Number(e.target.value))} aria-invalid={!!errors.guests}>{Array.from({ length: wedding.rsvp.maxGuests }, (_, i) => <option key={i} value={i + 1}>{i + 1} {i ? 'guests' : 'guest'}</option>)}</select>{error('guests')}</div>}
      {fields.includes('dietary') && <div className="field"><label htmlFor="dietary">Dietary requirements <span>(optional)</span></label><input disabled={status === 'loading'} id="dietary" maxLength={1000} value={data.dietary} onChange={e => change('dietary', e.target.value)} placeholder="Any allergies or preferences"/></div>}
      {fields.includes('message') && <div className="field"><label htmlFor="message">A note to the couple <span>(optional)</span></label><textarea disabled={status === 'loading'} id="message" maxLength={2000} rows={2} value={data.message} onChange={e => change('message', e.target.value)} placeholder="Leave a little love…"/></div>}
      {last && <div className="review-summary" tabIndex={-1}><p title={data.fullName}><strong>{data.fullName}</strong></p><p title={data.email}>{data.email}</p><p>{data.attendance === 'accept' ? `Joyfully accepting · ${data.guests} ${data.guests === 1 ? 'guest' : 'guests'}` : 'Regretfully declining'}</p>{data.attendance === 'accept' && data.dietary && <p>Dietary requirements included</p>}{data.message && <p>Your love note is included</p>}<p className="demo-note">Demo · saved on this device only, not sent to the couple.</p></div>}
    </div>
    <div className="rsvp-actions">{stepIndex > 0 ? <button type="button" className="form-back" disabled={status === 'loading'} onClick={() => move(stepIndex - 1)}><ArrowLeft size={14}/>Back</button> : <span className="required-note">* Required</span>}<button type="submit" className="submit-button" disabled={status === 'loading'}>{status === 'loading' ? <><LoaderCircle className="spin" size={16}/>Saving your response…</> : last ? 'Save demo response' : <>Continue<ArrowRight size={14}/></>}</button></div>
  </form>;
}
