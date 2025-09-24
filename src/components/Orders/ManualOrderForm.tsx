import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, User, Phone, MapPin, CreditCard, Package, Trash2 } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import { Order } from '../../types/order';

interface ManualOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: Order) => void;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  observations?: string;
}

const ManualOrderForm: React.FC<ManualOrderFormProps> = ({
  isOpen,
  onClose,
  onOrderCreated
}) => {
  const { createOrder } = useOrders();
  const { neighborhoods } = useNeighborhoods();
  const { products } = useDeliveryProducts();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNeighborhood, setCustomerNeighborhood] = useState('');
  const [customerComplement, setCustomerComplement] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'pix' | 'card'>('money');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerNeighborhood('');
      setCustomerComplement('');
      setPaymentMethod('money');
      setChangeFor(undefined);
      setItems([]);
      setSelectedProductId('');
    }
  }, [isOpen]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setCustomerPhone(formatted);
  };

  const addItem = () => {
    if (!selectedProductId) {
      alert('Selecione um produto');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      alert('Produto não encontrado');
      return;
    }

    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url || 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
      quantity: 1,
      unit_price: product.price,
      total_price: product.price,
      observations: ''
    };

    setItems(prev => [...prev, newItem]);
    setSelectedProductId('');
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total_price: item.unit_price * quantity
        };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const getDeliveryFee = () => {
    const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
    return neighborhood ? neighborhood.delivery_fee : 5.00;
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.total_price, 0);
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      alert('Nome do cliente é obrigatório');
      return false;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 11) {
      alert('Telefone válido é obrigatório');
      return false;
    }

    if (!customerAddress.trim()) {
      alert('Endereço é obrigatório');
      return false;
    }

    if (!customerNeighborhood.trim()) {
      alert('Bairro é obrigatório');
      return false;
    }

    if (items.length === 0) {
      alert('Adicione pelo menos um item ao pedido');
      return false;
    }

    if (paymentMethod === 'money' && changeFor && changeFor < getTotal()) {
      alert('Valor para troco deve ser maior ou igual ao total');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
      
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone.replace(/\D/g, ''),
        customer_address: customerAddress,
        customer_neighborhood: customerNeighborhood,
        customer_complement: customerComplement,
        payment_method: paymentMethod,
        change_for: changeFor,
        neighborhood_id: neighborhood?.id,
        delivery_fee: getDeliveryFee(),
        estimated_delivery_minutes: neighborhood?.delivery_time || 35,
        items: items.map(item => ({
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          observations: item.observations,
          complements: []
        })),
        total_price: getTotal(),
        status: 'confirmed' as const,
        channel: 'manual'
      };

      const newOrder = await createOrder(orderData);

      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }

      // Show success message
      alert(`Pedido manual criado com sucesso!\n\nID: ${newOrder.id.slice(-8)}\nCliente: ${customerName}\nTotal: ${formatPrice(getTotal())}`);

      // Close modal and reset form
      handleClose();
    } catch (error) {
      console.error('Erro ao criar pedido manual:', error);
      alert(`Erro ao criar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 Fechando modal de pedido manual');
    
    // Reset all form data
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerNeighborhood('');
    setCustomerComplement('');
    setPaymentMethod('money');
    setChangeFor(undefined);
    setItems([]);
    setSelectedProductId('');
    setIsSubmitting(false);
    
    // Call the onClose callback
    onClose();
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  // Handle click outside modal to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Criar Pedido Manual</h2>
              <p className="text-gray-600">Crie um pedido diretamente pelo sistema</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
              title="Fechar"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Dados do Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(85) 99999-9999"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro *
              </label>
              <div className="relative">
                <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={customerNeighborhood}
                  onChange={(e) => setCustomerNeighborhood(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione o bairro</option>
                  {neighborhoods.map(neighborhood => (
                    <option key={neighborhood.id} value={neighborhood.name}>
                      {neighborhood.name} - {formatPrice(neighborhood.delivery_fee)} ({neighborhood.delivery_time}min)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço Completo *
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rua, número, casa/apartamento"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento (opcional)
              </label>
              <input
                type="text"
                value={customerComplement}
                onChange={(e) => setCustomerComplement(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apartamento, bloco, referência..."
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Itens do Pedido</h3>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um produto</option>
                  {products.filter(p => p.is_active).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatPrice(product.price)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum item adicionado</p>
                <p className="text-gray-400 text-sm">Selecione produtos para adicionar ao pedido</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.unit_price)} cada
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-300 rounded-full transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-300 rounded-full transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatPrice(item.total_price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Forma de Pagamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="money"
                  checked={paymentMethod === 'money'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-green-600"
                />
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="font-medium">Dinheiro</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">PIX</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-purple-600"
                />
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-purple-600" />
                  <span className="font-medium">Cartão</span>
                </div>
              </label>
            </div>

            {paymentMethod === 'money' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Troco para quanto? (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={getTotal()}
                  value={changeFor || ''}
                  onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={`Mínimo: ${formatPrice(getTotal())}`}
                />
                {changeFor && changeFor > getTotal() && (
                  <p className="text-sm text-green-600 mt-1">
                    Troco: {formatPrice(changeFor - getTotal())}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Resumo do Pedido</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''}):</span>
                  <span className="font-medium text-green-800">{formatPrice(getSubtotal())}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Taxa de entrega:</span>
                  <span className="font-medium text-green-800">{formatPrice(getDeliveryFee())}</span>
                </div>
                
                <div className="border-t border-green-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-green-800">Total:</span>
                    <span className="text-2xl font-bold text-green-600">{formatPrice(getTotal())}</span>
                  </div>
                </div>
                
                {customerNeighborhood && (
                  <div className="text-sm text-green-700 mt-2">
                    <p>📍 Entrega em: {customerNeighborhood}</p>
                    <p>⏱️ Tempo estimado: {neighborhoods.find(n => n.name === customerNeighborhood)?.delivery_time || 35} minutos</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="flex-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Criando Pedido...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Criar Pedido - {formatPrice(getTotal())}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualOrderForm;