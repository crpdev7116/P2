import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const OrdersPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Button>Create New Order</Button>
      </div>
      
      <Card title="Order Management" subtitle="Track and manage customer orders">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">1</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Test Customer</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2023-01-01</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">$12.50</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Cash</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">View</Button>
                  <Button size="sm" variant="outline">Print</Button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">John Doe</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2023-01-02</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">$24.75</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Credit Card</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">View</Button>
                  <Button size="sm" variant="outline">Print</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default OrdersPage;
