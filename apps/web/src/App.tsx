import { SettingsChecker, UrlProvider, UrlDisplay } from "shared";
import "./App.css";

function App() {
  return (
    <UrlProvider>
      <SettingsChecker>
        <div className="flex h-full max-w-[780px] flex-col p-6">
          <h1 className="mb-6 text-2xl font-bold">Chat with Webpage</h1>
          <UrlDisplay />
          <div className="self-stretch overflow-auto text-center text-gray-500"></div>
        </div>
      </SettingsChecker>
    </UrlProvider>
  );
}

export default App;
