const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseModalities: ['TEXT'],
  },
});

async function processAudio(ws) {
  ws.on('message', async (data) => {
    if (!Buffer.isBuffer(data)) return;

    try {
      const audioBase64 = data.toString('base64');

      console.log('🎙️ Received audio. Sending to Gemini...');

      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'You know everything and give answer in friendly tone' },
              {
                inlineData: {
                  mimeType: 'audio/wav',
                  data: audioBase64,
                },
              },
            ],
          },
        ],
      });

      const text = response.response?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        console.log('🧠 Gemini response:', text);
        ws.send(JSON.stringify({ text }));
      } else {
        console.warn('⚠️ No text returned from Gemini.');
        ws.send(JSON.stringify({ text: "Sorry, I didn't catch that." }));
      }

    } catch (error) {
      console.error('❌ Error processing audio:', error.message);
      ws.send(JSON.stringify({ error: 'Gemini error: ' + error.message }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket closed');
  });
}

module.exports = { processAudio };
