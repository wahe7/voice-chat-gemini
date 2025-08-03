const { processAudio } = require('../utils/geminiClient');

const handleVoiceSession = (ws) => {
  processAudio(ws).catch((error) => {
    console.error('Voice session error:', error);
    ws.close();
  });
};

module.exports = { handleVoiceSession };