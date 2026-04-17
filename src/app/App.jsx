import { GlobalStyles } from "../theme/globalStyles.js";
import { usePersistedPreferences } from "../hooks/usePersistedPreferences.js";
import { useUiSelector } from "../state/hooks/useSelectors.js";
import { AppShell } from "./AppShell.jsx";
import { AppProviders } from "./providers.jsx";

function AppRuntime() {
  const theme = useUiSelector((ui) => ui.preferences.theme);
  usePersistedPreferences();

  return (
    <>
      <GlobalStyles theme={theme} />
      <AppShell />
    </>
  );
}

export function App() {
  return (
    <AppProviders>
      <AppRuntime />
    </AppProviders>
  );
}
