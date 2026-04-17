import { createContext, useContext, useReducer } from "react";
import { appReducer } from "./app-reducer.js";

const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

export function AppProvider({ children, initialState }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);

  if (!context) {
    throw new Error("useAppDispatch debe ejecutarse dentro de AppProvider.");
  }

  return context;
}

export function useAppSelector(selector) {
  const state = useContext(AppStateContext);

  if (!state) {
    throw new Error("useAppSelector debe ejecutarse dentro de AppProvider.");
  }

  return selector(state);
}
