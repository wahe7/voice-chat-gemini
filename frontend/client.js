const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');

let ws, stream, audioContext, processor, source, mediaStreamSource;
let audioChunks = [];
let silenceCounter = 0;
let isSpeaking = false;
let currentUtterance = null;
let isInterrupted = false;

const silenceThreshold = 0.01;
const silenceDurationFrames = 20;

function createWavBuffer(pcmData, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length * 2, true);

  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(44 + i * 2, pcmData[i], true);
  }

  return buffer;
}

startBtn.addEventListener('click', async () => {
  try {
    ws = new WebSocket('ws://localhost:8080');
    audioChunks = [];

    ws.onopen = async () => {
      status.textContent = 'Status: Connected';
      startBtn.disabled = true;
      stopBtn.disabled = false;

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext({ sampleRate: 16000 });
      source = audioContext.createMediaStreamSource(stream);
      processor = audioContext.createScriptProcessor(2048, 1, 1);

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        let isSilent = true;

        for (let i = 0; i < input.length; i++) {
          const val = Math.min(1, Math.max(-1, input[i]));
          pcm[i] = val * 32767;
          if (Math.abs(val) > silenceThreshold) isSilent = false;
        }

        if (!isSilent) {
          silenceCounter = 0;
          audioChunks.push(...pcm);

          if (speechSynthesis.speaking || speechSynthesis.pending) {
            console.log('🛑 User interrupted — stopping Gemini speech');
            speechSynthesis.cancel();
            isSpeaking = false;

            // Reconnect mic immediately
            reconnectMic();

            // Flush what user said so far
            if (audioChunks.length > 4000) {
              sendAudioToGemini(audioChunks);
              audioChunks = [];
              silenceCounter = 0;
            }
          }
        } else {
          silenceCounter++;
        }

        if (silenceCounter > silenceDurationFrames && audioChunks.length > 10000) {
          sendAudioToGemini(audioChunks);
          audioChunks = [];
          silenceCounter = 0;
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error('Server error:', data.error);
        status.textContent = 'Status: Error';
        return;
      }

      if (data.text) {
        // Stop current speech if still going
        if (speechSynthesis.speaking || speechSynthesis.pending) {
          speechSynthesis.cancel();
        }
      
        // Disconnect mic while speaking
        if (source && processor) {
          source.disconnect();
          processor.disconnect();
        }
      
        currentUtterance = new SpeechSynthesisUtterance(data.text);
        currentUtterance.lang = 'en-US';
      
        currentUtterance.onstart = () => {
          isSpeaking = true;
          isInterrupted = false;
          console.log('🗣️ Started:', data.text);
          
          // Set up audio processing for interruption detection
          if (audioContext) {
            if (mediaStreamSource) {
              mediaStreamSource.disconnect();
            }
            
            // Create new audio context if needed
            if (audioContext.state === 'closed') {
              audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Create a new analyser node
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            
            // Get microphone stream
            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
              .then(stream => {
                mediaStreamSource = audioContext.createMediaStreamSource(stream);
                mediaStreamSource.connect(analyser);
                
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                const checkVolume = () => {
                  if (isInterrupted) return;
                  
                  analyser.getByteFrequencyData(dataArray);
                  const average = dataArray.reduce((a, b) => a + b) / bufferLength;
                  
                  // If volume is above threshold and we're currently speaking
                  if (average > 120 && isSpeaking) {
                    console.log('🎤 User interruption detected, stopping speech...');
                    isInterrupted = true;
                    speechSynthesis.cancel();
                    reconnectMic();
                    return;
                  }
                  
                  if (isSpeaking) {
                    requestAnimationFrame(checkVolume);
                  }
                };
                
                checkVolume();
              })
              .catch(err => {
                console.error('Error accessing microphone:', err);
              });
          }
        };
      
        currentUtterance.onend = () => {
          isSpeaking = false;
          console.log('✅ Done speaking');
          reconnectMic();
        };
      
        currentUtterance.onerror = (e) => {
          isSpeaking = false;
          console.error('❌ Speech error:', e);
          reconnectMic();
        };
      
        currentUtterance.oncancel = () => {
          isSpeaking = false;
          console.warn('🚫 Speech cancelled');
          reconnectMic();
        };
      
        speechSynthesis.speak(currentUtterance);
      }
    };

    ws.onclose = () => {
      status.textContent = 'Status: Disconnected';
      stop();
    };

  } catch (error) {
    console.error('Error:', error);
    status.textContent = 'Status: Error';
  }
});

stopBtn.addEventListener('click', () => {
  stop();
});

function sendAudioToGemini(pcmData) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const wavBuffer = createWavBuffer(pcmData);
  ws.send(wavBuffer);
  console.log('🎤 Sent audio to Gemini');
}

function reconnectMic() {
  if (audioContext?.state === 'closed') return;
  try {
    if (source && processor) {
      source.connect(processor);
      processor.connect(audioContext.destination);
      console.log('🎧 Mic reconnected');
      
      // Reset interruption state
      isInterrupted = false;
    }
  } catch (err) {
    console.warn('⚠️ Mic reconnect error:', err);
  }
}

function stop() {
  if (ws) ws.close();
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (audioContext && audioContext.state !== 'closed') audioContext.close();
  if (processor) processor.disconnect();

  // Stop any ongoing speech
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;

  audioChunks = [];
  silenceCounter = 0;
  isSpeaking = false;

  startBtn.disabled = false;
  stopBtn.disabled = true;
  status.textContent = 'Status: Not connected';
}
