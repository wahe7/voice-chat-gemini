# Voice-Controlled AI Assistant with Gemini

A real-time voice-controlled AI assistant that uses Google's Gemini AI for natural language processing. The application allows users to interact with the AI using voice commands and receive spoken responses.

## Features

- Real-time voice recognition
- Natural language processing with Google's Gemini AI
- Web-based interface with modern UI
- Cross-platform compatibility
- Responsive design

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn
- Google Gemini API key

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/voice-chat-gemini.git
cd voice-chat-gemini
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### 4. Running the Application

1. Start the backend server (from the backend directory):
   ```bash
   cd ../backend
   npm start
   ```

2. In a new terminal, start the frontend development server (from the frontend directory):
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
voice-chat-gemini/
├── backend/
│   ├── controller/
│   │   └── voiceController.js
│   ├── routes/
│   ├── utils/
│   │   └── geminiClient.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── client.js
│   ├── index.html
│   ├── style.css
│   └── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| GEMINI_API_KEY | Your Google Gemini API key | - |
| PORT | Port for the backend server | 3000 |

## Troubleshooting

1. **Microphone Access Issues**
   - Ensure your browser has permission to access the microphone
   - Try using Chrome or Firefox if you encounter issues

2. **WebSocket Connection Errors**
   - Make sure the backend server is running before starting the frontend
   - Check that the WebSocket URL in the frontend matches your backend server

3. **Gemini API Errors**
   - Verify your API key is correct and has the necessary permissions
   - Check your internet connection

## Contributing

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Gemini for the powerful AI capabilities
- Web Audio API for real-time audio processing
- All contributors who helped in developing this project
