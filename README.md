- Agregar nuevo numero
- Envios masivos? 


# WhatsApp Admin Panel - Modular Version

A modular, maintainable WhatsApp admin panel for managing conversations and interventions.

## 🏗️ Architecture

The application is built with a modular architecture for better maintainability and scalability:

### Core Modules

- **`js/config.js`** - Configuration and constants
- **`js/state.js`** - State management with reactive updates
- **`js/api.js`** - Backend API communication
- **`js/socket.js`** - Real-time Socket.IO communication
- **`js/ui.js`** - DOM manipulation and rendering
- **`js/app.js`** - Main application controller

### Module Responsibilities

#### Config Module (`config.js`)
- API endpoints and base URLs
- Message type mappings
- Socket.IO event names
- UI configuration constants
- Quick reply templates

#### State Module (`state.js`)
- Centralized state management
- Reactive state updates
- Data filtering and searching
- Conversation management

#### API Module (`api.js`)
- Backend communication
- Data mapping and transformation
- Error handling
- Request/response management

#### Socket Module (`socket.js`)
- Real-time communication
- Connection management
- Event handling
- Reconnection logic

#### UI Module (`ui.js`)
- DOM manipulation
- Event handling
- Rendering functions
- User interaction management

#### App Module (`app.js`)
- Application orchestration
- Module coordination
- Event flow management
- Initialization logic

## 🚀 Getting Started

### Prerequisites
- Node.js (for development server)
- Modern web browser
- Backend API running

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `admin-modular.html` in your browser

### Production

Simply serve the files using any web server. The application works with static files.

## 📁 File Structure

```
whatsapp-admin-panel/
├── js/
│   ├── config.js          # Configuration and constants
│   ├── state.js           # State management
│   ├── api.js             # API communication
│   ├── socket.js          # Socket.IO handling
│   ├── ui.js              # UI management
│   └── app.js             # Main application
├── admin.html             # Original monolithic version
├── admin-modular.html     # New modular version
├── test.html              # API testing page
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Configuration

Edit `js/config.js` to modify:

- API endpoints
- Message type mappings
- Socket.IO event names
- UI settings
- Quick reply templates

## 🎯 Features

### Core Features
- ✅ Real-time message updates
- ✅ Conversation management
- ✅ Admin intervention system
- ✅ Message type visualization
- ✅ Search and filtering
- ✅ Responsive design

### Modular Benefits
- ✅ Easy to maintain and upgrade
- ✅ Clear separation of concerns
- ✅ Reusable components
- ✅ Better error handling
- ✅ Easier testing
- ✅ Scalable architecture

## 🔌 API Integration

### Backend Endpoints
- `GET /m/get/all` - Fetch all conversations
- `GET /m/get/info/{number}` - Get conversation info
- `POST /m/send/to/number` - Send intervention message

### Socket.IO Events
- `recibedMessage` - New client message
- `IAsendMessage` - AI-generated message
- `sendMessage` - Message sent confirmation
- `conversation_updated` - Conversation updated
- `user_typing` - User typing indicator

## 🛠️ Development

### Adding New Features

1. **New API endpoint**: Add to `config.js` and implement in `api.js`
2. **New UI component**: Add to `ui.js` with proper event handling
3. **New state property**: Add to `state.js` with reactive updates
4. **New Socket event**: Add to `config.js` and handle in `socket.js`

### Code Style

- Use ES6+ features
- Follow module pattern
- Add JSDoc comments
- Handle errors gracefully
- Use meaningful variable names

## 🐛 Troubleshooting

### Common Issues

1. **Socket connection fails**: Check API_BASE URL in config.js
2. **Messages not loading**: Verify API endpoints are correct
3. **UI not updating**: Check state management and subscriptions
4. **CORS errors**: Use development server with CORS enabled

### Debug Mode

Open browser console to see detailed logs and error messages.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on GitHub.
