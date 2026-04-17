import { useMemo } from "react";
import {
  useActivityStateContext,
  useAutomationsStateContext,
  useDevicesStateContext,
  useNeuroStateContext,
  useNexusDispatch,
  usePlatformsStateContext,
  useRecommendationsStateContext,
  useRoomsStateContext,
  useScenesStateContext,
  useUiStateContext
} from "../state/nexusContext.jsx";

export function useNexus() {
  const ui = useUiStateContext();
  const rooms = useRoomsStateContext();
  const devices = useDevicesStateContext();
  const recommendations = useRecommendationsStateContext();
  const platforms = usePlatformsStateContext();
  const scenes = useScenesStateContext();
  const automations = useAutomationsStateContext();
  const neuro = useNeuroStateContext();
  const activity = useActivityStateContext();
  const { dispatch, actions } = useNexusDispatch();

  const state = useMemo(
    () => ({
      ui,
      rooms,
      devices,
      recommendations,
      platforms,
      scenes,
      automations,
      neuro,
      activity
    }),
    [ui, rooms, devices, recommendations, platforms, scenes, automations, neuro, activity]
  );

  return {
    state,
    dispatch,
    actions
  };
}
