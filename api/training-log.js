// Receives training log submissions from Solihull Performance app.
// Stores each entry in Vercel KV and emails nick@back2strong.online.
// Requires env vars: KV_REST_API_URL, KV_REST_API_TOKEN, RESEND_API_KEY
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { student, squad, exercise, date, type, detail } = req.body || {};

  if (!student || !exercise) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const submission = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    data: { student, squad: squad || '', exercise, date: date || new Date().toISOString().slice(0, 10), type: type || 'strength', detail: detail || '' }
  };

  // Store in Vercel KV
  await kv.lpush('training-log:submissions', JSON.stringify(submission));

  // Email notification — best effort
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (RESEND_KEY) {
    const isCardio = type === 'cardio';
    const html = `
      <p><strong>${student}</strong> (${squad || 'unknown squad'}) logged a session:</p>
      <ul>
        <li><strong>Exercise:</strong> ${exercise}</li>
        <li><strong>Date:</strong> ${date || 'today'}</li>
        <li><strong>Type:</strong> ${isCardio ? 'Cardio' : 'Strength'}</li>
        <li><strong>Detail:</strong> ${detail || '—'}</li>
      </ul>
    `;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Solihull Rugby <notifications@back2strong.online>',
        to: ['nick@back2strong.online'],
        subject: `Training Log: ${student} — ${exercise}`,
        html
      })
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true });
}
