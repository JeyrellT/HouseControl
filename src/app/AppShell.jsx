import { useState } from "react";
import { Sidebar } from "../components/layout/Sidebar.jsx";
import { TopBar } from "../components/layout/TopBar.jsx";
import { PageContainer } from "../components/layout/PageContainer.jsx";
import { DashboardPage } from "../pages/DashboardPage.jsx";
import { RoomDetailPage } from "../pages/RoomDetailPage.jsx";
import { AutomationsPage } from "../pages/AutomationsPage.jsx";
import { SettingsPage } from "../pages/SettingsPage.jsx";
import { useRoomSummaries, useUiSelector } from "../state/hooks/useSelectors.js";

const PAGE_CONFIG = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    subtitle: "Overview operativo con visibilidad general y contexto del sistema.",
    component: DashboardPage
  },
  roomDetail: {
    id: "roomDetail",
    label: "Room Detail",
    subtitle: "Contexto por habitacion, dispositivos asociados y estado ambiental.",
    component: RoomDetailPage
  },
  automations: {
    id: "automations",
    label: "Automations",
    subtitle: "Reglas, escenas y flujos listos para crecer sin acoplar servicios.",
    component: AutomationsPage
  },
  settings: {
    id: "settings",
    label: "Settings",
    subtitle: "Preferencias de interfaz, tema y configuracion operativa base.",
    component: SettingsPage
  }
};

const NAVIGATION_ITEMS = Object.values(PAGE_CONFIG).map(({ id, label }) => ({
  id,
  label
}));

function resolvePageMeta(activePage, roomSummaries, activeRoomId) {
  const fallbackPage = PAGE_CONFIG.dashboard;
  const page = PAGE_CONFIG[activePage] ?? fallbackPage;

  if (page.id !== "roomDetail") {
    return page;
  }

  const activeRoom = roomSummaries.find((room) => room.id === activeRoomId);

  if (!activeRoom) {
    return page;
  }

  return {
    ...page,
    subtitle: `Vista activa: ${activeRoom.name}. ${activeRoom.deviceCount} dispositivos, ${activeRoom.onlineCount} online.`
  };
}

export function AppShell() {
  const [mode, setMode] = useState("homeowner");
  const activePage = useUiSelector((ui) => ui.activePage);
  const activeRoomId = useUiSelector((ui) => ui.activeRoomId);
  const theme = useUiSelector((ui) => ui.preferences.theme);
  const roomSummaries = useRoomSummaries();
  const pageMeta = resolvePageMeta(activePage, roomSummaries, activeRoomId);
  const ActivePage = pageMeta.component;

  const handleModeToggle = () => {
    setMode((currentMode) => (currentMode === "homeowner" ? "admin" : "homeowner"));
  };

  return (
    <div className="app-shell">
      <Sidebar items={NAVIGATION_ITEMS} activeItem={activePage} />
      <div className="app-shell__content">
        <TopBar
          title={pageMeta.label}
          subtitle={pageMeta.subtitle}
          mode={mode}
          theme={theme}
          onModeToggle={handleModeToggle}
        />
        <PageContainer>
          <ActivePage />
        </PageContainer>
      </div>
    </div>
  );
}
