import {
  SettingsChecker,
  UrlProvider,
  UrlDisplay,
  ChatInterface,
} from "shared";
import "./App.css";

function App() {
  return (
    <UrlProvider>
      <SettingsChecker>
        <div className="flex h-full flex-col p-4">
          <UrlDisplay />
          <ChatInterface />
        </div>
      </SettingsChecker>
    </UrlProvider>
  );
}

export default App;
