import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const ProductsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button>Add New Product</Button>
      </div>
      
      <Card title="Product Management" subtitle="Manage your product catalog">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">1</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Coffee</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">$2.50</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">100</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Beverages</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">Edit</Button>
                  <Button size="sm" variant="danger">Delete</Button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Tea</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">$2.00</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">100</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Beverages</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">Edit</Button>
                  <Button size="sm" variant="danger">Delete</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ProductsPage;
