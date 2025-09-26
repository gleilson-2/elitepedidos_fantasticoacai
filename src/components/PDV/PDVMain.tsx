import React, { useState } from 'react';
import { 
  Calculator, 
  Package, 
  DollarSign, 
  Users, 
  Settings, 
  LogOut, 
  BarChart3,
  Clock,
  FileText,
  Utensils,
  Scale,
  Printer
} from 'lucide-react';
import { PDVOperator } from '../../types/pdv';
import PDVSalesScreen from './PDVSalesScreen';
import CashRegisterMenu from './CashRegisterMenu';
import PDVReports from './PDVReports';
import PDVSalesReport from './PDVSalesReport';
import PDVDailyCashReport from './PDVDailyCashReport';
import PDVProductsManager from './PDVProductsManager';
import PDVOperators from './PDVOperators';
import PDVSettings from './PDVSettings';
import ThermalPrinterSetup from './ThermalPrinterSetup';
import { useThermalPrinter } from '../../hooks/useThermalPrinter';

interface PDVMainProps {
  operator: PDVOperator;
  onLogout: () => void;
}

type TabType = 'sales' | 'cash' | 'reports' | 'sales-report' | 'cash-report' | 'products' | 'operators' | 'settings' | 'printer';

const PDVMain: React.FC<PDVMainProps> = ({ operator, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const { connection: printerConnection } = useThermalPrinter();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sales':
        return <PDVSalesScreen operator={operator} />;
      case 'cash':
        return <CashRegisterMenu operator={operator} />;
      case 'reports':
        return <PDVReports />;
      case 'sales-report':
        return <PDVSalesReport />;
      case 'cash-report':
        return <PDVDailyCashReport />;
      case 'products':
        return <PDVProductsManager operator={operator} />;
      case 'operators':
        return <PDVOperators operator={operator} />;
      case 'settings':
        return <PDVSettings operator={operator} />;
      case 'printer':
        return <ThermalPrinterSetup />;
      default:
        return <PDVSalesScreen operator={operator} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Calculator size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Sistema PDV</h1>
                <p className="text-gray-600">Elite Açaí - Ponto de Venda</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Printer Status */}
              <button
                onClick={() => setShowPrinterSetup(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  printerConnection.isConnected
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={printerConnection.isConnected ? 'Impressora conectada' : 'Configurar impressora'}
              >
                <Printer size={18} />
                <span className="hidden sm:inline">
                  {printerConnection.isConnected ? 'Conectada' : 'Impressora'}
                </span>
              </button>
              
              {/* User Info */}
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                <User size={18} className="text-gray-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-700">{operator.name}</p>
                  <p className="text-gray-500 text-xs">{operator.code}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'sales'
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <Calculator size={18} />
              <span className="hidden sm:inline">Vendas</span>
            </button>
            
            <button
              onClick={() => setActiveTab('cash')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'cash'
                  ? 'bg-green-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <DollarSign size={18} />
              <span className="hidden sm:inline">Caixa</span>
            </button>
            
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <Package size={18} />
              <span className="hidden sm:inline">Produtos</span>
            </button>
            
            <button
              onClick={() => setActiveTab('operators')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'operators'
                  ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <Users size={18} />
              <span className="hidden sm:inline">Operadores</span>
            </button>
            
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'reports'
                  ? 'bg-orange-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <BarChart3 size={18} />
              <span className="hidden sm:inline">Relatórios</span>
            </button>
            
            <button
              onClick={() => setActiveTab('sales-report')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'sales-report'
                  ? 'bg-teal-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <FileText size={18} />
              <span className="hidden sm:inline">Rel. Vendas</span>
            </button>
            
            <button
              onClick={() => setActiveTab('cash-report')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'cash-report'
                  ? 'bg-yellow-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <Clock size={18} />
              <span className="hidden sm:inline">Rel. Caixa</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-gray-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Config</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>

      {/* Printer Setup Modal */}
      {showPrinterSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Configuração da Impressora</h2>
                <button
                  onClick={() => setShowPrinterSetup(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <ThermalPrinterSetup />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDVMain;