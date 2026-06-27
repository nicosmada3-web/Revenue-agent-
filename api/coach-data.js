// Coach dashboard data — Vercel serverless function.
// Reads from Vercel KV (new submissions) and optionally Netlify Forms (historical).
// Env vars required: COACH_PASSWORD, KV_REST_API_URL, KV_REST_API_TOKEN
// Optional (historical data): NETLIFY_ACCESS_TOKEN
import { kv } from '@vercel/kv';

function aggregate(submissions, studentMap = {}) {
  for (const sub of submissions) {
    const d   = sub.data || {};
    const key = `${(d.student || '').trim()}||${(d.squad || '').trim()}`;
    if (!key.startsWith('||')) {
      if (!studentMap[key]) {
        studentMap[key] = {
          student: { name: (d.student || '').trim(), squad: (d.squad || '').trim() },
          logs:    {},
          lastSeen: sub.created_at,
        };
      }
      const s = studentMap[key];
      if (sub.created_at > s.lastSeen) s.lastSeen = sub.created_at;
      const ex = (d.exercise || '').trim();
      if (ex) {
        if (!s.logs[ex]) s.logs[ex] = [];
        const entry = { date: d.date || sub.created_at.slice(0, 10) };
        if (d.type === 'cardio') {
          entry.cardio = true;
          entry.note   = d.detail || '';
        } else {
          const sets = (d.detail || '').split(',').map(p => {
            const m = p.trim().match(/^([\d.]+)kg\s*[×x]\s*(\d+)/i);
            return m ? { weight: m[1], reps: m[2] } : null;
          }).filter(Boolean);
          if (sets.length) entry.sets = sets;
        }
        s.logs[ex].push(entry);
      }
    }
  }
  return studentMap;
}

export default async function handler(req, res) {
  const COACH_PASSWORD  = process.env.COACH_PASSWORD;
  const NETLIFY_TOKEN   = process.env.NETLIFY_ACCESS_TOKEN;
  const SITE_ID         = '546a5f69-1561-4e0b-9137-c58953ea0ef3';

  const pw = (req.query || {}).password || '';
  if (!COACH_PASSWORD || pw !== COACH_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let studentMap = {};

    // 1. Read historical submissions from Netlify Forms (if token provided)
    if (NETLIFY_TOKEN) {
      try {
        const formsRes = await fetch(
          `https://api.netlify.com/api/v1/sites/${SITE_ID}/forms`,
          { headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` } }
        );
        if (formsRes.ok) {
          const forms = await formsRes.json();
          const form  = forms.find(f => f.name === 'training-log');
          if (form) {
            const subRes = await fetch(
              `https://api.netlify.com/api/v1/forms/${form.id}/submissions?per_page=1000`,
              { headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` } }
            );
            if (subRes.ok) {
              aggregate(await subRes.json(), studentMap);
            }
          }
        }
      } catch (_) { /* historical data unavailable — continue */ }
    }

    // 2. Read new submissions from Vercel KV
    const raw = await kv.lrange('training-log:submissions', 0, -1);
    if (raw && raw.length) {
      const kvSubs = raw.map(r => typeof r === 'string' ? JSON.parse(r) : r);
      aggregate(kvSubs, studentMap);
    }

    const students = Object.values(studentMap).sort(
      (a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)
    );

    return res.status(200).json({ students });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
