import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Star rating component
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center">
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      
      <span className="ml-1 text-xs text-zinc-400">({rating.toFixed(1)})</span>
    </div>
  );
};

const MarketplaceHome = () => {
  const { openLoginModal } = useAuth();
  
  // Dummy merchants data with ratings and recommendation flags
  const merchants = [
    {
      id: 'amanikiosk',
      name: 'Amani Kiosk',
      description: 'Getränke, Snacks und mehr für den täglichen Bedarf',
      image: '🏪',
      profileImage: 'https://placehold.co/500x500/111/fff?text=AK',
      productCount: 6,
      rating: 4.7,
      reviewCount: 128,
      is_recommended: true
    },
    {
      id: 'testshop',
      name: 'Test Shop',
      description: 'Ein Testshop mit verschiedenen Produkten',
      image: '🛒',
      profileImage: 'https://placehold.co/500x500/111/fff?text=TS',
      productCount: 12,
      rating: 3.5,
      reviewCount: 42,
      is_recommended: false
    },
    {
      id: 'techstore',
      name: 'Tech Store',
      description: 'Elektronik und Zubehör',
      image: '💻',
      profileImage: 'https://placehold.co/500x500/111/fff?text=TS',
      productCount: 87,
      rating: 4.2,
      reviewCount: 215,
      is_recommended: true
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Entdecke lokale Händler</h1>
          <p className="text-zinc-400 mt-1">Finde die besten Shops in deiner Nähe</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Verfügbare Händler</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchants.map(merchant => (
            <Link 
              key={merchant.id} 
              to={`/${merchant.id}`}
              className="block bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:shadow-[0_0_15px_rgba(255,255,255,0.7)] active:scale-95 transition-all duration-200"
            >
              <div className="aspect-video bg-zinc-800 flex items-center justify-center text-6xl relative">
                {merchant.image}
                
                {/* Recommendation banner */}
                {merchant.is_recommended && (
                  <div className="absolute top-0 right-0 bg-green-900 text-white text-xs px-2 py-1">
                    Von uns empfohlen
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex items-center mb-3">
                  {/* Profile image */}
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-zinc-800">
                    <img 
                      src={merchant.profileImage} 
                      alt={merchant.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/500x500/111/fff?text=${merchant.name.charAt(0)}`;
                      }}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">{merchant.name}</h3>
                    <StarRating rating={merchant.rating} />
                  </div>
                </div>
                
                <p className="mt-2 text-zinc-400 text-sm">{merchant.description}</p>
                
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <span className="text-zinc-400 text-sm">{merchant.productCount} Produkte</span>
                    <span className="text-zinc-400 text-sm ml-2">•</span>
                    <span className="text-zinc-400 text-sm ml-2">{merchant.reviewCount} Bewertungen</span>
                  </div>
                  
                  <span className="inline-flex items-center text-white bg-black px-3 py-1 rounded-lg border border-zinc-800">
                    Besuchen
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      
      <footer className="border-t border-zinc-800 bg-zinc-900 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-zinc-400 text-sm">
          &copy; {new Date().getFullYear()} B2B2C Marketplace. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
};

export default MarketplaceHome;
