import type { Locale } from "./publicCopy";

type MerchantCommercialCopy = {
  trigger: string; eyebrow: string; title: string; identity: string; legalName: string; email: string; phone: string; taxRegistration: string; optional: string; applyTax: string; requireAccount: string; saving: string; saveSettings: string;
  seo: string; seoBody: string; storeTitle: string; canonical: string; description: string; seoDescriptionPlaceholder: string; saveSeo: string;
  payments: string; paymentsBody: string; status: string; active: string; test: string; disabled: string; connector: string; cod: string; codHint: string; bank: string; bankHint: string;
  invoices: string; invoicesBody: string; loadingInvoices: string; noInvoices: string; transferReference: string; submitReference: string; pendingInvoice: string; awaitingReview: string; approved: string; voided: string; due: string;
  delivery: string; deliveryReady: (count: number) => string; deliveryMissing: string; zone: string; region: string; label: string; price: string; minDays: string; maxDays: string; allowCod: string; saveDelivery: string;
  taxes: string; taxReady: (count: number) => string; taxMissing: string; ruleName: string; rate: string; taxDelivery: string; activeRule: string; saveTax: string;
};

export const merchantCommercialCopy: Record<Locale, MerchantCommercialCopy> = {
  en: {
    trigger: "Commerce setup", eyebrow: "Algeria-first commerce", title: "Payments, identity, checkout", identity: "Merchant identity", legalName: "Legal business name", email: "Business email", phone: "Phone", taxRegistration: "Tax registration", optional: "Optional", applyTax: "Apply configured tax rates", requireAccount: "Require customer account", saving: "Saving…", saveSettings: "Save business settings",
    seo: "Search metadata", seoBody: "Controls the public store title, search summary, and canonical base. Product pages keep their product-specific path.", storeTitle: "Store title", canonical: "Canonical origin", description: "Search description", seoDescriptionPlaceholder: "What customers can expect from this store.", saveSeo: "Save search metadata",
    payments: "Checkout methods", paymentsBody: "Customers see only active methods. Cash collected by a carrier remains separate from settlement.", status: "status", active: "Active", test: "Test", disabled: "Disabled", connector: "Disabled · connector required", cod: "Cash on delivery", codHint: "Merchant review is required after collection at delivery.", bank: "Bank transfer", bankHint: "The merchant reviews the customer’s submitted transfer reference.",
    invoices: "Platform subscription invoices", invoicesBody: "When the platform issues an invoice, submit your bank-transfer reference here. Review is manual; no platform-hosted payment or payout is used.", loadingInvoices: "Loading subscription invoices…", noInvoices: "No subscription invoices have been issued for this store.", transferReference: "Bank transfer reference", submitReference: "Submit reference", pendingInvoice: "Awaiting transfer reference", awaitingReview: "Awaiting platform review", approved: "Approved manually", voided: "Voided", due: "due",
    delivery: "Delivery readiness", deliveryReady: count => `${count} delivery rate${count === 1 ? "" : "s"} configured.`, deliveryMissing: "Add a delivery rate before opening native checkout.", zone: "Zone", region: "Wilaya / city (optional)", label: "Customer label", price: "Price (DZD minor units)", minDays: "Minimum days", maxDays: "Maximum days", allowCod: "Allow cash on delivery", saveDelivery: "Save delivery rate",
    taxes: "Tax rules", taxReady: count => `${count} tax rule${count === 1 ? "" : "s"} configured.`, taxMissing: "Enable tax above, then add the rate your business applies.", ruleName: "Rule name", rate: "Rate (%)", taxDelivery: "Apply this tax to delivery", activeRule: "Active", saveTax: "Save tax rule",
  },
  fr: {
    trigger: "Configuration commerce", eyebrow: "Commerce d’abord algérien", title: "Paiements, identité, paiement", identity: "Identité marchand", legalName: "Raison sociale", email: "E-mail professionnel", phone: "Téléphone", taxRegistration: "Immatriculation fiscale", optional: "Facultatif", applyTax: "Appliquer les taux de taxe configurés", requireAccount: "Exiger un compte client", saving: "Enregistrement…", saveSettings: "Enregistrer les paramètres",
    seo: "Métadonnées de recherche", seoBody: "Contrôle le titre public, le résumé de recherche et la base canonique. Les pages produit gardent leur chemin spécifique.", storeTitle: "Titre de la boutique", canonical: "Origine canonique", description: "Description de recherche", seoDescriptionPlaceholder: "Ce que les clients peuvent attendre de cette boutique.", saveSeo: "Enregistrer les métadonnées",
    payments: "Méthodes de paiement", paymentsBody: "Les clients ne voient que les méthodes actives. Les espèces collectées par un transporteur restent séparées du règlement.", status: "état", active: "Actif", test: "Test", disabled: "Désactivé", connector: "Désactivé · connecteur requis", cod: "Paiement à la livraison", codHint: "Un examen marchand est requis après l’encaissement à la livraison.", bank: "Virement bancaire", bankHint: "Le marchand examine la référence de virement transmise par le client.",
    invoices: "Factures d’abonnement plateforme", invoicesBody: "Lorsque la plateforme émet une facture, soumettez ici votre référence de virement. L’examen est manuel ; aucun paiement ni versement hébergé par la plateforme n’est utilisé.", loadingInvoices: "Chargement des factures d’abonnement…", noInvoices: "Aucune facture d’abonnement n’a été émise pour cette boutique.", transferReference: "Référence de virement", submitReference: "Soumettre la référence", pendingInvoice: "En attente de référence de virement", awaitingReview: "En attente de l’examen plateforme", approved: "Approuvée manuellement", voided: "Annulée", due: "échéance",
    delivery: "Préparation de la livraison", deliveryReady: count => `${count} tarif${count === 1 ? "" : "s"} de livraison configuré${count === 1 ? "" : "s"}.`, deliveryMissing: "Ajoutez un tarif de livraison avant d’ouvrir le paiement natif.", zone: "Zone", region: "Wilaya / ville (facultatif)", label: "Libellé client", price: "Prix (unités mineures DZD)", minDays: "Jours minimum", maxDays: "Jours maximum", allowCod: "Autoriser le paiement à la livraison", saveDelivery: "Enregistrer le tarif",
    taxes: "Règles fiscales", taxReady: count => `${count} règle${count === 1 ? "" : "s"} fiscale${count === 1 ? "" : "s"} configurée${count === 1 ? "" : "s"}.`, taxMissing: "Activez la taxe ci-dessus, puis ajoutez le taux appliqué par votre entreprise.", ruleName: "Nom de la règle", rate: "Taux (%)", taxDelivery: "Appliquer cette taxe à la livraison", activeRule: "Active", saveTax: "Enregistrer la règle fiscale",
  },
  ar: {
    trigger: "إعداد التجارة", eyebrow: "تجارة جزائرية أولاً", title: "الدفع والهوية وإتمام الطلب", identity: "هوية التاجر", legalName: "الاسم القانوني للنشاط", email: "بريد النشاط", phone: "الهاتف", taxRegistration: "التسجيل الضريبي", optional: "اختياري", applyTax: "تطبيق معدلات الضريبة المُعدة", requireAccount: "طلب حساب عميل", saving: "جارٍ الحفظ…", saveSettings: "حفظ إعدادات النشاط",
    seo: "بيانات البحث", seoBody: "تتحكم في عنوان المتجر العام وملخص البحث والأساس القانوني. تحتفظ صفحات المنتج بمسارها الخاص.", storeTitle: "عنوان المتجر", canonical: "الأصل القانوني", description: "وصف البحث", seoDescriptionPlaceholder: "ما الذي يمكن أن يتوقعه العملاء من هذا المتجر؟", saveSeo: "حفظ بيانات البحث",
    payments: "طرق إتمام الطلب", paymentsBody: "يرى العملاء الطرق النشطة فقط. تبقى الأموال التي يجمعها الناقل منفصلة عن التسوية.", status: "الحالة", active: "نشط", test: "اختبار", disabled: "معطّل", connector: "معطّل · يلزم موصل", cod: "الدفع عند الاستلام", codHint: "يتطلب الأمر مراجعة التاجر بعد التحصيل عند التسليم.", bank: "تحويل بنكي", bankHint: "يراجع التاجر مرجع التحويل الذي يقدمه العميل.",
    invoices: "فواتير اشتراك المنصة", invoicesBody: "عندما تصدر المنصة فاتورة، قدّم مرجع التحويل البنكي هنا. المراجعة يدوية ولا يُستخدم دفع أو تحويل مستضاف من المنصة.", loadingInvoices: "جارٍ تحميل فواتير الاشتراك…", noInvoices: "لم تصدر فواتير اشتراك لهذا المتجر.", transferReference: "مرجع التحويل البنكي", submitReference: "إرسال المرجع", pendingInvoice: "بانتظار مرجع التحويل", awaitingReview: "بانتظار مراجعة المنصة", approved: "مُعتمد يدوياً", voided: "ملغاة", due: "الاستحقاق",
    delivery: "جاهزية التسليم", deliveryReady: count => `تم إعداد ${count} من أسعار التسليم.`, deliveryMissing: "أضف سعر تسليم قبل فتح إتمام الطلب الأصلي.", zone: "المنطقة", region: "الولاية / المدينة (اختياري)", label: "تسمية العميل", price: "السعر (وحدات DZD الصغرى)", minDays: "الحد الأدنى للأيام", maxDays: "الحد الأقصى للأيام", allowCod: "السماح بالدفع عند الاستلام", saveDelivery: "حفظ سعر التسليم",
    taxes: "قواعد الضريبة", taxReady: count => `تم إعداد ${count} من قواعد الضريبة.`, taxMissing: "فعّل الضريبة أعلاه، ثم أضف المعدل الذي يطبقه نشاطك.", ruleName: "اسم القاعدة", rate: "المعدل (%)", taxDelivery: "تطبيق هذه الضريبة على التسليم", activeRule: "نشط", saveTax: "حفظ قاعدة الضريبة",
  },
};

export const merchantCommercialDefaults: Record<Locale, { delivery: { zoneName: string; rateName: string }; tax: { name: string } }> = {
  en: { delivery: { zoneName: "Algeria", rateName: "Standard delivery" }, tax: { name: "Standard tax" } },
  fr: { delivery: { zoneName: "Algérie", rateName: "Livraison standard" }, tax: { name: "Taxe standard" } },
  ar: { delivery: { zoneName: "الجزائر", rateName: "تسليم قياسي" }, tax: { name: "ضريبة قياسية" } },
};

export function merchantCommercialDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function merchantInvoiceStatus(locale: Locale, status: string) {
  const text = merchantCommercialCopy[locale];
  if (status === "PENDING_PAYMENT") return text.pendingInvoice;
  if (status === "AWAITING_REVIEW") return text.awaitingReview;
  if (status === "PAID") return text.approved;
  return text.voided;
}
