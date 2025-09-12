import React, { useState, useEffect, useRef } from 'react';
import { useOrders, useOrderChat } from '../../hooks/useOrders';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useOrderSettings } from '../../hooks/useOrderSettings';
import { useThermalPrinter } from '../../hooks/useThermalPrinter';
import { usePermissions } from '../../hooks/usePermissions';
import ManualOrderForm from './ManualOrderForm';
import OrderCard from './OrderCard';
import ThermalPrinterSetup from '../PDV/ThermalPrinterSetup';
import { OrderStatus } from '../../types/order';
import {
  Package,
  Plus,
  RefreshCw,
  Filter,
  Search,
  Bell,
  Settings,
  Printer
} from 'lucide-react';
import { PDVOperator } from '../../types/pdv';

interface AttendantPanelProps {
  onBackToAdmin?: () => void;
  operator?: PDVOperator;
}

const AttendantPanel: React.FC<AttendantPanelProps> = ({ onBackToAdmin, operator }) => {
  const { orders, loading, error, updateOrderStatus, refetch } = useOrders();
  const { currentRegister, isOpen: isCashRegisterOpen } = usePDVCashRegister();
  const { settings } = useOrderSettings();
  const { connection: printerConnection, printOrder } = useThermalPrinter();
  const { hasPermission } = usePermissions(operator);
  
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('pending');
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [newOrder, setNewOrder] = useState<any | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('🔍 AttendantPanel - Operator permissions:', {
      operator: operator ? {
        name: operator.name,
        code: operator.code,
        permissions: Object.keys(operator.permissions).filter(key => 
          operator.permissions[key as keyof typeof operator.permissions]
        )
      } : 'No operator',
      canCreateManualOrders: hasPermission('can_create_manual_orders')
    });
  }, [operator, hasPermission]);

  // Auto refresh orders every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-atualizando pedidos...');
      refetch();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [autoRefresh, refetch]);

  // Update last refresh time when orders change
  useEffect(() => {
    setLastRefresh(new Date());
  }, [orders]);

  // Sound notification for new orders
  useEffect(() => {
    if (orders.length > lastOrderCount && lastOrderCount > 0 && soundEnabled) {
      playNotificationSound();
    }
    setLastOrderCount(orders.length);
  }, [orders.length, lastOrderCount, soundEnabled]);

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(settings?.channel_sounds?.delivery || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.volume = (settings?.sound_volume || 70) / 100;
      }
      audioRef.current.play().catch(e => console.warn('Erro ao tocar som:', e));
    } catch (error) {
      console.warn('Erro ao configurar som:', error);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    if (!autoRefresh) {
      refetch();
      setLastRefresh(new Date());
    }
  };

  const handleManualOrderCreate = () => {
    console.log('🎯 Botão Criar Pedido Manual clicado');
    setShowManualOrderForm(true);
  };

  const handleManualOrderClose = () => {
    console.log('❌ Fechando modal de pedido manual');
    setShowManualOrderForm(false);
  };

  const handleManualOrderSuccess = (order: any) => {
    console.log('✅ Pedido manual criado com sucesso:', order);
    setShowManualOrderForm(false);
    refetch(); // Atualizar lista de pedidos
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
    successMessage.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Pedido manual criado com sucesso!
    `;
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
      if (document.body.contains(successMessage)) {
        document.body.removeChild(successMessage);
      }
    }, 3000);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchTerm || 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusCount = (status: OrderStatus | 'all') => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  const handlePrintOrder = async (order: any) => {
    try {
      if (printerConnection.isConnected) {
        console.log('🖨️ Imprimindo pedido automaticamente via impressora térmica...');
        await printOrder(order);
      } else {
        console.log('🖨️ Impressora não conectada, usando método tradicional...');
        // Fallback to traditional print method
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
          // Implementation for traditional printing would go here
          printWindow.document.write('<html><body><h1>Pedido para impressão</h1></body></html>');
          printWindow.print();
          printWindow.close();
        }
      }
    } catch (error) {
      console.error('❌ Erro ao imprimir pedido:', error);
      alert('Erro ao imprimir pedido. Verifique a conexão da impressora.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando pedidos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-blue-600" />
            Gerenciar Pedidos
          </h2>
          <p className="text-gray-600">
            {orders.length} pedido(s) • Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <button
            onClick={toggleAutoRefresh}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
              autoRefresh 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title={autoRefresh ? 'Desativar atualização automática' : 'Ativar atualização automática'}
          >
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
            {autoRefresh ? 'Auto' : 'Manual'}
          </button>

          {/* Printer Setup */}
          <button
            onClick={() => setShowPrinterSetup(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
              printerConnection.isConnected
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title="Configurar impressora térmica"
          >
            <Printer size={16} />
            {printerConnection.isConnected ? 'Conectada' : 'Impressora'}
          </button>

          {/* Manual Order Button */}
          {hasPermission('can_create_manual_orders') && (
            <button
              onClick={handleManualOrderCreate}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Criar Pedido Manual
            </button>
          )}
          
          <button
            onClick={refetch}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, telefone ou ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {[
              { value: 'all' as const, label: 'Todos', color: 'bg-gray-100 text-gray-700' },
              { value: 'pending' as const, label: 'Pendentes', color: 'bg-yellow-100 text-yellow-700' },
              { value: 'confirmed' as const, label: 'Confirmados', color: 'bg-blue-100 text-blue-700' },
              { value: 'preparing' as const, label: 'Preparando', color: 'bg-orange-100 text-orange-700' },
              { value: 'out_for_delivery' as const, label: 'Entregando', color: 'bg-purple-100 text-purple-700' },
              { value: 'ready_for_pickup' as const, label: 'Pronto', color: 'bg-indigo-100 text-indigo-700' },
              { value: 'delivered' as const, label: 'Entregues', color: 'bg-green-100 text-green-700' }
            ].map(status => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  statusFilter === status.value
                    ? 'bg-blue-600 text-white'
                    : status.color
                }`}
              >
                {status.label} ({getStatusCount(status.value)})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? 'Nenhum pedido encontrado' : 'Nenhum pedido'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Tente buscar por outro termo'
                : statusFilter === 'all' 
                  ? 'Não há pedidos no momento'
                  : `Não há pedidos com status "${statusFilter}"`
              }
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={updateOrderStatus}
              onPrint={handlePrintOrder}
              operator={operator}
            />
          ))
        )}
      </div>

      {/* Thermal Printer Setup Modal */}
      {showPrinterSetup && (
        <ThermalPrinterSetup
          isOpen={showPrinterSetup}
          onClose={() => setShowPrinterSetup(false)}
        />
      )}

      {/* Manual Order Form Modal */}
      {showManualOrderForm && (
        <ManualOrderForm
          isOpen={showManualOrderForm}
          onClose={handleManualOrderClose}
          onOrderCreated={handleManualOrderSuccess}
        />
      )}
    </div>
  );
};

export default AttendantPanel;