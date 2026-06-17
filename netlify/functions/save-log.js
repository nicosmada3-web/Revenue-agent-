const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { student, exercise, date, sets, cardio, note } = body;
  if (!student?.name || !student?.squad || !exercise || !date) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  try {
    const store = getStore({ name: 'student-logs', consistency: 'strong' });
    const key = slugify(student.name) + '--' + slugify(student.squad);

    let data;
    try { data = await store.get(key, { type: 'json' }); } catch {}
    if (!data) data = { student, logs: {}, lastSeen: null };

    if (!data.logs[exercise]) data.logs[exercise] = [];
    const entry = { date };
    if (sets) entry.sets = sets;
    if (cardio) { entry.cardio = true; if (note) entry.note = note; }
    data.logs[exercise].push(entry);
    data.lastSeen = new Date().toISOString();
    data.student = student;

    await store.set(key, JSON.stringify(data));
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('save-log error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server error' }) };
  }
};

function slugify(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
