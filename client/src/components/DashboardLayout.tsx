import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { startLogin } from "@/const";
import { commerceCopy } from "@/lib/commerceCopy";
import { Blocks, BookOpenText, Boxes, LogOut, Package, ShoppingCart, Store } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const { direction, locale } = useLanguage();
  const copy = commerceCopy[locale].dashboard;
  const shellCopy = commerceCopy[locale].shell;
  const [location] = useLocation();
  const menuItems = [{ icon: Boxes, label: copy.overview, path: "/admin" }, { icon: Package, label: copy.catalog, path: "/admin" }, { icon: ShoppingCart, label: copy.orders, path: "/admin" }, { icon: Store, label: copy.storefront, path: "/store" }, { icon: BookOpenText, label: copy.developer, path: "/docs" }];
  if (loading) return <div className="admin-state">{copy.loading}</div>;
  if (!user) return <div className="admin-state"><Blocks /><h1>{copy.signInTitle}</h1><p>{copy.signInBody}</p><Button onClick={startLogin}>{copy.signIn}</Button></div>;
  return <div className="admin-layout" dir={direction}><aside className="admin-sidebar"><Link href="/" className="brand-lockup sidebar-brand"><Blocks size={19} /><span>{shellCopy.brandPrimary}</span><small>{shellCopy.brandSecondary}</small></Link><p className="sidebar-label">{copy.operations}</p><nav>{menuItems.map(item => <Link key={item.label} href={item.path} className={location === item.path ? "active" : ""}><item.icon size={17} />{item.label}</Link>)}</nav><div className="admin-user"><span>{user.name?.slice(0, 1).toUpperCase() ?? "M"}</span><div><b>{user.name ?? copy.merchantAccount}</b><small>{user.role}</small></div><button type="button" aria-label={copy.signOut} onClick={logout}><LogOut size={16} /></button></div></aside><div className="admin-main">{children}</div></div>;
}
