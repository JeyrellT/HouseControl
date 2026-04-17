import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../app/App.jsx";
import { UI_STATE_STORAGE_KEY } from "../state/persistence.js";

describe("App", () => {
  it("renderiza el shell activo y navega entre paginas vigentes", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Ir a Room Detail" }));
    expect(await screen.findByRole("heading", { name: "Room Detail" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Abrir cuarto Sala principal" }).getAttribute("aria-selected")).toBe(
      "true"
    );
    expect(screen.getByText("Devices in Sala principal")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Ir a Settings" }));
    expect((await screen.findAllByRole("heading", { name: "Settings" })).length).toBe(2);
  });

  it("permite dismiss de recomendaciones y acciones activas en devices", async () => {
    render(<App />);

    const dismissButtons = await screen.findAllByRole("button", { name: /Descartar recomendacion/i });
    expect(dismissButtons.length).toBeGreaterThan(0);
    const dismissedLabel = dismissButtons[0].getAttribute("aria-label");

    await userEvent.click(dismissButtons[0]);
    expect(screen.queryByRole("button", { name: dismissedLabel })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Ir a Room Detail" }));
    const powerButton = await screen.findByRole("button", { name: /Apagar Sala Main Light/i });
    await userEvent.click(powerButton);
    expect(await screen.findByText("Power off")).toBeTruthy();
  });

  it("hidrata y vuelve a escribir el storage canonico", async () => {
    window.localStorage.setItem(
      UI_STATE_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        data: {
          activePage: "roomDetail",
          activeRoomId: "room-studio",
          openPanels: {
            sidebar: true,
            recommendations: true,
            neuro: false
          },
          preferences: {
            theme: "dark",
            densityMode: "focus",
            reducedMotion: true
          }
        }
      })
    );

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Room Detail" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Studio" })).toBeTruthy();

    const stored = JSON.parse(window.localStorage.getItem(UI_STATE_STORAGE_KEY));
    expect(stored.data.preferences.theme).toBe("dark");
    expect(stored.data.activeRoomId).toBe("room-studio");
  });
});
