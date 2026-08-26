export type Locale = "en" | "fr" | "ar";

type LandingCopy = {
  logo: string;
  nav: { home: string; about: string; product: string; studio: string; store: string; signIn: string };
  hero: { eyebrow: string; lines: string[]; cta: string };
  about: { eyebrow: string; lines: string[]; body: string; cta: string };
  product: { eyebrow: string; title: string; body: string; items: Array<{ number: string; title: string; body: string }> };
  studio: { eyebrow: string; title: string; body: string; desktop: string; mobile: string; themes: string; sections: string; publish: string; action: string };
  operations: { eyebrow: string; title: string; body: string; labels: { revenue: string; orders: string; conversion: string; catalog: string; campaigns: string; extensions: string }; action: string };
  extensions: { eyebrow: string; title: string; body: string; cards: Array<{ title: string; body: string; state: string }> };
  launch: { eyebrow: string; title: string; body: string; primary: string; secondary: string };
};

export const publicCopy: Record<Locale, LandingCopy> = {
  en: {
    logo: "commerce",
    nav: { home: "Home", about: "Foundation", product: "Product", studio: "Studio", store: "Open store", signIn: "Customer sign in" },
    hero: { eyebrow: "Commerce, ready to launch", lines: ["Launch", "your", "commerce", "system", "for", "business"], cta: "Get started" },
    about: { eyebrow: "A ready foundation", lines: ["Ready", "to sell"], body: "A complete commerce foundation for merchants and agencies: storefront, catalog, cart, promotions, merchant operations, and a clean extension surface in one practical starting point.", cta: "Explore the store" },
    product: { eyebrow: "One system, not a stack of handoffs", title: "Operate the store that the customer actually sees.", body: "The product is organized around a merchant’s work: shape a storefront, move a collection, watch an order, and change a campaign without losing the commercial thread.", items: [{ number: "01", title: "Storefront", body: "A real catalogue, cart and checkout route—designed as a customer destination, not a demo tile." }, { number: "02", title: "Merchandising", body: "Products, inventory and promotions travel with the store that owns them." }, { number: "03", title: "Operations", body: "Orders, customer context and campaign signals live in the merchant’s workspace." }] },
    studio: { eyebrow: "Storefront studio", title: "Compose the page. See the real storefront.", body: "Choose a visual language, edit page sections, and inspect desktop and mobile states before you publish. The preview is a storefront configuration, not a disconnected mockup.", desktop: "Desktop", mobile: "Mobile", themes: "Themes", sections: "Sections", publish: "Ready to publish", action: "Open storefront studio" },
    operations: { eyebrow: "Merchant command", title: "Work from the commercial signal, not a pile of tabs.", body: "A merchant workspace brings catalog movement, orders, campaigns and storefront work into one focused operating surface.", labels: { revenue: "Sales this period", orders: "Orders in motion", conversion: "Conversion pulse", catalog: "Catalog", campaigns: "Campaigns", extensions: "Extensions" }, action: "Enter merchant workspace" },
    extensions: { eyebrow: "Built to extend", title: "A clear boundary for what comes next.", body: "Themes own the customer-facing expression. Extensions add operational capability. Neither requires rewriting the commerce core.", cards: [{ title: "Theme manifest", body: "Visual presets, tokens and homepage sections stored with the merchant store.", state: "Storefront" }, { title: "Campaign capture", body: "An enabled native collection surface ready to connect to a customer tool.", state: "Enabled" }, { title: "Measurement", body: "A deliberate integration slot for verified campaign and conversion tooling.", state: "Optional" }] },
    launch: { eyebrow: "Start with a real store", title: "Build the commerce operation your team can own.", body: "Create a workspace, shape the storefront, manage the catalogue and publish from the same product surface.", primary: "Create merchant workspace", secondary: "View demo storefront" },
  },
  fr: {
    logo: "commerce",
    nav: { home: "Accueil", about: "Fondation", product: "Produit", studio: "Studio", store: "Ouvrir la boutique", signIn: "Connexion client" },
    hero: { eyebrow: "Le commerce, prêt à lancer", lines: ["Lancez", "votre", "commerce", "prêt", "pour", "vendre"], cta: "Commencer" },
    about: { eyebrow: "Une base prête", lines: ["Prêt", "à vendre"], body: "Une base e-commerce complète pour les commerçants et les agences : vitrine, catalogue, panier, promotions, opérations marchand et une surface d’extension claire dans un même point de départ.", cta: "Découvrir la boutique" },
    product: { eyebrow: "Un système, pas une chaîne de transferts", title: "Pilotez la boutique que le client voit réellement.", body: "Le produit suit le travail du marchand : façonner une vitrine, déplacer une collection, suivre une commande et changer une campagne sans perdre le fil commercial.", items: [{ number: "01", title: "Vitrine", body: "Un vrai catalogue, panier et parcours de paiement — une destination client, pas une tuile de démonstration." }, { number: "02", title: "Merchandising", body: "Produits, stock et promotions restent avec la boutique qui les possède." }, { number: "03", title: "Opérations", body: "Commandes, contexte client et signaux de campagne vivent dans l’espace marchand." }] },
    studio: { eyebrow: "Studio vitrine", title: "Composez la page. Voyez la vraie boutique.", body: "Choisissez un langage visuel, éditez les sections et vérifiez les formats ordinateur et mobile avant publication. L’aperçu est une configuration de vitrine, non une maquette déconnectée.", desktop: "Ordinateur", mobile: "Mobile", themes: "Thèmes", sections: "Sections", publish: "Prêt à publier", action: "Ouvrir le studio vitrine" },
    operations: { eyebrow: "Pilotage marchand", title: "Travaillez depuis le signal commercial, pas depuis une pile d’onglets.", body: "L’espace marchand réunit catalogue, commandes, campagnes et vitrine dans une même surface opérationnelle.", labels: { revenue: "Ventes de la période", orders: "Commandes en cours", conversion: "Signal de conversion", catalog: "Catalogue", campaigns: "Campagnes", extensions: "Extensions" }, action: "Entrer dans l’espace marchand" },
    extensions: { eyebrow: "Conçu pour s’étendre", title: "Une frontière claire pour la suite.", body: "Les thèmes portent l’expression côté client. Les extensions ajoutent des capacités opérationnelles. Aucun ne réécrit le cœur commerce.", cards: [{ title: "Manifeste de thème", body: "Préréglages, jetons et sections d’accueil stockés avec la boutique du marchand.", state: "Vitrine" }, { title: "Capture campagne", body: "Une surface native activée, prête à rejoindre un outil client.", state: "Activé" }, { title: "Mesure", body: "Un emplacement d’intégration volontaire pour les outils de campagne et conversion vérifiés.", state: "Optionnel" }] },
    launch: { eyebrow: "Commencez avec une vraie boutique", title: "Construisez l’opération commerce que votre équipe peut posséder.", body: "Créez un espace, façonnez la vitrine, gérez le catalogue et publiez depuis le même produit.", primary: "Créer l’espace marchand", secondary: "Voir la vitrine démo" },
  },
  ar: {
    logo: "التجارة",
    nav: { home: "الرئيسية", about: "الأساس", product: "المنتج", studio: "الاستوديو", store: "افتح المتجر", signIn: "دخول العميل" },
    hero: { eyebrow: "تجارة جاهزة للإطلاق", lines: ["أطلق", "متجرك", "التجاري", "الجاهز", "للبيع", "اليوم"], cta: "ابدأ الآن" },
    about: { eyebrow: "أساس جاهز", lines: ["متجر", "جاهز للبيع"], body: "أساس تجارة إلكترونية متكامل للتجار والوكالات: واجهة متجر، كتالوج، سلة، عروض، عمليات التاجر، ومساحة واضحة للتوسّع ضمن نقطة بداية عملية واحدة.", cta: "استكشف المتجر" },
    product: { eyebrow: "نظام واحد، لا سلسلة من التحويلات", title: "أدر المتجر الذي يراه العميل فعلًا.", body: "يتبع المنتج عمل التاجر: شكّل الواجهة، حرّك المجموعة، راقب الطلب، وعدّل الحملة من دون فقدان الخيط التجاري.", items: [{ number: "01", title: "واجهة المتجر", body: "كتالوج وسلة ومسار دفع حقيقي — وجهة للعميل، لا بطاقة عرض." }, { number: "02", title: "التسويق التجاري", body: "المنتجات والمخزون والعروض تبقى مع المتجر الذي يملكها." }, { number: "03", title: "العمليات", body: "الطلبات وسياق العميل وإشارات الحملة تعمل ضمن مساحة التاجر." }] },
    studio: { eyebrow: "استوديو واجهة المتجر", title: "كوّن الصفحة. شاهد المتجر الحقيقي.", body: "اختر لغة بصرية وعدّل الأقسام وافحص الحاسوب والهاتف قبل النشر. المعاينة إعداد حقيقي للمتجر وليست نموذجًا منفصلًا.", desktop: "الحاسوب", mobile: "الهاتف", themes: "السمات", sections: "الأقسام", publish: "جاهز للنشر", action: "افتح استوديو المتجر" },
    operations: { eyebrow: "قيادة التاجر", title: "اعمل من الإشارة التجارية، لا من كومة تبويبات.", body: "تجمع مساحة التاجر الكتالوج والطلبات والحملات وعمل واجهة المتجر ضمن سطح تشغيلي واحد.", labels: { revenue: "مبيعات هذه الفترة", orders: "طلبات قيد الحركة", conversion: "نبض التحويل", catalog: "الكتالوج", campaigns: "الحملات", extensions: "التوسعات" }, action: "ادخل مساحة التاجر" },
    extensions: { eyebrow: "مبني للتوسّع", title: "حد واضح لما يأتي بعد ذلك.", body: "السمات تملك التعبير الذي يراه العميل. التوسعات تضيف قدرة تشغيلية. ولا يحتاج أي منهما إلى إعادة كتابة نواة التجارة.", cards: [{ title: "بيان السمة", body: "إعدادات مرئية ورموز وأقسام صفحة رئيسية محفوظة مع متجر التاجر.", state: "واجهة المتجر" }, { title: "التقاط الحملات", body: "سطح أصلي مفعّل وجاهز للاتصال بأداة العميل.", state: "مفعّل" }, { title: "القياس", body: "موضع تكامل مدروس لأدوات الحملة والتحويل الموثقة.", state: "اختياري" }] },
    launch: { eyebrow: "ابدأ بمتجر حقيقي", title: "ابنِ عملية التجارة التي يستطيع فريقك امتلاكها.", body: "أنشئ مساحة وشكّل الواجهة وأدر الكتالوج وانشر من سطح المنتج نفسه.", primary: "أنشئ مساحة تاجر", secondary: "شاهد واجهة المتجر التجريبية" },
  },
};

export const localeMeta: Record<Locale, { label: string; direction: "ltr" | "rtl" }> = {
  en: { label: "EN", direction: "ltr" },
  fr: { label: "FR", direction: "ltr" },
  ar: { label: "ع", direction: "rtl" },
};
