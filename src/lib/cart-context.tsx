"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  slug: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isHydrated: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR" }
  | { type: "TOGGLE_DRAWER" }
  | { type: "OPEN_DRAWER" }
  | { type: "CLOSE_DRAWER" }
  | { type: "HYDRATE"; payload: CartItem[] }
  | { type: "SET_HYDRATED" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_HYDRATED":
      return { ...state, isHydrated: true };
    case "HYDRATE":
      return { ...state, items: action.payload, isHydrated: true };
    case "ADD_ITEM": {
      // Deduplicate by `id` (= `${productId}-${variantId}`) so different products never merge
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          isOpen: true,
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return {
        ...state,
        isOpen: true,
        items: [...state.items, action.payload],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
      };
    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    case "CLEAR":
      return { ...state, items: [] };
    case "TOGGLE_DRAWER":
      return { ...state, isOpen: !state.isOpen };
    case "OPEN_DRAWER":
      return { ...state, isOpen: true };
    case "CLOSE_DRAWER":
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  total: number;
  itemCount: number;
  isHydrated: boolean;
} | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(cartReducer, { items: [], isOpen: false, isHydrated: false });

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        rawDispatch({ type: "HYDRATE", payload: JSON.parse(stored) });
        return;
      } catch {}
    }
    rawDispatch({ type: "SET_HYDRATED" });
  }, []);

  useEffect(() => {
    // Guard: don't overwrite localStorage before hydration restores items
    if (!state.isHydrated) return;
    localStorage.setItem("cart", JSON.stringify(state.items));
  }, [state.items, state.isHydrated]);

  const dispatch = (action: CartAction) => {
    rawDispatch(action);
  };

  const total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ state, dispatch, total, itemCount, isHydrated: state.isHydrated }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
