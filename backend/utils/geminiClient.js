const axios = require('axios');

async function sendAudioToGemini(audioBase64) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: "Reply in short and polite manner. Don't give large explanation"
          }
        ]
      },
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: 'audio/wav',
              data: audioBase64
            }
          }
        ]
      }
    ]
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  try {
    const response = await axios.post(url, payload, { headers });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text;
  } catch (error) {
    console.error('Error sending audio to Gemini:', error.message);
    throw error;
  } 
}

module.exports = { sendAudioToGemini };
