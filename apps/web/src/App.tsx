import {
  SettingsChecker,
  UrlProvider,
  UrlDisplay,
  ChatInterface,
  ChatHistorySidebar,
} from "shared";
import "./App.css";

function App() {
  return (
    <UrlProvider>
      <SettingsChecker>
        <div className="flex h-full">
          <ChatHistorySidebar />
          <div className="mx-auto flex max-w-[960px] flex-1 flex-col p-6">
            <h1 className="mb-6 text-2xl font-bold">Chat with Webpage</h1>
            <UrlDisplay />
            <ChatInterface />
          </div>
        </div>
      </SettingsChecker>
    </UrlProvider>
  );
}

export default App;
