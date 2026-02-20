const axios = require('axios');

const GEN_AGENT_URL = process.env.GEN_AGENT_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

async function explainModel(payload) {
  const base = GEN_AGENT_URL.replace(/\/$/, '');
  const url = `${base}/explain`;
  const res = await axios.post(url, payload, { timeout: 15000 });
  return res.data;
}

module.exports = {
  explainModel
};
