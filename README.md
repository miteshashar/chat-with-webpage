# Chat with Webpage

A Chrome extension and web application that allows you to have AI-powered conversations about any webpage content. The app analyzes webpage content and provides intelligent responses using OpenAI's GPT models.

## Features

- **Chrome Extension**: Analyze any webpage directly from your browser
- **Web Application**: Standalone chat interface with URL input
- **Caching**: Efficient markdown caching for faster responses
- **Chat History**: Persistent conversation history across sessions
- **Cross-Interface Storage**: Works seamlessly between Chrome extension and web app
- **Anti-Scraping Protection**: Web scraping with Playwright and stealth mode
- **Robots.txt Compliance**: Respects website crawling policies

## Architecture

This is a monorepo with the following structure:

- **`apps/extension/`** - Chrome extension (React + Vite)
- **`apps/web/`** - Web application (React + Vite)
- **`apps/backend/`** - Proxy server (Node.js + Express + Playwright)
- **`packages/shared/`** - Shared utilities and components

## Prerequisites

- Node.js 18+ (LTS recommended)
- Yarn package manager
- Chrome browser (for extension)
- OpenAI API key

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd chat-with-webpage
yarn install
```

### 2. Build All Projects

```bash
yarn build
```

### 3. Install Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `apps/extension/dist` folder
5. The extension should now appear in your browser

### 6. Run Development Servers

```bash
# Start all development servers
yarn dev
```

This will start:

- Backend proxy server on `http://localhost:3000`
- Web application on `http://localhost:5173`
- Extension in watch mode

## Usage

### Chrome Extension

1. Navigate to any webpage
2. Click the extension icon or open the side panel
3. Start chatting about the page content
4. Your conversations are automatically saved

### Web Application

1. Open `http://localhost:5173`
2. Enter a URL in the input field
3. Wait for the page to be analyzed
4. Start your conversation

## Development

### Available Scripts

```bash
# Development
yarn dev              # Start all dev servers
yarn build           # Build all projects
yarn type-check      # Run TypeScript checks
yarn lint            # Run ESLint
yarn lint:fix        # Fix ESLint issues
yarn format          # Format code with Prettier
yarn format:check    # Check code formatting

# Individual app development
cd apps/extension && yarn dev
cd apps/web && yarn dev
cd apps/backend && yarn dev
```

### Code Quality

The project uses:

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **lint-staged** for staged file processing

## TODO List

- [ ] **Token Management**

  - [ ] Add UI for OpenAI API key configuration after initial setup
  - [ ] Implement secure token storage
  - [ ] Add API-based token validation and error handling
  - [ ] Support for other AI providers (Anthropic, etc.)

- [ ] **Chat Management**

  - [ ] Add delete chat functionality
  - [ ] Implement chat export (JSON, markdown)
  - [ ] Add search within chat history
  - [ ] Bulk operations (delete multiple chats)

- [ ] **Security & Privacy**

  - [ ] Implement content filtering for sensitive data
  - [ ] Add option to disable data persistence
  - [ ] Implement auto-cleanup of old conversations

- [ ] **User Experience**

  - [ ] Add dark mode support
  - [ ] Implement keyboard shortcuts
  - [ ] Add loading states and progress indicators
  - [ ] Improve error messages and user feedback
  - [ ] Add onboarding flow for new users

- [ ] **Performance**

  - [ ] Implement virtual scrolling for large chat histories
  - [ ] Optimize bundle sizes

- [ ] **Features**

  - [ ] Allow user to select AI models (e.g., GPT-3.5, GPT-4)

- [ ] **Development & Deployment**

  - [ ] Set up GitHub Actions CI/CD
  - [ ] Implement Docker containerization

- [ ] **Extension Features**

  - [ ] Add context menu integration
  - [ ] Implement page selection tools

- [ ] **Web App Features**
  - [ ] Add user authentication
  - [ ] Implement team collaboration features
  - [ ] Add group chat with AI functionality

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`yarn type-check && yarn lint`)
5. Commit your changes (`git commit -am 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/chat-with-webpage/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs
