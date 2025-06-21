import { SettingsChecker, UrlProvider, UrlDisplay } from "shared";
import "./App.css";

function App() {
  return (
    <UrlProvider>
      <SettingsChecker>
        <div className="flex h-full flex-col p-4">
          <UrlDisplay />
          <div className="self-stretch overflow-auto text-center text-gray-500"></div>
        </div>
      </SettingsChecker>
    </UrlProvider>
  );
}

export default App;
