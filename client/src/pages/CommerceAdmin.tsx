import DashboardLayout from "@/components/DashboardLayout";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AdminPrivacyReview from "@/components/AdminPrivacyReview";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { startLogin } from "@/const";
import { money } from "@/lib/commerce";
import { commerceCopy, translateProductStatus } from "@/lib/commerceCopy";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Boxes, ChevronRight, CircleDollarSign, Eye, Loader2, Package, Plus, ShoppingCart } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";
import "../admin.css";

type ProductDraft = { title: string; handle: string; category: string; subtitle: string; description: string; sku: string; variantTitle: string; price: string; inventory: string };

function createEmptyDraft(variantTitle: string): ProductDraft {
  return { title: "", handle: "", category: "", subtitle: "", description: "", sku: "", variantTitle, price: "", inventory: "0" };
}

export default function CommerceAdmin() {
  const { user, loading } = useAuth();
  const { locale } = useLanguage();
  const copy = commerceCopy[locale].admin;
  const overview = trpc.commerce.adminOverview.useQuery(undefined, { enabled: user?.role === "admin" });
  const initialize = trpc.commerce.initializeDemoCatalog.useMutation({ onSuccess: () => overview.refetch() });
  const createProduct = trpc.commerce.createProduct.useMutation({ onSuccess: () => overview.refetch() });
  const setStatus = trpc.commerce.setProductStatus.useMutation({ onSuccess: () => overview.refetch() });
  const setInventory = trpc.commerce.setVariantInventory.useMutation({ onSuccess: () => overview.refetch() });
  const [draft, setDraft] = useState<ProductDraft>(() => createEmptyDraft(copy.defaultVariant));
  const [showCreate, setShowCreate] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    setFormMessage(null);
    try {
      await createProduct.mutateAsync({
        handle: draft.handle,
        title: draft.title,
        subtitle: draft.subtitle,
        description: draft.description,
        category: draft.category,
        status: "DRAFT",
        variant: { sku: draft.sku.toUpperCase(), title: draft.variantTitle, priceCents: Math.round(Number(draft.price) * 100), inventoryQty: Number(draft.inventory) },
      });
      setDraft(createEmptyDraft(copy.defaultVariant));
      setShowCreate(false);
      setFormMessage(copy.savedMessage);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : copy.unableToCreate);
    }
  }

  if (loading) return <DashboardLayout><div className="admin-state"><Loader2 className="animate-spin" /> {copy.loadingAccount}</div></DashboardLayout>;
  if (!user) return <DashboardLayout><div className="admin-state"><Boxes /><h1>{copy.protectedTitle}</h1><p>{copy.protectedBody}</p><Button onClick={startLogin}>{copy.signIn}</Button></div></DashboardLayout>;
  if (user.role !== "admin") return <DashboardLayout><div className="admin-state"><h1>{copy.accessRequired}</h1><p>{copy.accessBody}</p><Link href="/store" className="button-primary">{copy.returnStore}</Link></div></DashboardLayout>;

  return <DashboardLayout><main className="admin-console">
    <header className="admin-heading">
      <div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.heading}</h1><p>{copy.body}</p></div>
      <div className="admin-heading-controls"><LanguageSwitcher className="shell-language" /><Link href="/store" className="admin-store-link">{copy.viewStore} <ChevronRight size={16} /></Link></div>
    </header>
    {overview.isLoading ? <div className="admin-state"><Loader2 className="animate-spin" /> {copy.loadingData}</div> : overview.data?.products.length === 0 ? <section className="admin-setup"><Boxes /><p className="eyebrow">{copy.setupEyebrow}</p><h2>{copy.setupTitle}</h2><p>{copy.setupBody}</p><Button onClick={() => initialize.mutate()} disabled={initialize.isPending}>{initialize.isPending ? <Loader2 className="animate-spin" /> : <Boxes />} {copy.initialize}</Button>{initialize.data ? <p className="setup-result">{initialize.data.reason}</p> : null}</section> : <>
      <section className="admin-kpis"><article><Package /><span>{copy.publishedProducts}</span><strong>{overview.data?.products.filter(product => product.status === "PUBLISHED").length ?? 0}</strong></article><article><ShoppingCart /><span>{copy.openCarts}</span><strong>{overview.data?.openCarts ?? 0}</strong></article><article><CircleDollarSign /><span>{copy.ordersCreated}</span><strong>{overview.data?.orders.length ?? 0}</strong></article></section>
      <section className="admin-grid">
        <article className="admin-panel full">
          <header><div><p className="eyebrow">{copy.catalogEyebrow}</p><h2>{copy.catalogTitle}</h2></div><button type="button" className="small-action" onClick={() => setShowCreate(open => !open)}><Plus size={14} /> {copy.newProduct}</button></header>
          {showCreate ? <form className="product-create-form" onSubmit={submitProduct}>
            <label>{copy.title}<input required value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder={copy.placeholders.title} /></label>
            <label>{copy.handle}<input required value={draft.handle} onChange={event => setDraft({ ...draft, handle: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder={copy.placeholders.handle} /></label>
            <label>{copy.category}<input required value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} placeholder={copy.placeholders.category} /></label>
            <label>{copy.subtitle}<input required value={draft.subtitle} onChange={event => setDraft({ ...draft, subtitle: event.target.value })} placeholder={copy.placeholders.subtitle} /></label>
            <label className="wide-input">{copy.description}<textarea required value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder={copy.placeholders.description} /></label>
            <label>{copy.sku}<input required value={draft.sku} onChange={event => setDraft({ ...draft, sku: event.target.value })} placeholder={copy.placeholders.sku} /></label>
            <label>{copy.variantTitle}<input required value={draft.variantTitle} onChange={event => setDraft({ ...draft, variantTitle: event.target.value })} /></label>
            <label>{copy.price}<input required type="number" min="0" step="0.01" value={draft.price} onChange={event => setDraft({ ...draft, price: event.target.value })} placeholder="120" /></label>
            <label>{copy.inventory}<input required type="number" min="0" value={draft.inventory} onChange={event => setDraft({ ...draft, inventory: event.target.value })} /></label>
            <div className="form-actions"><button type="submit" className="button-primary" disabled={createProduct.isPending}>{createProduct.isPending ? copy.saving : copy.save}</button><button type="button" className="button-secondary" onClick={() => setShowCreate(false)}>{copy.cancel}</button></div>
          </form> : null}
          {formMessage ? <p className="admin-message">{formMessage}</p> : null}
          <div className="catalog-ops-list">{overview.data?.products.map(product => <article key={product.id} className="catalog-admin-row"><div className="catalog-product-title"><span className={`status-pill ${product.status.toLowerCase()}`}>{translateProductStatus(locale, product.status)}</span><div><b>{product.title}</b><small>/{product.handle} · {product.category}</small></div></div><div className="catalog-status-actions">{product.status !== "PUBLISHED" ? <button type="button" onClick={() => setStatus.mutate({ productId: product.id, status: "PUBLISHED" })}>{copy.publish}</button> : <button type="button" onClick={() => setStatus.mutate({ productId: product.id, status: "ARCHIVED" })}>{copy.archive}</button>}<Link href={`/store/products/${product.handle}`}><Eye size={14} /> {copy.view}</Link></div><div className="variant-admin-list">{product.variants.map(variant => <form key={variant.id} onSubmit={event => { event.preventDefault(); const value = new FormData(event.currentTarget).get("inventory"); setInventory.mutate({ variantId: variant.id, inventoryQty: Number(value) }); }}><span>{variant.sku} / {variant.title}</span><b>{money(variant.priceCents, locale)}</b><label>{copy.inventory}<input name="inventory" type="number" min="0" defaultValue={variant.inventoryQty} /></label><button type="submit" disabled={setInventory.isPending}>{copy.update}</button></form>)}</div></article>)}</div>
        </article>
        <article className="admin-panel"><header><div><p className="eyebrow">{copy.ordersEyebrow}</p><h2>{copy.recentOrders}</h2></div></header>{overview.data?.orders.length ? <div className="admin-table">{overview.data.orders.map(order => <div key={order.id}><span className="status-pill pending">{translateProductStatus(locale, order.status)}</span><b>{order.orderNumber}</b><small>{money(order.totalCents, locale)} · {order.email}</small></div>)}</div> : <p className="empty-copy">{copy.emptyOrders}</p>}</article>
        <article className="admin-panel"><header><div><p className="eyebrow">{copy.developerEyebrow}</p><h2>{copy.registryTitle}</h2></div><Link href="/docs">{copy.readContracts} <ChevronRight size={15} /></Link></header><div className="module-registry">{copy.registry.map(item => <span key={item}>{item}</span>)}</div></article>
      </section>
    </>}
    <AdminPrivacyReview />
  </main></DashboardLayout>;
}
