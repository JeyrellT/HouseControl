import { createContext, useContext, useMemo, useReducer } from "react";
import { initialNexusState } from "./initialState.js";
import { nexusReducer } from "./nexusReducer.js";
import { nexusActions } from "./actions.js";

const NexusDispatchContext = createContext(null);
const UiStateContext = createContext(null);
const RoomsStateContext = createContext(null);
const DevicesStateContext = createContext(null);
const RecommendationsStateContext = createContext(null);
const PlatformsStateContext = createContext(null);
const ScenesStateContext = createContext(null);
const AutomationsStateContext = createContext(null);
const NeuroStateContext = createContext(null);
const ActivityStateContext = createContext(null);

export function NexusProvider({ children, initialState = initialNexusState }) {
  const [state, dispatch] = useReducer(nexusReducer, initialState);
  const actions = useMemo(
    () => ({
      setActivePage: (pageId) => dispatch(nexusActions.setActivePage(pageId)),
      setActiveRoom: (roomId) => dispatch(nexusActions.setActiveRoom(roomId)),
      toggleTheme: () => dispatch(nexusActions.toggleTheme()),
      setTheme: (theme) => dispatch(nexusActions.setTheme(theme)),
      toggleDensityMode: () => dispatch(nexusActions.toggleDensityMode()),
      togglePanel: (panelId) => dispatch(nexusActions.togglePanel(panelId)),
      toggleDevicePower: (deviceId) => dispatch(nexusActions.toggleDevicePower(deviceId)),
      setDeviceBrightness: (deviceId, brightness) =>
        dispatch(nexusActions.setDeviceBrightness(deviceId, brightness)),
      dismissRecommendation: (recommendationId) =>
        dispatch(nexusActions.dismissRecommendation(recommendationId)),
      applyScene: (sceneId) => dispatch(nexusActions.applyScene(sceneId)),
      appendActivity: (entry) => dispatch(nexusActions.appendActivity(entry)),
      setNeuroState: (partialNeuroState) => dispatch(nexusActions.setNeuroState(partialNeuroState)),
      hydrateUiPreferences: (preferences) => dispatch(nexusActions.hydrateUiPreferences(preferences))
    }),
    [dispatch]
  );

  return (
    <NexusDispatchContext.Provider value={{ dispatch, actions }}>
      <UiStateContext.Provider value={state.ui}>
        <RoomsStateContext.Provider value={state.rooms}>
          <DevicesStateContext.Provider value={state.devices}>
            <RecommendationsStateContext.Provider value={state.recommendations}>
              <PlatformsStateContext.Provider value={state.platforms}>
                <ScenesStateContext.Provider value={state.scenes}>
                  <AutomationsStateContext.Provider value={state.automations}>
                    <NeuroStateContext.Provider value={state.neuro}>
                      <ActivityStateContext.Provider value={state.activity}>
                        {children}
                      </ActivityStateContext.Provider>
                    </NeuroStateContext.Provider>
                  </AutomationsStateContext.Provider>
                </ScenesStateContext.Provider>
              </PlatformsStateContext.Provider>
            </RecommendationsStateContext.Provider>
          </DevicesStateContext.Provider>
        </RoomsStateContext.Provider>
      </UiStateContext.Provider>
    </NexusDispatchContext.Provider>
  );
}

function useRequiredContext(context, name) {
  const value = useContext(context);

  if (!value) {
    throw new Error(`${name} debe usarse dentro de NexusProvider.`);
  }

  return value;
}

export function useNexusDispatch() {
  return useRequiredContext(NexusDispatchContext, "useNexusDispatch");
}

export function useUiStateContext() {
  return useRequiredContext(UiStateContext, "useUiStateContext");
}

export function useRoomsStateContext() {
  return useRequiredContext(RoomsStateContext, "useRoomsStateContext");
}

export function useDevicesStateContext() {
  return useRequiredContext(DevicesStateContext, "useDevicesStateContext");
}

export function useRecommendationsStateContext() {
  return useRequiredContext(RecommendationsStateContext, "useRecommendationsStateContext");
}

export function usePlatformsStateContext() {
  return useRequiredContext(PlatformsStateContext, "usePlatformsStateContext");
}

export function useScenesStateContext() {
  return useRequiredContext(ScenesStateContext, "useScenesStateContext");
}

export function useAutomationsStateContext() {
  return useRequiredContext(AutomationsStateContext, "useAutomationsStateContext");
}

export function useNeuroStateContext() {
  return useRequiredContext(NeuroStateContext, "useNeuroStateContext");
}

export function useActivityStateContext() {
  return useRequiredContext(ActivityStateContext, "useActivityStateContext");
}

