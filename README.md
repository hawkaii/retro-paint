# 🎨 retro-paint++ - Retro Meme Maker & Collaborative Paint App

The ultimate nostalgic meme creation studio! Recreate those classic 2000s internet vibes with authentic MS Paint aesthetics. Perfect for crafting rage comics, drawing memes, collaborative shitposting, and AI-powered meme generation. Built with React, TypeScript, and Go WebSocket backend for real-time meme collaboration.

![retro-paint Screenshot](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=websocket&logoColor=white)

## ✨ Features

### 🎯 Core Meme-Making Tools
- **Brush Tool** - Classic freehand drawing for authentic MS Paint memes (1-32px)
- **Eraser Tool** - Clean pixel-perfect erasing for those "oops" moments
- **Shape Tools** - Rectangle, Circle, Triangle, and Line for rage comic panels
- **Fill Tool** - Bucket fill for solid backgrounds and meme templates
- **Text Tool** - Add impact font-style text with adjustable size (8-72px) for captions
- **Color Palette** - 16 classic Windows 98 colors for that authentic early internet look

### 🔄 Meme Creation Features
- **Undo/Redo System** - Fix those drawing fails with unlimited steps
- **Canvas Resizing** - Perfect aspect ratios for different meme formats
- **Clipboard Support** - Paste reaction images and templates (Ctrl+V)
- **Fullscreen Mode** - Focus mode for serious meme crafting (F11)
- **Save/Export** - Download your masterpieces as PNG for instant sharing

### 🤝 Collaborative Meme Making
- **Real-time Drawing** - Watch friends create memes together in real-time
- **Live Cursors** - See who's adding what to your collaborative shitpost
- **Chat System** - Coordinate your meme creation and share ideas
- **User Presence** - Know who's online and ready to meme

### 🤖 AI Meme Generation
- **AI Meme Creation** - Generate meme templates and reaction images with prompts
- **Multiple Art Styles** - From cursed AI art to clean digital memes
- **Quality Settings** - Adjustable resolution for different meme platforms
- **Seamless Integration** - AI-generated content loads directly for editing and captioning

### 🎵 Authentic Retro Meme Experience
- **Windows 98 UI** - That nostalgic early internet aesthetic we all miss
- **Sound Effects** - Classic Windows sounds for maximum nostalgia
- **Nostalgic Typography** - MS Sans Serif font for authentic meme text
- **Pixel Art Support** - Perfect for creating low-res reaction images and wojaks

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Go 1.19+
- Modern web browser with WebSocket support

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hawkaii/retro-paint.git
   cd retro-paint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Backend Setup (for collaboration features)

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Go dependencies**
   ```bash
   go mod tidy
   ```

3. **Start the WebSocket server**
   ```bash
   go run main.go
   ```

The WebSocket server will start on `ws://localhost:8080`

## 🏗️ Project Structure

```
retro-paint/
├── src/
│   ├── components/          # React components
│   │   ├── AIGenerationPanel.tsx
│   │   ├── MarchingAnts.tsx
│   │   ├── ScrollableCanvas.tsx
│   │   ├── Windows98Button.tsx
│   │   └── Windows98Logo.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useWebSocket.ts # WebSocket management
│   ├── styles/             # CSS styles
│   │   └── windows98.css   # Retro Windows 98 styling
│   ├── test/               # Test files
│   ├── types/              # TypeScript declarations
│   ├── utils/              # Utility functions
│   │   └── soundEffects.ts # Audio system
│   └── App.tsx             # Main application component
├── backend/                # Go WebSocket server
│   ├── main.go            # WebSocket server implementation
│   └── go.mod             # Go module definition
├── public/                # Static assets
└── docs/                  # Documentation
```

## 🛠️ Available Scripts

### Frontend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage

### Backend Commands
- `go run main.go` - Start WebSocket server
- `go build` - Build server binary
- `go test` - Run Go tests

## 🎮 How to Use

### Basic Meme Making
1. **Select a tool** from the toolbar (brush for drawing, text for captions)
2. **Choose your meme colors** from the classic 16-color palette
3. **Adjust brush/text size** for the perfect meme aesthetic
4. **Draw your meme** or add text to existing templates

### Keyboard Shortcuts
- `Ctrl+V` - Paste image from clipboard
- `F11` - Toggle fullscreen mode
- `Ctrl+Z` - Undo (when implemented)
- `Ctrl+Y` - Redo (when implemented)

### Collaborative Meme Sessions
1. **Start the backend server** following the setup instructions
2. **Share the URL** with your meme team
3. **Create memes together** in real-time
4. **Use the chat** to coordinate your collaborative shitposting

### AI Meme Generation
1. **Click the magic wand icon** to open the AI meme generator
2. **Enter a meme description** or request a reaction image
3. **Select an art style** (cursed, clean, retro, etc.)
4. **Click Generate** and wait for your AI-powered meme base

## 🧪 Testing

The project includes comprehensive testing with Vitest and React Testing Library:

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

Test coverage includes:
- Core painting functionality
- Tool selection and interaction
- Canvas operations
- Error handling
- Performance metrics
- Cross-browser compatibility

## 🎨 Customization

### Adding New Tools
1. Define the tool in the `tools` array in `App.tsx`
2. Add tool logic in the drawing event handlers
3. Include icon from Lucide React
4. Add corresponding CSS classes if needed

### Custom Color Palettes
Modify the `colors` array in `App.tsx` to add or change available colors:

```typescript
const colors = [
  '#000000', '#FFFFFF', '#FF0000', // ... your colors
];
```

### Styling
The app uses a combination of:
- **Tailwind CSS** for utility classes
- **Custom CSS** in `windows98.css` for retro styling
- **CSS-in-JS** for dynamic styling

## 🔧 Technical Details

### Architecture
- **Frontend**: React 18 with TypeScript and Vite
- **Backend**: Go with Gorilla WebSocket
- **State Management**: React hooks and context
- **Styling**: Tailwind CSS + Custom Windows 98 theme
- **Build Tool**: Vite for fast development and optimized builds
- **Testing**: Vitest + React Testing Library

### Key Technologies
- **Lucide React** - Modern icon library with tree-shaking
- **Canvas API** - For high-performance drawing operations
- **WebSocket** - Real-time collaboration
- **Clipboard API** - Image pasting functionality
- **Fullscreen API** - Immersive painting mode

### Performance Optimizations
- Tree-shaking for Lucide React icons
- Canvas-based rendering for smooth drawing
- Efficient undo/redo with canvas snapshots
- Optimized WebSocket message handling

## 🚀 Deployment

### Frontend Deployment
The app can be deployed to any static hosting service:

```bash
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend Deployment
Deploy the Go WebSocket server to any cloud provider that supports WebSocket connections.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Maintain the retro Windows 98 aesthetic
- Ensure cross-browser compatibility

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the golden age of MS Paint memes and early internet culture
- Windows 98 design language and that classic dial-up era aesthetic
- The eternal spirit of rage comics, reaction images, and collaborative shitposting
- Open source community for amazing tools that make meme dreams possible

## 📸 Screenshots

*Add screenshots of your application in action here*

## 🐛 Known Issues

- Some older browsers may not support all clipboard functionality
- WebSocket connection requires backend server for collaboration features
- AI generation feature requires internet connection

## 🔮 Future Enhancements

### 🎨 Meme Creation Features
- [ ] Meme template library (drake pointing, distracted boyfriend, etc.)
- [ ] Pre-made rage comic faces and expressions
- [ ] Layer support with blending modes for complex memes
- [ ] More brush types and textures for different art styles
- [ ] Advanced shape tools (speech bubbles, arrows, panels)
- [ ] Animation timeline for GIF memes
- [ ] Vector drawing tools for scalable memes
- [ ] Gradient and pattern fills for backgrounds

### 🤝 Enhanced Meme Collaboration
- [ ] Voice chat integration for coordinated meme sessions
- [ ] Video call support during collaborative meme creation
- [ ] Screen sharing for meme tutorials and reviews
- [ ] Meme battle rooms with voting systems
- [ ] User roles and permissions (memester, viewer, admin)
- [ ] Real-time collaborative layers for complex group memes
- [ ] Shared meme galleries and template libraries
- [ ] Meme session recordings and time-lapse exports
- [ ] Collaborative meme annotations and reactions
- [ ] Live meme competitions and tournaments
- [ ] Multi-canvas workspaces for meme campaigns
- [ ] Integration with Discord/Reddit for instant sharing

### 🔧 Technical Improvements
- [ ] Plugin system for custom tools
- [ ] Mobile touch support with gesture controls
- [ ] Offline mode with sync when reconnected
- [ ] Advanced undo/redo with branching history
- [ ] Performance optimization for large canvases
- [ ] WebRTC for peer-to-peer collaboration
- [ ] Advanced user authentication and profiles
- [ ] Cloud save and project management

---

**Built with ❤️ and nostalgia for the golden age of internet memes and MS Paint masterpieces**
