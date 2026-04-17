import { useEffect, useRef } from "react";
import { useUiStateContext, useNexusDispatch } from "../state/nexusContext.jsx";
import { readPersistedUiState, writePersistedUiState } from "../state/persistence.js";

export function usePersistedPreferences() {
  const ui = useUiStateContext();
  const { actions } = useNexusDispatch();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    actions.hydrateUiPreferences(readPersistedUiState());
    hasLoadedRef.current = true;
  }, [actions]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      return;
    }

    writePersistedUiState(ui);
  }, [ui]);
}

