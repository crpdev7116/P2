import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import ItemModal from './ItemModal';

const ItemCard = ({ item, onAddToCart }) => {
  const { name, description, image, age_restriction } = item;
  const price_standard = item.price_standard || item.price;
  const price_preorder = item.price_preorder;
  const price_subscription = item.price_subscription;
  
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  
  // Check if user is a merchant
  const isMerchant = user?.role === 'merchant';

  // Calculate price range
  const minPrice = Math.min(
    price_standard || Infinity,
    price_preorder || Infinity,
    price_subscription || Infinity
  );
  
  const maxPrice = Math.max(
    price_standard || 0,
    price_preorder || 0,
    price_subscription || 0
  );
  
  const hasPriceRange = minPrice !== maxPrice && minPrice !== Infinity;

  // Format price display
  const formatPrice = (price) => {
    return price.toFixed(2).replace('.', ',') + ' €';
  };

  const getPriceDisplay = () => {
    if (hasPriceRange) {
      return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    }
    return formatPrice(price_standard);
  };

  // Open modal when clicking on the card
  const handleCardClick = () => {
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden hover-card cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="p-4">
          <div className="text-center mb-3">
            <span className="text-4xl">{image}</span>
          </div>
          
          <h3 className="text-lg font-semibold mb-1">{name}</h3>
          
          {age_restriction && (
            <div className="inline-block bg-red-900 text-white text-xs px-2 py-1 rounded mb-2">
              {age_restriction}+
            </div>
          )}
          
          <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{description}</p>
          
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">{getPriceDisplay()}</span>
            
            {isMerchant && (
              <div className="text-xs text-red-400">
                Händler können nicht einkaufen
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Modal */}
      {showModal && (
        <ItemModal 
          item={{
            ...item,
            price_standard,
            price_preorder,
            price_subscription
          }} 
          onClose={handleCloseModal} 
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
};

ItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.number,
    price_standard: PropTypes.number,
    price_preorder: PropTypes.number,
    price_subscription: PropTypes.number,
    image: PropTypes.string,
    age_restriction: PropTypes.number
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired
};

export default ItemCard;
