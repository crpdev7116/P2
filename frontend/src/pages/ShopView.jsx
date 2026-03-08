import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import StarRating from '../components/StarRating';

const ShopView = () => {
  const { shopId } = useParams();
  const { addToCart } = useCart();
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);

  // Check if user is a merchant
  const isMerchant = user?.role === 'merchant';

  // Simulate fetching shop data based on shopId
  useEffect(() => {
    // In a real app, this would be an API call
    const shopData = {
      amanikiosk: {
        id: 'amanikiosk',
        name: 'Amani Kiosk',
        description: 'Getränke, Snacks und mehr für den täglichen Bedarf',
        image: '🏪',
        profileImage: 'https://placehold.co/500x500/111/fff?text=AK',
        rating: 4.7,
        reviewCount: 128,
        is_recommended: true
      },
      testshop: {
        id: 'testshop',
        name: 'Test Shop',
        description: 'Ein Testshop mit verschiedenen Produkten',
        image: '🛒',
        profileImage: 'https://placehold.co/500x500/111/fff?text=TS',
        rating: 3.5,
        reviewCount: 42,
        is_recommended: false
      },
      techstore: {
        id: 'techstore',
        name: 'Tech Store',
        description: 'Elektronik und Zubehör',
        image: '💻',
        profileImage: 'https://placehold.co/500x500/111/fff?text=TS',
        rating: 4.2,
        reviewCount: 215,
        is_recommended: true
      }
    }[shopId];

    if (shopData) {
      setShop(shopData);
      
      // Simulate fetching products for this shop
      const shopProducts = {
        amanikiosk: [
          { 
            id: 1, 
            name: 'Kaffee', 
            description: 'Frisch gebrühter Kaffee',
            price_standard: 2.50,
            price_preorder: 2.25,
            price_subscription: 2.00,
            image: '☕',
            shopId: 'amanikiosk',
            shopName: 'Amani Kiosk'
          },
          { 
            id: 2, 
            name: 'Tee', 
            description: 'Verschiedene Teesorten',
            price_standard: 2.00,
            price_preorder: 1.80,
            price_subscription: 1.60,
            image: '🍵',
            shopId: 'amanikiosk',
            shopName: 'Amani Kiosk'
          },
          { 
            id: 3, 
            name: 'Schokolade', 
            description: 'Premium Schokolade',
            price_standard: 1.50,
            price_preorder: 1.35,
            price_subscription: 1.20,
            image: '🍫',
            shopId: 'amanikiosk',
            shopName: 'Amani Kiosk'
          },
          { 
            id: 4, 
            name: 'Chips', 
            description: 'Kartoffelchips in verschiedenen Geschmacksrichtungen',
            price_standard: 1.75,
            price_preorder: 1.60,
            price_subscription: 1.40,
            image: '🥔',
            shopId: 'amanikiosk',
            shopName: 'Amani Kiosk'
          },
          { 
            id: 5, 
            name: 'Zigaretten', 
            description: 'Packung Zigaretten',
            price_standard: 8.50,
            price_preorder: 8.50,
            price_subscription: 8.00,
            image: '🚬',
            age_restriction: 18,
            shopId: 'amanikiosk',
            shopName: 'Amani Kiosk'
          },
          { 
            id: 6, 
            name: 'Vape Pen', 
            description: 'Einweg-Vape-Pen',
            price_standard: 15.00,
            price_preorder: 14.50,
            price_subscription: 13.50,
            image: '💨',
            age_restriction: 18,
            shopId: 'amanikiosk',
            shopName: 'Amani Kiosk'
          }
        ],
        testshop: [
          { 
            id: 1, 
            name: 'T-Shirt', 
            description: 'Baumwoll-T-Shirt in verschiedenen Größen',
            price_standard: 19.99,
            price_preorder: 17.99,
            price_subscription: 15.99,
            image: '👕',
            shopId: 'testshop',
            shopName: 'Test Shop'
          },
          { 
            id: 2, 
            name: 'Jeans', 
            description: 'Klassische Jeans',
            price_standard: 39.99,
            price_preorder: 35.99,
            price_subscription: 32.99,
            image: '👖',
            shopId: 'testshop',
            shopName: 'Test Shop'
          },
          { 
            id: 3, 
            name: 'Sneakers', 
            description: 'Sportliche Sneakers',
            price_standard: 59.99,
            price_preorder: 54.99,
            price_subscription: 49.99,
            image: '👟',
            shopId: 'testshop',
            shopName: 'Test Shop'
          }
        ],
        techstore: [
          { 
            id: 1, 
            name: 'Smartphone', 
            description: 'Neuestes Modell mit Top-Kamera',
            price_standard: 699.99,
            price_preorder: 649.99,
            price_subscription: 599.99,
            image: '📱',
            shopId: 'techstore',
            shopName: 'Tech Store'
          },
          { 
            id: 2, 
            name: 'Laptop', 
            description: 'Leistungsstarker Laptop für Arbeit und Gaming',
            price_standard: 1299.99,
            price_preorder: 1199.99,
            price_subscription: 1099.99,
            image: '💻',
            shopId: 'techstore',
            shopName: 'Tech Store'
          },
          { 
            id: 3, 
            name: 'Kopfhörer', 
            description: 'Kabellose Kopfhörer mit Noise-Cancelling',
            price_standard: 199.99,
            price_preorder: 179.99,
            price_subscription: 159.99,
            image: '🎧',
            shopId: 'techstore',
            shopName: 'Tech Store'
          }
        ]
      }[shopId] || [];
      
      setProducts(shopProducts);
    }
  }, [shopId]);

  const handleAddToCart = (item) => {
    if (isMerchant) {
      // Show message for merchants
      alert('Händler können nicht einkaufen, bitte Privatkonto nutzen.');
      return;
    }
    
    if (!isAuthenticated()) {
      // Prompt login for unauthenticated users
      if (confirm('Bitte melde dich an, um Artikel in den Warenkorb zu legen.')) {
        openLoginModal();
      }
      return;
    }
    
    // Add to cart (no longer opening cart drawer here)
    addToCart(item);
  };

  if (!shop) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Shop nicht gefunden</h2>
          <Link 
            to="/"
            className="inline-block bg-black text-white border border-zinc-800 px-4 py-2 rounded hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
                ← Zurück
              </Link>
              <div className="flex items-center mt-2">
                {/* Shop profile image */}
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-zinc-800">
                  <img 
                    src={shop.profileImage} 
                    alt={shop.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/500x500/111/fff?text=${shop.name.charAt(0)}`;
                    }}
                  />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold">{shop.name}</h1>
                  <div className="flex items-center">
                    <StarRating rating={shop.rating} />
                    <span className="text-zinc-400 text-xs ml-2">{shop.reviewCount} Bewertungen</span>
                  </div>
                </div>
                
                {/* Recommendation badge */}
                {shop.is_recommended && (
                  <div className="ml-4 bg-green-900 text-white text-xs px-2 py-1 rounded">
                    Von uns empfohlen
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              {!isAuthenticated() ? (
                <button 
                  onClick={openLoginModal}
                  className="bg-black text-white border border-zinc-800 px-4 py-2 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
                >
                  Anmelden
                </button>
              ) : (
                <div className="text-sm text-zinc-400">
                  Angemeldet als: <span className="text-white">{user.username}</span>
                  {isMerchant && <span className="ml-2 text-yellow-500">(Händler)</span>}
                </div>
              )}
              
              {/* Cart button removed - using only the global one in Navbar */}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-zinc-300">{shop.description}</p>
          
          {isMerchant && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 text-red-400">
              <strong>Hinweis:</strong> Händler können nicht einkaufen. Bitte verwende ein Privatkonto für Einkäufe.
            </div>
          )}
        </div>
        
        <h2 className="text-xl font-semibold mb-6">Produkte</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ItemCard 
              key={product.id} 
              item={product} 
              onAddToCart={handleAddToCart} 
            />
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            Keine Produkte gefunden.
          </div>
        )}
      </main>
      
      <footer className="border-t border-zinc-800 bg-zinc-900 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-zinc-400 text-sm">
          &copy; {new Date().getFullYear()} {shop.name}. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
};

export default ShopView;
