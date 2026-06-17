const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Coach-Password',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  const pw = event.queryStringParameters?.password || event.headers['x-coach-password'] || '';
  const correctPw = process.env.COACH_PASSWORD || 'SolihullRFC2026';

  if (pw !== correctPw) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Wrong password' }) };
  }

  try {
    const store = getStore({ name: 'student-logs', consistency: 'strong' });
    const { blobs } = await store.list();

    const students = [];
    for (const blob of blobs) {
      try {
        const data = await store.get(blob.key, { type: 'json' });
        if (data) students.push(data);
      } catch {}
    }

    students.sort((a, b) => (b.lastSeen || '').localeCompare(a.lastSeen || ''));
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ students }) };
  } catch (err) {
    console.error('coach error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server error' }) };
  }
};
