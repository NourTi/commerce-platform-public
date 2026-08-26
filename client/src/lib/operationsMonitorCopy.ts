import type { Locale } from "./publicCopy";

type OperationsMonitorCopy = {
  trigger: string; eyebrow: string; title: string; refreshing: string; native: string; loading: string;
  lowStock: string; paymentReviews: string; queued: string; providerAccepted: string; providerFailed: string;
  boundary: string; recentInventory: string; noLowStock: string; noInventory: string; refresh: string; retry: string;
};

export const operationsMonitorCopy: Record<Locale, OperationsMonitorCopy> = {
  en: {
    trigger: "Operations monitor", eyebrow: "Operations monitor", title: "Stock and queue signals", refreshing: "Refreshing…", native: "Native records", loading: "Loading monitor…",
    lowStock: "Low stock", paymentReviews: "Payment reviews", queued: "Queued notices", providerAccepted: "Provider accepted", providerFailed: "Provider failed",
    boundary: "Queued notices await a provider attempt. Provider accepted means Mailjet accepted the request, not recipient delivery. Failed notices need merchant follow-up; delivery, bounce, and complaint events are not shown here.",
    recentInventory: "Recent inventory activity", noLowStock: "No variants are at or below their alert threshold.", noInventory: "No inventory movements yet.", refresh: "Refresh catalog", retry: "Retry",
  },
  fr: {
    trigger: "Moniteur des opérations", eyebrow: "Moniteur des opérations", title: "Signaux de stock et de file", refreshing: "Actualisation…", native: "Enregistrements natifs", loading: "Chargement du moniteur…",
    lowStock: "Stock bas", paymentReviews: "Paiements à revoir", queued: "Avis en attente", providerAccepted: "Accepté par le fournisseur", providerFailed: "Échec fournisseur",
    boundary: "Les avis en attente attendent une tentative du fournisseur. « Accepté par le fournisseur » signifie que Mailjet a accepté la demande, pas une livraison au destinataire. Les échecs nécessitent un suivi marchand ; les événements de livraison, rebond et plainte ne sont pas affichés ici.",
    recentInventory: "Activité récente du stock", noLowStock: "Aucune variante n’est au seuil d’alerte ou en dessous.", noInventory: "Aucun mouvement de stock pour le moment.", refresh: "Actualiser le catalogue", retry: "Réessayer",
  },
  ar: {
    trigger: "مراقب العمليات", eyebrow: "مراقب العمليات", title: "إشارات المخزون والطابور", refreshing: "جارٍ التحديث…", native: "سجلات أصلية", loading: "جارٍ تحميل المراقب…",
    lowStock: "مخزون منخفض", paymentReviews: "مراجعات الدفع", queued: "إشعارات في الانتظار", providerAccepted: "قبله الموفّر", providerFailed: "فشل الموفّر",
    boundary: "تنتظر الإشعارات المعلّقة محاولة من الموفّر. تعني «قبله الموفّر» أن Mailjet قبل الطلب، وليس أنه وصل إلى المستلم. تحتاج الإشعارات الفاشلة متابعة التاجر؛ ولا تُعرض هنا أحداث الوصول أو الارتداد أو الشكوى.",
    recentInventory: "نشاط المخزون الأخير", noLowStock: "لا توجد متغيرات عند حد التنبيه أو دونه.", noInventory: "لا توجد حركات مخزون بعد.", refresh: "حدّث الكتالوج", retry: "إعادة المحاولة",
  },
};
