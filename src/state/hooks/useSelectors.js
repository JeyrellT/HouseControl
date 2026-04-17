import { useMemo } from "react";
import {
  useActivityStateContext,
  useAutomationsStateContext,
  useDevicesStateContext,
  useNeuroStateContext,
  usePlatformsStateContext,
  useRecommendationsStateContext,
  useRoomsStateContext,
  useScenesStateContext,
  useUiStateContext
} from "../nexusContext.jsx";
import {
  selectActiveRoom,
  selectDashboardKpis,
  selectOverviewContext,
  selectPlatformHealth,
  selectQuickScenes,
  selectRecentActivity,
  selectRecommendationInsight,
  selectRoomDevices,
  selectRooms,
  selectRoomSummaries,
  selectSystemHealth,
  selectVisibleRecommendations
} from "../selectors.js";

export function useUiSelector(selector) {
  const ui = useUiStateContext();
  return selector(ui);
}

export function useRoomsSelector(selector) {
  const rooms = useRoomsStateContext();
  return selector(rooms);
}

export function useDevicesSelector(selector) {
  const devices = useDevicesStateContext();
  return selector(devices);
}

export function useRecommendationsSelector(selector) {
  const recommendations = useRecommendationsStateContext();
  return selector(recommendations);
}

export function usePlatformsSelector(selector) {
  const platforms = usePlatformsStateContext();
  return selector(platforms);
}

export function useNeuroSelector(selector) {
  const neuro = useNeuroStateContext();
  return selector(neuro);
}

export function useActivitySelector(selector) {
  const activity = useActivityStateContext();
  return selector(activity);
}

export function useRoomsList() {
  const rooms = useRoomsStateContext();
  return useMemo(() => selectRooms({ rooms }), [rooms]);
}

export function useActiveRoom() {
  const ui = useUiStateContext();
  const rooms = useRoomsStateContext();
  return useMemo(() => selectActiveRoom({ ui, rooms }), [ui, rooms]);
}

export function useRoomDevices(roomId) {
  const ui = useUiStateContext();
  const devices = useDevicesStateContext();
  return useMemo(() => selectRoomDevices({ ui, devices }, roomId), [ui, devices, roomId]);
}

export function useRoomSummaries() {
  const rooms = useRoomsStateContext();
  const devices = useDevicesStateContext();
  return useMemo(() => selectRoomSummaries({ rooms, devices }), [rooms, devices]);
}

export function useVisibleRecommendations() {
  const recommendations = useRecommendationsStateContext();
  return useMemo(() => selectVisibleRecommendations({ recommendations }), [recommendations]);
}

export function useOverviewContext() {
  const ui = useUiStateContext();
  const rooms = useRoomsStateContext();
  const devices = useDevicesStateContext();
  const recommendations = useRecommendationsStateContext();
  const platforms = usePlatformsStateContext();
  const neuro = useNeuroStateContext();
  const activity = useActivityStateContext();

  return useMemo(
    () => selectOverviewContext({ ui, rooms, devices, recommendations, platforms, neuro, activity }),
    [ui, rooms, devices, recommendations, platforms, neuro, activity]
  );
}

export function useDashboardKpis() {
  const devices = useDevicesStateContext();
  const recommendations = useRecommendationsStateContext();
  const platforms = usePlatformsStateContext();
  const scenes = useScenesStateContext();
  const automations = useAutomationsStateContext();
  const neuro = useNeuroStateContext();
  const activity = useActivityStateContext();

  return useMemo(
    () => selectDashboardKpis({ devices, recommendations, platforms, scenes, automations, neuro, activity }),
    [devices, recommendations, platforms, scenes, automations, neuro, activity]
  );
}

export function useQuickScenes() {
  const ui = useUiStateContext();
  const rooms = useRoomsStateContext();
  const scenes = useScenesStateContext();
  return useMemo(() => selectQuickScenes({ ui, rooms, scenes }), [ui, rooms, scenes]);
}

export function usePlatformHealth() {
  const platforms = usePlatformsStateContext();
  return useMemo(() => selectPlatformHealth({ platforms }), [platforms]);
}

export function useRecentActivity(limit = 6) {
  const activity = useActivityStateContext();
  return useMemo(() => selectRecentActivity({ activity }, limit), [activity, limit]);
}

export function useRecommendationInsight(recommendationId) {
  const ui = useUiStateContext();
  const rooms = useRoomsStateContext();
  const devices = useDevicesStateContext();
  const recommendations = useRecommendationsStateContext();
  const platforms = usePlatformsStateContext();
  const neuro = useNeuroStateContext();
  const activity = useActivityStateContext();

  return useMemo(
    () =>
      selectRecommendationInsight(
        { ui, rooms, devices, recommendations, platforms, neuro, activity },
        recommendationId
      ),
    [ui, rooms, devices, recommendations, platforms, neuro, activity, recommendationId]
  );
}

export function useSystemHealth() {
  const devices = useDevicesStateContext();
  const recommendations = useRecommendationsStateContext();
  const platforms = usePlatformsStateContext();
  const neuro = useNeuroStateContext();
  const activity = useActivityStateContext();

  return useMemo(
    () => selectSystemHealth({ devices, recommendations, platforms, neuro, activity }),
    [devices, recommendations, platforms, neuro, activity]
  );
}
