import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { operationsMonitorCopy } from "@/lib/operationsMonitorCopy";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, BellRing, CheckCircle2, ChevronDown, ChevronUp, CircleX, ClipboardCheck, Loader2, PackageSearch, RefreshCw } from "lucide-react";
import { useState } from "react";
import "../merchant-operations-monitor.css";

export default function MerchantOperationsMonitor() {
  const { user } = useAuth();
  const { locale, direction } = useLanguage();
  const text = operationsMonitorCopy[locale];
  const workspace = trpc.commerce.workspace.mine.useQuery(undefined, { enabled: Boolean(user), refetchOnWindowFocus: false });
  const [open, setOpen] = useState(false);
  const storeId = workspace.data?.store.id;
  const role = workspace.data?.membership.role;
  const monitoring = trpc.commerce.workspace.operations.monitoring.useQuery({ storeId: storeId ?? "missing-store" }, { enabled: Boolean(storeId) && open, placeholderData: previous => previous, refetchOnWindowFocus: false });
  if (!user || !storeId || !["OWNER", "MANAGER", "MERCHANDISER", "ANALYST"].includes(role ?? "")) return null;
  const metrics = monitoring.data?.metrics;
  return <aside className={`merchant-operations-monitor ${open ? "is-open" : ""}`} dir={direction} aria-label={text.trigger}>
    <button type="button" className="merchant-operations-monitor-trigger" onClick={() => setOpen(value => !value)} aria-expanded={open}><Activity size={16} />{text.trigger} {metrics?.lowStockCount ? <b>{metrics.lowStockCount}</b> : null}{open ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</button>
    {open ? <div className="merchant-operations-monitor-panel"><header><div><span>{text.eyebrow}</span><h2>{text.title}</h2></div><small>{monitoring.isFetching ? text.refreshing : text.native}</small></header>{monitoring.isLoading ? <p className="merchant-operations-monitor-empty"><Loader2 className="animate-spin" size={15} />{text.loading}</p> : monitoring.error ? <p className="merchant-operations-monitor-error"><AlertTriangle size={15} />{monitoring.error.message}<button type="button" onClick={() => monitoring.refetch()}><RefreshCw size={13} />{text.retry}</button></p> : <><div className="merchant-operations-monitor-metrics"><div><PackageSearch size={15} /><strong>{metrics?.lowStockCount ?? 0}</strong><small>{text.lowStock}</small></div><div><ClipboardCheck size={15} /><strong>{metrics?.paymentReviewCount ?? 0}</strong><small>{text.paymentReviews}</small></div><div><BellRing size={15} /><strong>{metrics?.queuedNotificationCount ?? 0}</strong><small>{text.queued}</small></div><div><CheckCircle2 size={15} /><strong>{metrics?.providerAcceptedNotificationCount ?? 0}</strong><small>{text.providerAccepted}</small></div><div><CircleX size={15} /><strong>{metrics?.failedNotificationCount ?? 0}</strong><small>{text.providerFailed}</small></div></div><p className="merchant-operations-monitor-boundary">{text.boundary}</p><section><h3>{text.lowStock}</h3>{!monitoring.data?.lowStock.length ? <p className="merchant-operations-monitor-empty">{text.noLowStock}</p> : <ul>{monitoring.data.lowStock.map(item => <li key={item.variantId}><div><b>{item.productTitle}</b><small>{item.variantTitle} · {item.sku}</small></div><strong>{item.inventoryQty}/{item.lowStockThreshold}</strong></li>)}</ul>}</section><section><h3>{text.recentInventory}</h3>{!monitoring.data?.recentMovements.length ? <p className="merchant-operations-monitor-empty">{text.noInventory}</p> : <ul>{monitoring.data.recentMovements.map(item => <li key={item.id}><div><b>{item.productTitle}</b><small>{item.variantTitle} · {item.reason.replaceAll("_", " ")}</small></div><strong className={item.delta >= 0 ? "positive" : "negative"}>{item.delta >= 0 ? "+" : ""}{item.delta}</strong></li>)}</ul>}</section></>}</div> : null}
  </aside>;
}
