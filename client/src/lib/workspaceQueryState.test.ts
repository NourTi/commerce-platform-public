import { describe, expect, it } from "vitest";
import { getWorkspaceQueryState } from "./workspaceQueryState";

describe("getWorkspaceQueryState", () => {
  it("distinguishes initial loading, retained-data refresh, true empty, and error states", () => {
    expect(getWorkspaceQueryState({ hasWorkspace: true, hasData: false, productCount: 0, isLoading: true, isFetching: true, hasError: false })).toBe("LOADING");
    expect(getWorkspaceQueryState({ hasWorkspace: true, hasData: true, productCount: 8, isLoading: false, isFetching: true, hasError: false })).toBe("REFRESHING");
    expect(getWorkspaceQueryState({ hasWorkspace: true, hasData: true, productCount: 0, isLoading: false, isFetching: false, hasError: false })).toBe("EMPTY");
    expect(getWorkspaceQueryState({ hasWorkspace: true, hasData: true, productCount: 8, isLoading: false, isFetching: false, hasError: true })).toBe("ERROR");
  });

  it("keeps retained data actionable during a refetch and gives error priority when the refresh fails", () => {
    expect(getWorkspaceQueryState({ hasWorkspace: true, hasData: true, productCount: 8, isLoading: true, isFetching: true, hasError: false })).toBe("REFRESHING");
    expect(getWorkspaceQueryState({ hasWorkspace: true, hasData: true, productCount: 8, isLoading: false, isFetching: true, hasError: true })).toBe("ERROR");
    expect(getWorkspaceQueryState({ hasWorkspace: true, hasData: true, productCount: 8, isLoading: false, isFetching: false, hasError: false })).toBe("READY");
  });

  it("hides notices before a merchant workspace exists", () => {
    expect(getWorkspaceQueryState({ hasWorkspace: false, hasData: false, productCount: 0, isLoading: false, isFetching: false, hasError: false })).toBe("HIDDEN");
  });
});
