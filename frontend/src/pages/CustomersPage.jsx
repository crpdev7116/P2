import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const CustomersPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Button>Add New Customer</Button>
      </div>
      
      <Card title="Customer Management" subtitle="Manage your customer database">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trusted</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loyalty Points</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">1</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Test Customer</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">test@example.com</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Yes
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">$100.00</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">50</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">Edit</Button>
                  <Button size="sm" variant="outline">Adjust Credit</Button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Jane Smith</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">jane@example.com</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    No
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">$0.00</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">10</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">Edit</Button>
                  <Button size="sm" variant="outline">Adjust Credit</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      
      <Card title="Loyalty Program" subtitle="Manage customer loyalty points and rewards">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Points System</h3>
            <p className="text-gray-500 mb-3">1 point = 1 cent in value</p>
            <Button size="sm" variant="outline">Configure Points</Button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Stamp Cards</h3>
            <p className="text-gray-500 mb-3">Configure product-specific loyalty programs</p>
            <Button size="sm" variant="outline">Manage Stamp Cards</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CustomersPage;
