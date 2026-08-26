export type WorkspaceQueryState = "HIDDEN" | "LOADING" | "ERROR" | "REFRESHING" | "EMPTY" | "READY";

export function getWorkspaceQueryState(input: { hasWorkspace: boolean; hasData: boolean; productCount: number; isLoading: boolean; isFetching: boolean; hasError: boolean }): WorkspaceQueryState {
  if (!input.hasWorkspace) return "HIDDEN";
  if (input.hasError) return "ERROR";
  if (input.isLoading && !input.hasData) return "LOADING";
  if (input.isFetching && input.hasData) return "REFRESHING";
  if (input.hasData && input.productCount === 0) return "EMPTY";
  return "READY";
}
