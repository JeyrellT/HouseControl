import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NexusProvider, useNexusDispatch } from "../state/nexusContext.jsx";
import {
  usePlatformsSelector,
  useUiSelector
} from "../state/hooks/useSelectors.js";

describe("nexus slice contexts", () => {
  it("no rerenderiza consumidores de platforms cuando cambia ui", async () => {
    let uiRenderCount = 0;
    let platformRenderCount = 0;

    function UiProbe() {
      uiRenderCount += 1;
      const activePage = useUiSelector((ui) => ui.activePage);
      return <div>{activePage}</div>;
    }

    function PlatformProbe() {
      platformRenderCount += 1;
      const integrationStatus = usePlatformsSelector((platforms) => platforms.integration.status);
      return <div>{integrationStatus}</div>;
    }

    function Controls() {
      const { actions } = useNexusDispatch();

      return (
        <button type="button" onClick={() => actions.setActivePage("settings")}>
          change page
        </button>
      );
    }

    render(
      <NexusProvider>
        <UiProbe />
        <PlatformProbe />
        <Controls />
      </NexusProvider>
    );

    expect(screen.getByText("dashboard")).toBeTruthy();
    expect(screen.getByText("degraded")).toBeTruthy();
    expect(uiRenderCount).toBe(1);
    expect(platformRenderCount).toBe(1);

    await userEvent.click(screen.getByRole("button", { name: "change page" }));

    expect(screen.getByText("settings")).toBeTruthy();
    expect(uiRenderCount).toBe(2);
    expect(platformRenderCount).toBe(1);
  });
});
