import React, { useState, useEffect } from 'react';
import Button from '../components/Button';

const StorefrontPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Simulate fetching data
  useEffect(() => {
    // In a real app, these would be API calls
    setCategories([
      { id: 1, name: 'Beverages' },
      { id: 2, name: 'Snacks' },
      { id: 3, name: 'Tobacco', is_18_plus: true },
      { id: 4, name: 'Vapes', is_18_plus: true }
    ]);
    
    setProducts([
      { 
        id: 1, 
        name: 'Coffee', 
        description: 'Fresh brewed coffee',
        price: 2.50, 
        category_id: 1,
        image: '☕'
      },
      { 
        id: 2, 
        name: 'Tea', 
        description: 'Assorted tea varieties',
        price: 2.00, 
        category_id: 1,
        image: '🍵'
      },
      { 
        id: 3, 
        name: 'Chocolate Bar', 
        description: 'Premium chocolate',
        price: 1.50, 
        category_id: 2,
        image: '🍫'
      },
      { 
        id: 4, 
        name: 'Chips', 
        description: 'Potato chips, various flavors',
        price: 1.75, 
        category_id: 2,
        image: '🥔'
      },
      { 
        id: 5, 
        name: 'Cigarettes', 
        description: 'Pack of cigarettes',
        price: 8.50, 
        category_id: 3,
        age_restriction: 18,
        image: '🚬'
      },
      { 
        id: 6, 
        name: 'Vape Pen', 
        description: 'Disposable vape pen',
        price: 15.00, 
        category_id: 4,
        age_restriction: 18,
        image: '💨'
      }
    ]);
  }, []);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity } 
        : item
    ));
  };

  const filteredProducts = selectedCategory 
    ? products.filter(product => product.category_id === selectedCategory) 
    : products;

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">Amani Kiosk</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  onClick={() => setIsCartOpen(!isCartOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                </button>
                
                {isCartOpen && cart.length > 0 && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                    <div className="p-4">
                      <h3 className="text-lg font-medium mb-2">Your Cart</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">${item.price.toFixed(2)} x {item.quantity}</div>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <Button className="w-full mt-4">Checkout</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Button>Login</Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            <Button 
              variant={selectedCategory === null ? 'primary' : 'ghost'}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            
            {categories.map(category => (
              <Button 
                key={category.id}
                variant={selectedCategory === category.id ? 'primary' : 'ghost'}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name} {category.is_18_plus && '(18+)'}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="text-4xl mb-4 flex justify-center">{product.image}</div>
                <h3 className="text-lg font-bold">{product.name}</h3>
                <p className="text-gray-500 mt-1">{product.description}</p>
                
                {product.age_restriction && (
                  <div className="mt-2 inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    18+
                  </div>
                )}
                
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                  <Button onClick={() => addToCart(product)}>Add to Cart</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Amani Kiosk</h3>
              <p className="text-gray-600">Your local convenience store with a modern twist.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Home</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Products</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Us</h3>
              <address className="text-gray-600 not-italic">
                123 Main Street<br />
                Anytown, ST 12345<br />
                <a href="mailto:info@amanikiosk.com" className="hover:text-indigo-600">info@amanikiosk.com</a><br />
                <a href="tel:+1234567890" className="hover:text-indigo-600">(123) 456-7890</a>
              </address>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Amani Kiosk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StorefrontPage;
