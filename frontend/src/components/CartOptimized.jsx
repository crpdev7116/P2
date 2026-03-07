import React, { useState, useEffect, memo, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import Button from './Button';

// CartItem component to optimize rendering
const CartItem = memo(({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  isSelected, 
  onToggleSelect 
}) => {
  return (
    <li className="border border-zinc-800 rounded p-3 bg-zinc-900">
      <div className="flex items-center">
        <div className="mr-3">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="w-4 h-4 border-zinc-600 focus:ring-white"
          />
        </div>
        <div className="flex-shrink-0 text-2xl mr-3">
          {item.image || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{item.name}</h3>
          <p className="text-zinc-400 text-xs">{item.price.toFixed(2).replace('.', ',')} € pro Stück</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="bg-black text-white w-6 h-6 flex items-center justify-center border border-zinc-800 hover:shadow-neon active:bg-white active:text-black transition-all duration-200"
          >
            -
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button 
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="bg-black text-white w-6 h-6 flex items-center justify-center border border-zinc-800 hover:shadow-neon active:bg-white active:text-black transition-all duration-200"
          >
            +
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm font-medium">
          {(item.price * item.quantity).toFixed(2).replace('.', ',')} €
        </span>
        <button 
          onClick={() => onRemove(item.id)}
          className="text-red-500 text-xs hover:text-red-400"
        >
          Entfernen
        </button>
      </div>
    </li>
  );
});

CartItem.displayName = 'CartItem';

// Merchant group component
const MerchantGroup = memo(({ 
  shopName, 
  items, 
  onUpdateQuantity, 
  onRemove, 
  selectedItems,
  onToggleSelect
}) => {
  return (
    <div className="mb-6">
      <div className="bg-black text-white border border-white p-2 mb-3 rounded">
        <h3 className="font-medium">Händler: {shopName}</h3>
      </div>
      <ul className="space-y-3">
        {items.map(item => (
          <CartItem 
            key={item.id} 
            item={item} 
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            isSelected={selectedItems.includes(item.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </ul>
    </div>
  );
});

MerchantGroup.displayName = 'MerchantGroup';

const CartOptimized = () => {
  const { 
    cartItems, 
    isCartOpen, 
    closeCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalItems
  } = useCart();

  // State for selected items
  const [selectedItems, setSelectedItems] = useState([]);

  // Initialize selected items when cart opens or items change
  useEffect(() => {
    if (isCartOpen && cartItems.length > 0) {
      // By default, select all items
      setSelectedItems(cartItems.map(item => item.id));
    }
  }, [isCartOpen, cartItems.length]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleRemoveItem = useCallback((id) => {
    removeFromCart(id);
    // Also remove from selected items if present
    setSelectedItems(prev => prev.filter(itemId => itemId !== id));
  }, [removeFromCart]);

  const handleUpdateQuantity = useCallback((id, quantity) => {
    updateQuantity(id, quantity);
  }, [updateQuantity]);

  // Toggle item selection
  const handleToggleSelect = useCallback((id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Select all items
  const handleSelectAll = useCallback(() => {
    setSelectedItems(cartItems.map(item => item.id));
  }, [cartItems]);

  // Deselect all items
  const handleDeselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Calculate total price of selected items
  const getSelectedTotalPrice = useCallback(() => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems, selectedItems]);

  // Get count of selected items
  const getSelectedItemsCount = useCallback(() => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + item.quantity, 0);
  }, [cartItems, selectedItems]);

  // Group items by merchant
  const groupedItems = cartItems.reduce((groups, item) => {
    // Ensure every item has shopId and shopName
    const shopId = item.shopId || 'unknown';
    const shopName = item.shopName || 'Unbekannter Händler';
    
    // Add shopId and shopName to item if missing
    const itemWithShop = {
      ...item,
      shopId: shopId,
      shopName: shopName
    };
    
    if (!groups[shopId]) {
      groups[shopId] = {
        shopName,
        items: []
      };
    }
    
    groups[shopId].items.push(itemWithShop);
    return groups;
  }, {});

  // Close cart when pressing Escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    
    // Prevent scrolling when cart is open
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={closeCart}
      />
      
      {/* Cart drawer */}
      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-lg flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Warenkorb</h2>
          <button 
            onClick={closeCart}
            className="text-zinc-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Cart content */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🛒</div>
              <p className="text-zinc-400">Dein Warenkorb ist leer</p>
              <Button 
                onClick={closeCart}
                className="mt-4"
              >
                Weiter einkaufen
              </Button>
            </div>
          ) : (
            <>
              {/* Selection controls */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={handleSelectAll}
                    className="text-sm text-zinc-300 hover:text-white"
                  >
                    Alle auswählen
                  </button>
                  <button 
                    onClick={handleDeselectAll}
                    className="text-sm text-zinc-300 hover:text-white"
                  >
                    Alle abwählen
                  </button>
                </div>
                <button 
                  onClick={clearCart}
                  className="text-sm text-zinc-300 hover:text-white"
                >
                  Warenkorb leeren
                </button>
              </div>
              
              {/* Merchant groups */}
              {Object.values(groupedItems).map((group, index) => (
                <MerchantGroup 
                  key={index}
                  shopName={group.shopName}
                  items={group.items}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  selectedItems={selectedItems}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </>
          )}
        </div>
        
        {/* Footer with total and checkout button */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-zinc-800">
            <div className="flex justify-between mb-2">
              <span className="text-zinc-400">Ausgewählte Artikel:</span>
              <span>{getSelectedItemsCount()} von {getTotalItems()}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-zinc-400">Gesamtpreis (ausgewählt):</span>
              <span className="text-xl font-bold">{getSelectedTotalPrice().toFixed(2).replace('.', ',')} €</span>
            </div>
            
            <Button 
              onClick={() => {
                if (selectedItems.length === 0) {
                  alert('Bitte wähle mindestens einen Artikel aus');
                } else {
                  alert('Checkout-Funktion noch nicht implementiert');
                }
              }}
              className="w-full"
              disabled={selectedItems.length === 0}
            >
              {selectedItems.length === 0 ? 'Bitte Artikel auswählen' : 'Zur Kasse'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CartOptimized);
