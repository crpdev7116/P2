import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const MyOrders = () => {
  const { user, openLoginModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // In a real app, this would be an API call to fetch the user's orders
        // For now, we'll use mock data
        const mockOrders = [
          {
            id: 1,
            merchant_name: 'Amani Kiosk',
            merchant_id: 'amanikiosk',
            order_date: new Date('2023-05-15').toISOString(),
            status: 'completed',
            total_amount: 25.50,
            items: [
              { name: 'Coffee', quantity: 2, price: 5.00 },
              { name: 'Chocolate Bar', quantity: 5, price: 1.50 }
            ]
          },
          {
            id: 2,
            merchant_name: 'Amani Kiosk',
            merchant_id: 'amanikiosk',
            order_date: new Date('2023-06-20').toISOString(),
            status: 'shipped',
            total_amount: 18.75,
            items: [
              { name: 'Tea', quantity: 3, price: 2.00 },
              { name: 'Chips', quantity: 4, price: 1.75 }
            ]
          }
        ];

        // Simulate API delay
        setTimeout(() => {
          setOrders(mockOrders);
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Fehler beim Laden der Bestellungen. Bitte versuche es später erneut.');
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status text and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'Ausstehend', color: 'bg-yellow-500' };
      case 'paid':
        return { text: 'Bezahlt', color: 'bg-blue-500' };
      case 'processing':
        return { text: 'In Bearbeitung', color: 'bg-indigo-500' };
      case 'shipped':
        return { text: 'Versendet', color: 'bg-purple-500' };
      case 'ready_for_pickup':
        return { text: 'Abholbereit', color: 'bg-green-500' };
      case 'completed':
        return { text: 'Abgeschlossen', color: 'bg-green-700' };
      case 'cancelled':
        return { text: 'Storniert', color: 'bg-red-500' };
      default:
        return { text: status, color: 'bg-gray-500' };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meine Bestellungen</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meine Bestellungen</h1>
        <div className="bg-red-900/30 border border-red-800 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meine Bestellungen</h1>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg text-center">
          <p className="mb-4">Du musst angemeldet sein, um deine Bestellungen zu sehen.</p>
          <Button onClick={openLoginModal}>Anmelden</Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meine Bestellungen</h1>
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg text-center">
          <p className="text-xl mb-6">Du hast noch nichts gekauft. Erkunde unseren Marktplatz!</p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white border border-zinc-800 rounded-lg hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200"
          >
            Zum Marktplatz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Meine Bestellungen</h1>
      
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            {/* Order header */}
            <div className="p-4 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-sm text-zinc-400">Bestellung #{order.id}</p>
                <p className="font-medium">{formatDate(order.order_date)}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Link 
                  to={`/${order.merchant_id}`} 
                  className="text-white hover:text-indigo-400 transition-colors"
                >
                  {order.merchant_name}
                </Link>
                
                <span className={`${getStatusInfo(order.status).color} px-3 py-1 rounded-lg text-sm font-medium`}>
                  {getStatusInfo(order.status).text}
                </span>
              </div>
            </div>
            
            {/* Order items */}
            <div className="p-4">
              <h3 className="font-medium mb-2">Artikel</h3>
              <ul className="space-y-2">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{(item.price * item.quantity).toFixed(2)} €</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between font-bold">
                <span>Gesamtbetrag</span>
                <span>{order.total_amount.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
