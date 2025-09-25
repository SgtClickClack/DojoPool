/* eslint-env node */
/* global console */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    console.error('Client error report:', payload?.message || 'No message');
    return res.status(200).json({ success: true, reportId: `r_${Date.now()}` });
  } catch (error) {
    return res.status(200).json({ success: true });
  }
}

export const config = { api: { bodyParser: true } };
