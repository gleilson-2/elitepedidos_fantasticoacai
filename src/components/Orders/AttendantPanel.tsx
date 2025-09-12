import React, { useState, useEffect } from 'react';
import { useOrders, useOrderChat } from '../../hooks/useOrders';
import { Order, OrderStatus } from '../../types/order';
import OrderCard from './OrderCard';
import OrderChat from './OrderChat';
import ManualOrderForm from './ManualOrderForm';
import { 
  Package, 
  Plus, 
  RefreshCw, 
  MessageCircle, 
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  User,
  Bell,
  Settings
} from 'lucide-react';
import { PDVOperator } from '../../types/pdv';

interface AttendantPanelProps {
  operator: PDVOperator;
}

const AttendantPanel: React.FC<AttendantPanelProps> = ({ operator }) => {
  const { orders, loading, error, updateOrderStatus, refetch } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Update last refresh when orders change
  useEffect(() => {
    setLastRefresh(new Date());
  }, [orders]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // Show success feedback
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Status atualizado com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status do pedido');
    }
  };

  const handleOpenChat = (order: Order) => {
    setSelectedOrder(order);
    setShowChat(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchTerm || 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
      ready_for_pickup: orders.filter(o => o.status === 'ready_for_pickup').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
  };

  const stats = getStatusStats();

  const statusOptions = [
    { value: 'all', label: 'Todos', count: stats.total, color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pendentes', count: stats.pending, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmados', count: stats.confirmed, color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Preparando', count: stats.preparing, color: 'bg-orange-100 text-orange-800' },
    { value: 'out_for_delivery', label: 'Entregando', count: stats.out_for_delivery, color: 'bg-purple-100 text-purple-800' },
    { value: 'ready_for_pickup', label: 'Pronto', count: stats.ready_for_pickup, color: 'bg-indigo-100 text-indigo-800' },
    { value: 'delivered', label: 'Entregues', count: stats.delivered, color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelados', count: stats.cancelled, color: 'bg-red-100 text-red-800' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-3">
              <Package size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Gerenciar Pedidos</h2>
              <p className="text-gray-600">Sistema de atendimento e acompanhamento de pedidos</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={14} className="text-gray-500" />
                <span className="text-sm text-gray-500">
                  Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
                </span>
                {autoRefresh && (
                  <span className="text-sm text-green-600 font-medium">• Auto (30s)</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
              {autoRefresh ? 'Auto' : 'Manual'}
            </button>
            
            <button
              onClick={() => setShowManualForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Pedido Manual
            </button>
            
            <button
              onClick={refetch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {statusOptions.map((status) => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(status.value as OrderStatus | 'all')}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
              statusFilter === status.value
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-200'
            }`}
          >
            <div className="text-center">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${status.color}`}>
                {status.label}
              </div>
              <p className="text-2xl font-bold text-gray-800">{status.count}</p>
            </div>
          </button>
        ))}
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
                placeholder="Buscar por nome, telefone ou ID do pedido..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Erro ao carregar pedidos</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhum pedido encontrado' 
                : 'Nenhum pedido no momento'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Novos pedidos aparecerão aqui automaticamente'
              }
            </p>
            {autoRefresh && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Verificando novos pedidos automaticamente</span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
                onOpenChat={handleOpenChat}
                operator={operator}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <MessageCircle size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Chat - Pedido #{selectedOrder.id.slice(-8)}
                    </h2>
                    <p className="text-gray-600">
                      {selectedOrder.customer_name} • {selectedOrder.customer_phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowChat(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="h-96">
              <OrderChat
                orderId={selectedOrder.id}
                isAttendant={true}
                attendantName={operator?.name || 'Atendente'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Form Modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Plus size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Criar Pedido Manual</h2>
                    <p className="text-gray-600">Registrar pedido feito por telefone ou presencialmente</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <ManualOrderForm
                onOrderCreated={() => {
                  setShowManualForm(false);
                  refetch();
                }}
                onCancel={() => setShowManualForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Bell size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Sistema de Atendimento</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Atualização automática:</strong> Novos pedidos aparecem automaticamente a cada 30 segundos</li>
              <li>• <strong>Chat em tempo real:</strong> Converse com clientes diretamente pelo sistema</li>
              <li>• <strong>Status inteligente:</strong> Atualize o status dos pedidos com um clique</li>
              <li>• <strong>Busca avançada:</strong> Encontre pedidos por nome, telefone ou ID</li>
              <li>• <strong>Filtros rápidos:</strong> Visualize pedidos por status específico</li>
              <li>• <strong>Pedidos manuais:</strong> Registre pedidos feitos por telefone</li>
              <li>• <strong>Notificações:</strong> Sons e alertas para novos pedidos e mensagens</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendantPanel;