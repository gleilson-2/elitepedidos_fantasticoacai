import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, User, Phone, MapPin, Package, DollarSign, AlertCircle } from 'lucide-react';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { useOrders } from '../../hooks/useOrders';
import { Order } from '../../types/order';

interface ManualOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  observations?: string;
  complements: Array<{
    name: string;
    price: number;
  }>;
}

const ManualOrderForm: React.FC<ManualOrderFormProps> = ({
  isOpen,
  onClose,
  onOrderCreated
}) => {
  const { products } = useDeliveryProducts();
  const { neighborhoods } = useNeighborhoods();
  const { createOrder } = useOrders();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNeighborhood, setCustomerNeighborhood] = useState('');
  const [customerComplement, setCustomerComplement] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'pix' | 'card'>('money');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemObservations, setItemObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url || 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
      quantity: itemQuantity,
      unit_price: product.price,
      total_price: product.price * itemQuantity,
      observations: itemObservations,
      complements: []
    };

    setItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setItemQuantity(1);
    setItemObservations('');
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          quantity,
          total_price: item.unit_price * quantity
        };
      }
      return item;
    }));
  };

  const getTotalPrice = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
    const deliveryFee = neighborhood ? neighborhood.delivery_fee : 5.00;
    return subtotal + deliveryFee;
  };

  const getDeliveryFee = () => {
    const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
    return neighborhood ? neighborhood.delivery_fee : 5.00;
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      setError('Nome do cliente é obrigatório');
      return false;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 11) {
      setError('Telefone válido é obrigatório');
      return false;
    }

    if (!customerAddress.trim()) {
      setError('Endereço é obrigatório');
      return false;
    }

    if (!customerNeighborhood.trim()) {
      setError('Bairro é obrigatório');
      return false;
    }

    if (items.length === 0) {
      setError('Adicione pelo menos um item ao pedido');
      return false;
    }

    if (paymentMethod === 'money' && changeFor && changeFor < getTotalPrice()) {
      setError('Valor para troco deve ser maior ou igual ao total');
      return false;
    }

    setError('');
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
        items: items,
        total_price: getTotalPrice(),
        status: 'confirmed' as const,
        channel: 'manual'
      };

      const newOrder = await createOrder(orderData);
      
      // Show success message
      alert(`✅ Pedido manual criado com sucesso!\n\nID: ${newOrder.id.slice(-8)}\nCliente: ${customerName}\nTotal: ${formatPrice(getTotalPrice())}`);
      
      onOrderCreated(newOrder);
      onClose();
      
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerNeighborhood('');
      setCustomerComplement('');
      setPaymentMethod('money');
      setChangeFor(undefined);
      setItems([]);
      setError('');
    } catch (err) {
      console.error('Erro ao criar pedido manual:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Criar Pedido Manual</h2>
              <p className="text-gray-600">Crie um pedido diretamente pelo sistema</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados do Cliente</h3>
            
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

          {/* Add Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Adicionar Produtos</h3>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um produto</option>
                    {products.filter(p => p.is_active).map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-16 text-center py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    &nbsp;
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!selectedProductId}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações do Item (opcional)
                </label>
                <input
                  type="text"
                  value={itemObservations}
                  onChange={(e) => setItemObservations(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Sem açúcar, mais granola..."
                />
              </div>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Itens do Pedido ({items.length})</h3>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.quantity}x {formatPrice(item.unit_price)} = {formatPrice(item.total_price)}
                        </p>
                        {item.observations && (
                          <p className="text-xs text-gray-500">Obs: {item.observations}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Forma de Pagamento</h3>
            
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
                  <DollarSign size={20} className="text-green-600" />
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
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
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
                  min={getTotalPrice()}
                  value={changeFor || ''}
                  onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={`Mínimo: ${formatPrice(getTotalPrice())}`}
                />
                {changeFor && changeFor > getTotalPrice() && (
                  <p className="text-sm text-green-600 mt-1">
                    Troco: {formatPrice(changeFor - getTotalPrice())}
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
                  <span className="font-medium text-green-800">
                    {formatPrice(items.reduce((sum, item) => sum + item.total_price, 0))}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Taxa de entrega:</span>
                  <span className="font-medium text-green-800">{formatPrice(getDeliveryFee())}</span>
                </div>
                
                <div className="border-t border-green-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-green-800">Total:</span>
                    <span className="text-2xl font-bold text-green-600">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="flex-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Criando Pedido...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Criar Pedido Manual - {formatPrice(getTotalPrice())}
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