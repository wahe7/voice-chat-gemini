const express = require('express');
const router = express.Router();
const { sendAudioToGemini } = require('../utils/geminiClient');

router.post('/', async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    const result = await sendAudioToGemini(audioBase64);
    res.json(result);
  } catch (error) {
    console.error('Error sending audio to Gemini:', error.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
