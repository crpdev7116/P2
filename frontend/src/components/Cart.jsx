import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Button from './Button';

const Cart = () => {
  const { 
    cartItems, 
    isCartOpen, 
    closeCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice,
    getTotalItems
  } = useCart();

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
              <ul className="space-y-4">
                {cartItems.map(item => (
                  <li key={item.id} className="border border-zinc-800 rounded-lg p-3 bg-zinc-900">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 text-2xl mr-3">
                        {item.image || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">{item.name}</h3>
                        <p className="text-zinc-400 text-xs">{item.price.toFixed(2)} € pro Stück</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="bg-zinc-800 text-white w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="bg-zinc-800 text-white w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium">
                        {(item.price * item.quantity).toFixed(2)} €
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 text-xs hover:text-red-400"
                      >
                        Entfernen
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 text-right">
                <button 
                  onClick={clearCart}
                  className="text-zinc-400 text-sm hover:text-white"
                >
                  Warenkorb leeren
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Footer with total and checkout button */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-zinc-800">
            <div className="flex justify-between mb-2">
              <span className="text-zinc-400">Anzahl:</span>
              <span>{getTotalItems()} Artikel</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-zinc-400">Gesamtpreis:</span>
              <span className="text-xl font-bold">{getTotalPrice().toFixed(2)} €</span>
            </div>
            
            <Button 
              variant="default"
              fullWidth
              onClick={() => alert('Checkout-Funktion noch nicht implementiert')}
            >
              Zur Kasse
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
