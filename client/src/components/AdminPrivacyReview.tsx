import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

const copy = {
  en: { eyebrow: "Privacy operations", title: "Customer data requests", empty: "No customer privacy requests are waiting for review.", review: "Mark under review", complete: "Mark completed", reject: "Reject request", note: "Reviewer note", retain: "Completion records the review only; it does not automatically erase legal, tax, payment, or order records." },
  fr: { eyebrow: "Confidentialité", title: "Demandes de données client", empty: "Aucune demande client n'attend d'examen.", review: "Marquer en cours", complete: "Marquer terminée", reject: "Refuser la demande", note: "Note de l'examinateur", retain: "La clôture enregistre uniquement l'examen ; elle ne supprime pas automatiquement les données de commande, de paiement, fiscales ou légales." },
  ar: { eyebrow: "عمليات الخصوصية", title: "طلبات بيانات العملاء", empty: "لا توجد طلبات بيانات عملاء بانتظار المراجعة.", review: "وضع قيد المراجعة", complete: "وضع كمكتمل", reject: "رفض الطلب", note: "ملاحظة المراجع", retain: "الإكمال يوثق المراجعة فقط؛ ولا يحذف تلقائياً سجلات الطلبات أو المدفوعات أو الضرائب أو السجلات القانونية." },
} as const;

export default function AdminPrivacyReview() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const utils = trpc.useUtils();
  const requests = trpc.commerce.adminPrivacyRequests.useQuery();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const resolve = trpc.commerce.adminResolvePrivacyRequest.useMutation({
    onSuccess: () => utils.commerce.adminPrivacyRequests.invalidate(),
  });
  const review = (requestId: string, status: "UNDER_REVIEW" | "COMPLETED" | "REJECTED", saved?: string | null) => {
    resolve.mutate({ requestId, status, resolution: notes[requestId] ?? saved ?? undefined });
  };
  if (requests.isLoading) return <article className="admin-panel full privacy-review-panel"><Loader2 className="animate-spin" /></article>;
  return <article className="admin-panel full privacy-review-panel">
    <header><div><p className="eyebrow">{text.eyebrow}</p><h2>{text.title}</h2></div><ShieldCheck size={18} /></header>
    <p className="privacy-retention-boundary">{text.retain}</p>
    {!requests.data?.length ? <p className="empty-copy">{text.empty}</p> : <div className="privacy-review-list">
      {requests.data.map(({ request, user }) => <section key={request.id}>
        <div className="privacy-review-title"><div><b>{request.type}</b><small>{user.name ?? "Customer"} · {user.email ?? "Email unavailable"}</small></div><span>{request.status}</span></div>
        <small>{new Date(request.createdAt).toLocaleString(locale === "ar" ? "ar" : locale)}</small>
        {request.note ? <p>{request.note}</p> : null}
        <label>{text.note}<textarea value={notes[request.id] ?? request.resolution ?? ""} onChange={event => setNotes(current => ({ ...current, [request.id]: event.target.value }))} maxLength={1000} /></label>
        <div className="privacy-review-actions"><button type="button" disabled={resolve.isPending} onClick={() => review(request.id, "UNDER_REVIEW", request.resolution)}>{text.review}</button><button type="button" disabled={resolve.isPending} onClick={() => review(request.id, "COMPLETED", request.resolution)}>{text.complete}</button><button type="button" disabled={resolve.isPending} onClick={() => review(request.id, "REJECTED", request.resolution)}>{text.reject}</button></div>
      </section>)}
    </div>}
    {requests.error || resolve.error ? <p className="admin-message">{requests.error?.message ?? resolve.error?.message}</p> : null}
  </article>;
}
