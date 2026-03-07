import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const SettingsPage = () => {
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Amani Kiosk',
    storeEmail: 'info@amanikiosk.com',
    storePhone: '(123) 456-7890',
    currency: 'EUR',
    language: 'en',
    timezone: 'Europe/Berlin'
  });
  
  const [paymentSettings, setPaymentSettings] = useState({
    enableCash: true,
    enableCreditCard: true,
    enableInvoice: true,
    enableBankTransfer: false,
    stripeEnabled: true,
    stripePublicKey: 'pk_test_...',
    stripeSecretKey: '••••••••••••••••••••••••••',
    cashCommissionFree: true
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderConfirmations: true,
    lowStockAlerts: true,
    newCustomerAlerts: false
  });
  
  const handleGeneralSettingsChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: value
    });
  };
  
  const handlePaymentSettingsChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPaymentSettings({
      ...paymentSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleNotificationSettingsChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      
      <Card title="General Settings" subtitle="Basic store configuration">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={generalSettings.storeName}
                onChange={handleGeneralSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="storeEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Store Email
              </label>
              <input
                type="email"
                id="storeEmail"
                name="storeEmail"
                value={generalSettings.storeEmail}
                onChange={handleGeneralSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="storePhone" className="block text-sm font-medium text-gray-700 mb-1">
                Store Phone
              </label>
              <input
                type="text"
                id="storePhone"
                name="storePhone"
                value={generalSettings.storePhone}
                onChange={handleGeneralSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={generalSettings.currency}
                onChange={handleGeneralSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                id="language"
                name="language"
                value={generalSettings.language}
                onChange={handleGeneralSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="fr">French</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={generalSettings.timezone}
                onChange={handleGeneralSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button>Save General Settings</Button>
          </div>
        </div>
      </Card>
      
      <Card title="Payment Settings" subtitle="Configure payment methods and processing">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Methods</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableCash"
                    name="enableCash"
                    checked={paymentSettings.enableCash}
                    onChange={handlePaymentSettingsChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableCash" className="ml-2 block text-sm text-gray-900">
                    Cash
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableCreditCard"
                    name="enableCreditCard"
                    checked={paymentSettings.enableCreditCard}
                    onChange={handlePaymentSettingsChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableCreditCard" className="ml-2 block text-sm text-gray-900">
                    Credit Card
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableInvoice"
                    name="enableInvoice"
                    checked={paymentSettings.enableInvoice}
                    onChange={handlePaymentSettingsChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableInvoice" className="ml-2 block text-sm text-gray-900">
                    Invoice
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableBankTransfer"
                    name="enableBankTransfer"
                    checked={paymentSettings.enableBankTransfer}
                    onChange={handlePaymentSettingsChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableBankTransfer" className="ml-2 block text-sm text-gray-900">
                    Bank Transfer
                  </label>
                </div>
              </div>
            </div>
            
            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cashCommissionFree"
                  name="cashCommissionFree"
                  checked={paymentSettings.cashCommissionFree}
                  onChange={handlePaymentSettingsChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="cashCommissionFree" className="ml-2 block text-sm text-gray-900">
                  Cash payments are commission-free for merchants
                </label>
              </div>
            </div>
            
            <div className="col-span-2 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Stripe Integration</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="stripeEnabled"
                    name="stripeEnabled"
                    checked={paymentSettings.stripeEnabled}
                    onChange={handlePaymentSettingsChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="stripeEnabled" className="ml-2 block text-sm text-gray-900">
                    Enable Stripe for online payments
                  </label>
                </div>
                
                <div>
                  <label htmlFor="stripePublicKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Stripe Public Key
                  </label>
                  <input
                    type="text"
                    id="stripePublicKey"
                    name="stripePublicKey"
                    value={paymentSettings.stripePublicKey}
                    onChange={handlePaymentSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="stripeSecretKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Stripe Secret Key
                  </label>
                  <input
                    type="password"
                    id="stripeSecretKey"
                    name="stripeSecretKey"
                    value={paymentSettings.stripeSecretKey}
                    onChange={handlePaymentSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button>Save Payment Settings</Button>
          </div>
        </div>
      </Card>
      
      <Card title="Notification Settings" subtitle="Configure system notifications">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onChange={handleNotificationSettingsChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                Enable email notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="orderConfirmations"
                name="orderConfirmations"
                checked={notificationSettings.orderConfirmations}
                onChange={handleNotificationSettingsChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="orderConfirmations" className="ml-2 block text-sm text-gray-900">
                Send order confirmation emails
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="lowStockAlerts"
                name="lowStockAlerts"
                checked={notificationSettings.lowStockAlerts}
                onChange={handleNotificationSettingsChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="lowStockAlerts" className="ml-2 block text-sm text-gray-900">
                Send low stock alerts
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="newCustomerAlerts"
                name="newCustomerAlerts"
                checked={notificationSettings.newCustomerAlerts}
                onChange={handleNotificationSettingsChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="newCustomerAlerts" className="ml-2 block text-sm text-gray-900">
                Send new customer alerts
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button>Save Notification Settings</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
