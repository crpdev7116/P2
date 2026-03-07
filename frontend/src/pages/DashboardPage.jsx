 import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const DashboardPage = () => {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Simulate fetching data
  useEffect(() => {
    // In a real app, these would be API calls
    setItems([
      { id: 1, name: 'Coffee', price_standard: 2.50, stock_quantity: 100 },
      { id: 2, name: 'Tea', price_standard: 2.00, stock_quantity: 100 },
      { id: 3, name: 'Chocolate Bar', price_standard: 1.50, stock_quantity: 50 },
      { id: 4, name: 'Chips', price_standard: 1.75, stock_quantity: 75 },
      { id: 5, name: 'Cigarettes', price_standard: 8.50, stock_quantity: 30, age_restriction: 18 },
      { id: 6, name: 'Vape Pen', price_standard: 15.00, stock_quantity: 20, age_restriction: 18 }
    ]);
    
    setOrders([
      { 
        id: 1, 
        customer_name: 'Test Customer', 
        total_amount: 12.50, 
        status: 'completed',
        payment_method: 'cash',
        created_at: '2023-01-01T12:00:00Z'
      }
    ]);
    
    setCustomers([
      { 
        id: 1, 
        name: 'Test Customer', 
        email: 'test@example.com', 
        is_trusted: true,
        credit_limit_euro: 100.00,
        loyalty_points: 50
      }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Products" subtitle={`${items.length} total products`}>
          <div className="text-3xl font-bold text-gray-900">{items.length}</div>
          <div className="mt-2">
            <Button size="sm" variant="outline">View All</Button>
          </div>
        </Card>
        
        <Card title="Orders" subtitle="Recent orders">
          <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
          <div className="mt-2">
            <Button size="sm" variant="outline">View All</Button>
          </div>
        </Card>
        
        <Card title="Customers" subtitle="Customer management">
          <div className="text-3xl font-bold text-gray-900">{customers.length}</div>
          <div className="mt-2">
            <Button size="sm" variant="outline">View All</Button>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Orders" subtitle="Latest transactions">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(order => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">#{order.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{order.customer_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${order.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        <Card title="Popular Products" subtitle="Best selling items">
          <div className="space-y-4">
            {items.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    {item.id}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      Stock: {item.stock_quantity} {item.age_restriction ? `• ${item.age_restriction}+` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">${item.price_standard.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
