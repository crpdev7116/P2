import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const AdminSettings = () => {
  const { hasRole } = useAuth();
  
  // Settings state
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    showRecommendations: true,
    requireEmailVerification: true,
    allowGuestCheckout: false,
    enableAgeVerification: true,
    enableLoyaltyProgram: true,
    enableCreditSystem: true,
    maxItemsPerPage: 24,
    defaultCurrency: 'EUR',
    taxRate: 19,
    platformFee: 5,
    cashPaymentFee: 0,
    cardPaymentFee: 2.5,
    invoicePaymentFee: 1.5
  });

  // Handle toggle change
  const handleToggleChange = (key) => {
    setSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  // Handle input change
  const handleInputChange = (key, value) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };

  // Save settings
  const handleSave = () => {
    // In a real app, this would save to a backend
    alert('Einstellungen gespeichert!');
  };

  // Redirect if not admin
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Zugriff verweigert</h2>
          <p className="text-zinc-400 mb-4">Du hast keine Berechtigung, diese Seite zu sehen.</p>
          <Link 
            to="/"
            className="inline-block bg-black text-white border border-zinc-800 px-4 py-2 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-2xl font-bold mt-2">Plattform-Einstellungen</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Settings */}
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">
              Allgemeine Einstellungen
            </h2>
            
            <div className="space-y-4">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Wartungsmodus</h3>
                  <p className="text-sm text-zinc-400">Schaltet die Plattform in den Wartungsmodus</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={() => handleToggleChange('maintenanceMode')}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50 rounded-none border border-zinc-600 peer-checked:bg-zinc-900 peer-checked:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-zinc-600 after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              
              {/* Allow Registration */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Registrierung erlauben</h3>
                  <p className="text-sm text-zinc-400">Ermöglicht neuen Benutzern, sich zu registrieren</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.allowRegistration}
                    onChange={() => handleToggleChange('allowRegistration')}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50 rounded-none border border-zinc-600 peer-checked:bg-zinc-900 peer-checked:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-zinc-600 after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              
              {/* Show Recommendations */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Empfehlungs-Banner anzeigen</h3>
                  <p className="text-sm text-zinc-400">Zeigt "Von uns empfohlen" Banner auf ausgewählten Shops</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.showRecommendations}
                    onChange={() => handleToggleChange('showRecommendations')}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50 rounded-none border border-zinc-600 peer-checked:bg-zinc-900 peer-checked:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-zinc-600 after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              
              {/* Require Email Verification */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">E-Mail-Verifizierung erforderlich</h3>
                  <p className="text-sm text-zinc-400">Benutzer müssen ihre E-Mail-Adresse bestätigen</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.requireEmailVerification}
                    onChange={() => handleToggleChange('requireEmailVerification')}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50 rounded-none border border-zinc-600 peer-checked:bg-zinc-900 peer-checked:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-zinc-600 after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              
              {/* Allow Guest Checkout */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Gast-Checkout erlauben</h3>
                  <p className="text-sm text-zinc-400">Ermöglicht Bestellungen ohne Registrierung</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.allowGuestCheckout}
                    onChange={() => handleToggleChange('allowGuestCheckout')}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50 rounded-none border border-zinc-600 peer-checked:bg-zinc-900 peer-checked:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-zinc-600 after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Business Settings */}
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">
              Geschäftsregeln
            </h2>
            
            <div className="space-y-4">
              {/* Enable Age Verification */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Altersverifikation aktivieren</h3>
                  <p className="text-sm text-zinc-400">Prüft das Alter für 18+ Artikel</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.enableAgeVerification}
                    onChange={() => handleToggleChange('enableAgeVerification')}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50 rounded-none border border-zinc-600 peer-checked:bg-zinc-900 peer-checked:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-zinc-600 after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              
              {/* Enable Loyalty Program */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Treueprogramm aktivieren</h3>
                  <p className="text-sm text-zinc-400">Aktiviert Punkte- und Stempelsystem</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.enableLoyaltyProgram}
                    onChange={() => handleToggleChange('enableLoyaltyProgram')}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50 rounded-none border border-zinc-600 peer-checked:bg-zinc-900 peer-checked:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-zinc-600 after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              
              {/* Enable Credit System */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Kreditsystem aktivieren</h3>
                  <p className="text-sm text-zinc-400">Ermöglicht Händlern, Kreditlimits für Kunden festzulegen</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.enableCreditSystem}
                    onChange={() => handleToggleChange('enableCreditSystem')}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/50 rounded-none border border-zinc-600 peer-checked:bg-zinc-900 peer-checked:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-zinc-600 after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              
              {/* Items Per Page */}
              <div>
                <h3 className="font-medium">Artikel pro Seite</h3>
                <p className="text-sm text-zinc-400 mb-2">Maximale Anzahl von Artikeln pro Seite</p>
                <select
                  value={settings.maxItemsPerPage}
                  onChange={(e) => handleInputChange('maxItemsPerPage', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                >
                  <option value={12}>12 Artikel</option>
                  <option value={24}>24 Artikel</option>
                  <option value={36}>36 Artikel</option>
                  <option value={48}>48 Artikel</option>
                </select>
              </div>
              
              {/* Default Currency */}
              <div>
                <h3 className="font-medium">Standardwährung</h3>
                <p className="text-sm text-zinc-400 mb-2">Währung für alle Preise</p>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                >
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">US-Dollar ($)</option>
                  <option value="GBP">Britisches Pfund (£)</option>
                  <option value="CHF">Schweizer Franken (CHF)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Fees & Taxes */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">
              Gebühren & Steuern
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tax Rate */}
              <div>
                <h3 className="font-medium">Mehrwertsteuersatz (%)</h3>
                <p className="text-sm text-zinc-400 mb-2">Standard-Mehrwertsteuersatz für Artikel</p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.taxRate}
                  onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
              </div>
              
              {/* Platform Fee */}
              <div>
                <h3 className="font-medium">Plattformgebühr (%)</h3>
                <p className="text-sm text-zinc-400 mb-2">Gebühr für Händler pro Verkauf</p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.platformFee}
                  onChange={(e) => handleInputChange('platformFee', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
              </div>
              
              {/* Cash Payment Fee */}
              <div>
                <h3 className="font-medium">Barzahlungsgebühr (%)</h3>
                <p className="text-sm text-zinc-400 mb-2">Zusätzliche Gebühr für Barzahlung</p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.cashPaymentFee}
                  onChange={(e) => handleInputChange('cashPaymentFee', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
              </div>
              
              {/* Card Payment Fee */}
              <div>
                <h3 className="font-medium">Kartenzahlungsgebühr (%)</h3>
                <p className="text-sm text-zinc-400 mb-2">Zusätzliche Gebühr für Kartenzahlung</p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.cardPaymentFee}
                  onChange={(e) => handleInputChange('cardPaymentFee', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
              </div>
              
              {/* Invoice Payment Fee */}
              <div>
                <h3 className="font-medium">Rechnungszahlungsgebühr (%)</h3>
                <p className="text-sm text-zinc-400 mb-2">Zusätzliche Gebühr für Rechnungszahlung</p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.invoicePaymentFee}
                  onChange={(e) => handleInputChange('invoicePaymentFee', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave}>
            Einstellungen speichern
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
