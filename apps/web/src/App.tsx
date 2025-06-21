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
        <div className="mx-auto flex h-full max-w-[960px] flex-col p-6">
          <h1 className="mb-6 text-2xl font-bold">Chat with Webpage</h1>
          <UrlDisplay />
          <ChatInterface />
        </div>
      </SettingsChecker>
    </UrlProvider>
  );
}

export default App;
