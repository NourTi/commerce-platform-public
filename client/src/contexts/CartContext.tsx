import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { commerceCopy } from "@/lib/commerceCopy";
import { toast } from "sonner";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartLine = {
  id: string;
  variantId: string;
  handle: string;
  title: string;
  subtitle: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  inventoryQty: number;
};

type Cart = {
  id: string;
  status: "OPEN" | "CONVERTED" | "ABANDONED";
  lines: CartLine[];
  promotion: { code: string; type: "PERCENT" | "FIXED"; value: number; minSubtotalCents: number } | null;
  totals: { subtotalCents: number; discountCents: number; shippingCents: number; totalCents: number };
};

type CartContextValue = {
  cart: Cart | null | undefined;
  isLoading: boolean;
  itemCount: number;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  applyCode: (code: string) => Promise<void>;
  activateStore: (storeId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const copy = commerceCopy[locale].notifications;
  const [cartId, setCartId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const cartQuery = trpc.commerce.getCart.useQuery({ cartId: cartId ?? "not-initialized" }, { enabled: Boolean(cartId), retry: false });
  const createCart = trpc.commerce.createCart.useMutation();
  const addCartLine = trpc.commerce.addCartLine.useMutation();
  const updateCartLine = trpc.commerce.updateCartLine.useMutation();
  const applyPromotion = trpc.commerce.applyPromotion.useMutation();

  useEffect(() => {
    const activeStoreId = window.localStorage.getItem("commerce-platform-active-store-id");
    const saved = window.localStorage.getItem(activeStoreId ? `commerce-platform-cart-id:${activeStoreId}` : "commerce-platform-cart-id");
    if (activeStoreId) setStoreId(activeStoreId);
    if (saved) setCartId(saved);
  }, []);

  async function ensureCart() {
    if (cartId) return cartId;
    const cart = await createCart.mutateAsync({ sessionKey: crypto.randomUUID(), ...(storeId ? { storeId } : {}) });
    window.localStorage.setItem(storeId ? `commerce-platform-cart-id:${storeId}` : "commerce-platform-cart-id", cart.id);
    setCartId(cart.id);
    return cart.id;
  }

  async function refresh(id: string) {
    await utils.commerce.getCart.invalidate({ cartId: id });
  }

  const value = useMemo<CartContextValue>(() => ({
    cart: cartQuery.data as Cart | null | undefined,
    isLoading: cartQuery.isLoading || createCart.isPending || addCartLine.isPending,
    itemCount: cartQuery.data?.lines.reduce((count, line) => count + line.quantity, 0) ?? 0,
    addItem: async (variantId, quantity = 1) => {
      try {
        const id = await ensureCart();
        await addCartLine.mutateAsync({ cartId: id, variantId, quantity });
        await refresh(id);
        toast.success(copy.added);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : copy.unableToAdd);
      }
    },
    updateItem: async (lineId, quantity) => {
      if (!cartId) return;
      try {
        await updateCartLine.mutateAsync({ cartId, lineId, quantity });
        await refresh(cartId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : copy.unableToUpdate);
      }
    },
    applyCode: async (code) => {
      if (!cartId) return;
      try {
        await applyPromotion.mutateAsync({ cartId, code });
        await refresh(cartId);
        toast.success(copy.promotionApplied);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : copy.promotionUnavailable);
      }
    },
    activateStore: (nextStoreId) => {
      if (nextStoreId === storeId) return;
      const saved = window.localStorage.getItem(`commerce-platform-cart-id:${nextStoreId}`);
      window.localStorage.setItem("commerce-platform-active-store-id", nextStoreId);
      setStoreId(nextStoreId);
      setCartId(saved);
    },
    clearCart: () => {
      window.localStorage.removeItem(storeId ? `commerce-platform-cart-id:${storeId}` : "commerce-platform-cart-id");
      setCartId(null);
    },
  }), [addCartLine, applyPromotion, cartId, cartQuery.data, cartQuery.isLoading, copy, createCart, storeId, updateCartLine, utils]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
