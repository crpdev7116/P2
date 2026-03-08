import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import StarRating from './StarRating';

const ItemModal = ({ item, onClose, onAddToCart }) => {
  const { 
    name, 
    description, 
    image, 
    age_restriction, 
    price_standard, 
    price_preorder, 
    price_subscription,
    stock_quantity
  } = item;
  
  const { user } = useAuth();
  const [selectedPrice, setSelectedPrice] = useState('standard');
  const [quantity, setQuantity] = useState(1);
  
  // Check if user is a merchant
  const isMerchant = user?.role === 'merchant';

  // Get current price based on selection
  const getCurrentPrice = () => {
    switch (selectedPrice) {
      case 'preorder':
        return price_preorder || price_standard;
      case 'subscription':
        return price_subscription || price_standard;
      default:
        return price_standard;
    }
  };

  // Format price
  const formatPrice = (price) => {
    return price.toFixed(2).replace('.', ',') + ' €';
  };

  // Handle add to cart
  const handleAddToCart = () => {
    onAddToCart({
      ...item,
      price: getCurrentPrice(),
      price_type: selectedPrice,
      quantity
    });
    onClose();
  };

  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={handleModalClick}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{name}</h2>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Age restriction */}
          {age_restriction && (
            <div className="inline-block bg-red-900 text-white text-xs px-2 py-1 rounded mb-4">
              {age_restriction}+
            </div>
          )}
          
          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="bg-zinc-800 rounded aspect-square flex items-center justify-center text-8xl">
              {image}
            </div>
            
            {/* Details */}
            <div>
              {/* Rating */}
              <div className="mb-4">
                <StarRating rating={4.5} />
                <span className="text-sm text-zinc-400 ml-2">(12 Bewertungen)</span>
              </div>
              
              {/* Description */}
              <p className="text-zinc-300 mb-6">{description}</p>
              
              {/* Price options */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Preisoptionen:</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price-option"
                      checked={selectedPrice === 'standard'}
                      onChange={() => setSelectedPrice('standard')}
                      className="mr-2"
                    />
                    <span>Standard: {formatPrice(price_standard)}</span>
                  </label>
                  
                  {price_preorder && (
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="price-option"
                        checked={selectedPrice === 'preorder'}
                        onChange={() => setSelectedPrice('preorder')}
                        className="mr-2"
                      />
                      <span>Vorbestellung: {formatPrice(price_preorder)}</span>
                    </label>
                  )}
                  
                  {price_subscription && (
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="price-option"
                        checked={selectedPrice === 'subscription'}
                        onChange={() => setSelectedPrice('subscription')}
                        className="mr-2"
                      />
                      <span>Abo: {formatPrice(price_subscription)}</span>
                    </label>
                  )}
                </div>
              </div>
              
              {/* Quantity */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Menge:</h3>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-black text-white border border-zinc-800 px-3 py-1 hover:shadow-neon active:bg-white active:text-black transition-all duration-200"
                  >
                    -
                  </button>
                  <span className="mx-4">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(stock_quantity || 99, quantity + 1))}
                    className="bg-black text-white border border-zinc-800 px-3 py-1 hover:shadow-neon active:bg-white active:text-black transition-all duration-200"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Total */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400">Gesamtpreis:</h3>
                <p className="text-2xl font-bold">{formatPrice(getCurrentPrice() * quantity)}</p>
              </div>
              
              {/* Add to cart button */}
              {isMerchant ? (
                <div className="text-red-400 mb-4">
                  Händler können nicht einkaufen
                </div>
              ) : (
                <Button 
                  onClick={handleAddToCart}
                  className="w-full"
                >
                  In den Warenkorb
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ItemModal.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    price_standard: PropTypes.number.isRequired,
    price_preorder: PropTypes.number,
    price_subscription: PropTypes.number,
    image: PropTypes.string,
    age_restriction: PropTypes.number,
    stock_quantity: PropTypes.number
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired
};

export default ItemModal;
