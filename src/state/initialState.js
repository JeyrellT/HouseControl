import { getMockNexusBootstrap } from "../integrations/mock/bootstrap.js";

export function createInitialNexusState() {
  return getMockNexusBootstrap();
}

export const initialNexusState = createInitialNexusState();

