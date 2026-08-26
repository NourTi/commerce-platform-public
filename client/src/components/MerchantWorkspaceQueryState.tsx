import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { workspaceQueryCopy } from "@/lib/workspaceQueryCopy";
import { getWorkspaceQueryState } from "@/lib/workspaceQueryState";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Loader2, PackageOpen, RefreshCw } from "lucide-react";
import "../merchant-workspace-query-state.css";

export default function MerchantWorkspaceQueryState() {
  const { user } = useAuth();
  const { locale, direction } = useLanguage();
  const text = workspaceQueryCopy[locale];
  const merchant = trpc.commerce.workspace.mine.useQuery(undefined, { enabled: Boolean(user), refetchOnWindowFocus: false });
  const overview = trpc.commerce.workspace.operations.overview.useQuery(undefined, { enabled: Boolean(merchant.data), placeholderData: previous => previous, refetchOnWindowFocus: false });
  const state = getWorkspaceQueryState({ hasWorkspace: Boolean(merchant.data), hasData: Boolean(overview.data), productCount: overview.data?.products.length ?? 0, isLoading: overview.isLoading, isFetching: overview.isFetching, hasError: Boolean(overview.error) });

  if (!user || state === "HIDDEN") return null;
  if (state === "READY") return <aside className="merchant-workspace-query-state is-ready" dir={direction}><button type="button" onClick={() => overview.refetch()} aria-label={text.refreshLabel}><RefreshCw size={13} />{text.refresh}</button></aside>;
  if (state === "LOADING") return <aside className="merchant-workspace-query-state is-loading" dir={direction} role="status" aria-live="polite" aria-busy="true"><Loader2 className="animate-spin" size={15} />{text.loading}</aside>;
  if (state === "REFRESHING") return <aside className="merchant-workspace-query-state is-refreshing" dir={direction} role="status" aria-live="polite" aria-busy="true"><RefreshCw className="animate-spin" size={15} /><span>{text.refreshing}</span><button type="button" disabled>{text.refresh}</button></aside>;
  if (state === "ERROR") return <aside className="merchant-workspace-query-state is-error" dir={direction} role="alert"><AlertTriangle size={15} /><span>{overview.data ? text.refreshFailed : text.unavailable}</span><button type="button" onClick={() => overview.refetch()}><RefreshCw size={13} />{text.retry}</button></aside>;
  if (state === "EMPTY") return <aside className="merchant-workspace-query-state is-empty" dir={direction} aria-live="polite"><PackageOpen size={15} />{text.empty}</aside>;
  return null;
}
