import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "ems_cart";

function getInitialCartState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(getInitialCartState);

  const sync = (next) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Cart persistence is optional; keep the in-memory cart usable.
    }
  };

  const addToCart = (eventItem, quantity = 1) => {
    if (items.find((item) => item.id === eventItem.id)) {
      return false;
    }
    sync([...items, { ...eventItem, quantity: Math.max(1, Number(quantity) || 1) }]);
    return true;
  };

  const updateQuantity = (eventId, quantity) => {
    const nextQuantity = Math.max(1, Math.min(20, Number(quantity) || 1));
    sync(items.map((item) => item.id === eventId ? { ...item, quantity: nextQuantity } : item));
  };

  const updateEventDetails = (eventItem) => {
    const current = items.find((item) => item.id === eventItem.id);
    if (!current) return;
    if (current.availableSeats === eventItem.availableSeats && current.bookedSeats === eventItem.bookedSeats && current.capacity === eventItem.capacity) return;
    sync(items.map((item) => item.id === eventItem.id ? { ...item, ...eventItem, quantity: item.quantity || 1 } : item));
  };

  const removeFromCart = (eventId) => {
    sync(items.filter((item) => item.id !== eventId));
  };

  const clearCart = () => {
    sync([]);
  };

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      addToCart,
      updateQuantity,
      updateEventDetails,
      removeFromCart,
      clearCart,
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
