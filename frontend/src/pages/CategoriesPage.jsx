import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const CategoriesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button>Add New Category</Button>
      </div>
      
      <Card title="Category Management" subtitle="Organize your products with categories">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Restriction</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">1</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Beverages</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Drinks and refreshments</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    None
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">Edit</Button>
                  <Button size="sm" variant="danger">Delete</Button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Snacks</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Quick bites and snacks</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    None
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">Edit</Button>
                  <Button size="sm" variant="danger">Delete</Button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">3</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Tobacco</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Tobacco products</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    18+
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">1</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">Edit</Button>
                  <Button size="sm" variant="danger">Delete</Button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">4</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Vapes</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Vaping products</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    18+
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">1</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  <Button size="sm" variant="secondary">Edit</Button>
                  <Button size="sm" variant="danger">Delete</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      
      <Card title="Age Restrictions" subtitle="Categories with age restrictions automatically apply to all contained products">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Age Inheritance</h3>
          <p className="text-gray-600 mb-4">
            When a category has an age restriction (e.g., is_18_plus = true), all products within that category 
            automatically inherit the age restriction. This ensures compliance with age verification requirements.
          </p>
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-600">
              Products can also have individual age restrictions independent of their categories.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CategoriesPage;
