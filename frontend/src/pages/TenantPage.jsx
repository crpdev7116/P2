import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const TenantPage = () => {
  const [tenantInfo, setTenantInfo] = useState({
    package: 'tier_1k',
    domainType: 'subdomain',
    subdomain: 'amani-kiosk',
    customDomain: '',
    itemCount: 6,
    itemLimit: 1000
  });
  
  const packages = [
    { id: 'tier_250', name: 'Basic', itemLimit: 250, price: '€29.99/month' },
    { id: 'tier_500', name: 'Starter', itemLimit: 500, price: '€49.99/month' },
    { id: 'tier_1k', name: 'Growth', itemLimit: 1000, price: '€79.99/month' },
    { id: 'tier_2_5k', name: 'Business', itemLimit: 2500, price: '€129.99/month' },
    { id: 'tier_5k', name: 'Professional', itemLimit: 5000, price: '€199.99/month' },
    { id: 'tier_7_5k', name: 'Enterprise S', itemLimit: 7500, price: '€299.99/month' },
    { id: 'tier_10k', name: 'Enterprise M', itemLimit: 10000, price: '€399.99/month' },
    { id: 'tier_25k', name: 'Enterprise L', itemLimit: 25000, price: '€799.99/month' },
    { id: 'tier_50k', name: 'Enterprise XL', itemLimit: 50000, price: '€1499.99/month' }
  ];
  
  const handlePackageChange = (packageId) => {
    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    setTenantInfo({
      ...tenantInfo,
      package: packageId,
      itemLimit: selectedPackage.itemLimit
    });
  };
  
  const handleDomainTypeChange = (type) => {
    setTenantInfo({
      ...tenantInfo,
      domainType: type
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTenantInfo({
      ...tenantInfo,
      [name]: value
    });
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tenant Settings</h1>
      
      <Card title="Current Package" subtitle="Your subscription and usage">
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 mb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {packages.find(pkg => pkg.id === tenantInfo.package)?.name} Package
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {packages.find(pkg => pkg.id === tenantInfo.package)?.price}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-sm text-gray-600">
                Item Usage: <span className="font-medium">{tenantInfo.itemCount} / {tenantInfo.itemLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${(tenantInfo.itemCount / tenantInfo.itemLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upgrade Package</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <div 
              key={pkg.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                tenantInfo.package === pkg.id 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
              onClick={() => handlePackageChange(pkg.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">Up to {pkg.itemLimit.toLocaleString()} items</p>
                </div>
                {tenantInfo.package === pkg.id && (
                  <div className="bg-indigo-500 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-2 text-lg font-bold text-gray-900">{pkg.price}</div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end mt-6">
          <Button>Update Package</Button>
        </div>
      </Card>
      
      <Card title="Domain Settings" subtitle="Configure your store domain">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Domain Type</h3>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div 
                className={`border rounded-lg p-4 flex-1 cursor-pointer transition-all ${
                  tenantInfo.domainType === 'subdomain' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
                onClick={() => handleDomainTypeChange('subdomain')}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">Basic (Subdomain)</h4>
                    <p className="text-sm text-gray-600 mt-1">Use a subdomain of our platform</p>
                  </div>
                  {tenantInfo.domainType === 'subdomain' && (
                    <div className="bg-indigo-500 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">Example: your-store.marketplace.com</div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 flex-1 cursor-pointer transition-all ${
                  tenantInfo.domainType === 'custom_domain' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
                onClick={() => handleDomainTypeChange('custom_domain')}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">Premium (Custom Domain)</h4>
                    <p className="text-sm text-gray-600 mt-1">Use your own domain name</p>
                  </div>
                  {tenantInfo.domainType === 'custom_domain' && (
                    <div className="bg-indigo-500 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">Example: www.your-store.com</div>
              </div>
            </div>
          </div>
          
          {tenantInfo.domainType === 'subdomain' ? (
            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  value={tenantInfo.subdomain}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="your-store"
                />
                <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                  .marketplace.com
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="customDomain" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Domain
              </label>
              <input
                type="text"
                id="customDomain"
                name="customDomain"
                value={tenantInfo.customDomain}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="www.your-store.com"
              />
              <p className="mt-2 text-sm text-gray-500">
                You'll need to configure DNS settings with your domain provider.
              </p>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button>Save Domain Settings</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TenantPage;
