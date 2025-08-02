const axios = require('axios');

async function sendAudioToGemini(audioBase64) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-native-audio-dialog:streamGenerateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ inline_data: { mime_type: 'audio/wav', data: audioBase64 } }]
      }
    ]
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  const response = await axios.post(url, payload, { headers });
  return response.data;
}

module.exports = { sendAudioToGemini };
