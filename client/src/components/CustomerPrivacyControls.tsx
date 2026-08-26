import { trpc } from "@/lib/trpc";
import { Download, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import "../customer-privacy.css";

const privacyCopy = {
  en: { eyebrow: "PRIVACY", title: "Your account data", body: "Download the customer data currently linked to this account. Deletion requests are reviewed manually because order, tax, and payment records may have legal retention requirements.", preparing: "Preparing export…", download: "Download my data", downloaded: "Your JSON file was prepared locally in this browser.", note: "Deletion request note (optional)", placeholder: "Tell us anything that may help the review.", submitting: "Submitting…", request: "Request deletion review", received: "Request received for manual review. No data has been deleted automatically." },
  fr: { eyebrow: "CONFIDENTIALITÉ", title: "Les données de votre compte", body: "Téléchargez les données client actuellement liées à ce compte. Les demandes de suppression sont examinées manuellement, car les commandes, taxes et paiements peuvent être soumis à des obligations de conservation.", preparing: "Préparation de l’export…", download: "Télécharger mes données", downloaded: "Votre fichier JSON a été préparé localement dans ce navigateur.", note: "Note pour la demande de suppression (facultatif)", placeholder: "Ajoutez toute information utile à l’examen.", submitting: "Envoi…", request: "Demander l’examen de suppression", received: "Demande reçue pour examen manuel. Aucune donnée n’a été supprimée automatiquement." },
  ar: { eyebrow: "الخصوصية", title: "بيانات حسابك", body: "نزّل بيانات العميل المرتبطة بهذا الحساب حالياً. تُراجع طلبات الحذف يدوياً لأن سجلات الطلبات والضرائب والمدفوعات قد تخضع لمتطلبات احتفاظ قانونية.", preparing: "جارٍ إعداد التصدير…", download: "تنزيل بياناتي", downloaded: "تم إعداد ملف JSON محلياً في هذا المتصفح.", note: "ملاحظة لطلب الحذف (اختياري)", placeholder: "أضف أي معلومات قد تساعد في المراجعة.", submitting: "جارٍ الإرسال…", request: "طلب مراجعة الحذف", received: "تم استلام الطلب للمراجعة اليدوية. لم تُحذف أي بيانات تلقائياً." },
} as const;

export default function CustomerPrivacyControls() {
  const { locale } = useLanguage();
  const copy = privacyCopy[locale];
  const [note, setNote] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const exportData = trpc.commerce.exportMyData.useQuery(undefined, { enabled: false, retry: false });
  const requestErasure = trpc.commerce.requestErasure.useMutation({ onSuccess: () => setNote("") });
  const download = async () => {
    setDownloaded(false);
    const result = await exportData.refetch();
    if (!result.data) return;
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `commerce-account-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };
  return <section className="customer-privacy-controls"><div><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div><div className="customer-privacy-actions"><button type="button" disabled={exportData.isFetching} onClick={download}><Download size={15} />{exportData.isFetching ? copy.preparing : copy.download}</button>{downloaded ? <small>{copy.downloaded}</small> : null}</div><div className="customer-erasure-request"><label>{copy.note}<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} placeholder={copy.placeholder} /></label><button type="button" disabled={requestErasure.isPending} onClick={() => requestErasure.mutate({ note: note || undefined })}><ShieldAlert size={15} />{requestErasure.isPending ? copy.submitting : copy.request}</button>{requestErasure.data ? <small>{copy.received}</small> : null}</div>{exportData.error || requestErasure.error ? <p className="customer-account-error">{exportData.error?.message ?? requestErasure.error?.message}</p> : null}</section>;
}
