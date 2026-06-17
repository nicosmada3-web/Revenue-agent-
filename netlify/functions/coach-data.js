// Coach dashboard data endpoint.
// Checks COACH_PASSWORD, then reads training-log form submissions from the
// Netlify Forms API and returns them aggregated by student. No secrets in HTML.
exports.handler = async (event) => {
  const COACH_PASSWORD = process.env.COACH_PASSWORD;
  const NETLIFY_TOKEN  = process.env.NETLIFY_ACCESS_TOKEN;
  const SITE_ID        = '546a5f69-1561-4e0b-9137-c58953ea0ef3';

  const pw = (event.queryStringParameters || {}).password || '';
  if (!COACH_PASSWORD || pw !== COACH_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    // 1. Find the training-log form for this site
    const formsRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${SITE_ID}/forms`,
      { headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` } }
    );
    if (!formsRes.ok) throw new Error(`Forms API ${formsRes.status}`);
    const forms = await formsRes.json();
    const form  = forms.find(f => f.name === 'training-log');

    if (!form) {
      // Form exists in HTML but no submissions yet — return empty
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: [], note: 'No submissions yet' }),
      };
    }

    // 2. Fetch all submissions (up to 1000)
    const subRes = await fetch(
      `https://api.netlify.com/api/v1/forms/${form.id}/submissions?per_page=1000`,
      { headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` } }
    );
    if (!subRes.ok) throw new Error(`Submissions API ${subRes.status}`);
    const submissions = await subRes.json();

    // 3. Aggregate by student name+squad
    const studentMap = {};
    for (const sub of submissions) {
      const d   = sub.data || {};
      const key = `${(d.student || '').trim()}||${(d.squad || '').trim()}`;
      if (!key.startsWith('||')) { // skip blank names
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
            // detail format: "80kg × 8, 85kg × 6"
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

    const students = Object.values(studentMap).sort(
      (a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
