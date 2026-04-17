import { NexusProvider } from "../state/nexusContext.jsx";

export function AppProviders({ children }) {
  return <NexusProvider>{children}</NexusProvider>;
}
