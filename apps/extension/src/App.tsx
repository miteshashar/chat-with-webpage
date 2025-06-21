import { SettingsChecker, UrlProvider, UrlDisplay } from "shared";
import "./App.css";

function App() {
  return (
    <UrlProvider>
      <SettingsChecker>
        <div className="h-full p-4">
          <UrlDisplay />
          <div className="mt-4 text-center text-sm text-gray-500">
            Chat interface will be loaded here based on the current tab
          </div>
        </div>
      </SettingsChecker>
    </UrlProvider>
  );
}

export default App;
