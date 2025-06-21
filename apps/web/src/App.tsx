import { SettingsChecker, UrlProvider, UrlDisplay } from "shared";
import "./App.css";

function App() {
  return (
    <UrlProvider>
      <SettingsChecker>
        <div className="mx-auto max-w-2xl p-6">
          <h1 className="mb-6 text-2xl font-bold">Chat with Webpage</h1>
          <UrlDisplay />
          <div className="text-center text-gray-500">
            Chat interface will be loaded here based on the current URL
          </div>
        </div>
      </SettingsChecker>
    </UrlProvider>
  );
}

export default App;
