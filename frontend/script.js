const startBtn = document.getElementById('startBtn');
const responseEl = document.getElementById('responseText');

let isSpeaking = false;
let utterance = null;

startBtn.addEventListener('click', async () => {

  if(window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel()
    isSpeaking = false;
    if (utterance) utterance = null;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  let audioChunks = [];

  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const base64Audio = await blobToBase64(audioBlob);

    const res = await fetch('http://localhost:3001/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64: base64Audio })
    });

    const data = await res.json();
    const reply = data || 'No response';
    responseEl.innerText = reply;

    // Speak it out loud
    if (!isSpeaking && reply.trim()) {
      utterance = new SpeechSynthesisUtterance(reply);
      utterance.onend = () => {
        isSpeaking = false;
        utterance = null;
      };
      isSpeaking = true;
      window.speechSynthesis.speak(utterance);
    }
  };

  mediaRecorder.start();

  startBtn.innerText = 'Listening... (Recording 4s)';
  setTimeout(() => {
    mediaRecorder.stop();
    startBtn.innerText = 'Start Recording';
  }, 4000);
});

// Helper
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.readAsDataURL(blob);
  });
}
