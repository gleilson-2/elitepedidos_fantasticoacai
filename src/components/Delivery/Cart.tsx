import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, Edit3 } from 'lucide-react';
import { CartItem } from '../../types/cart';
import AISalesAssistant from './AISalesAssistant';
import { Product } from '../../types/product';

interface CartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  totalPrice: number;
  disabled?: boolean;
  onEditItem?: (item: CartItem) => void;
  onCheckout?: () => void;
  availableProducts?: Product[];
  onAddProduct?: (product: Product) => void;
  aiSuggestionsEnabled?: boolean;
}

const Cart: React.FC<CartProps> = ({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalPrice,
  disabled = false,
  onEditItem,
  onCheckout,
  availableProducts = [],
  onAddProduct,
  aiSuggestionsEnabled = true
}) => {
  const [localAiEnabled, setLocalAiEnabled] = useState(true);
  const [showInCart, setShowInCart] = useState(true);

  // Carregar configurações de IA
  useEffect(() => {
    const checkAISettings = () => {
      try {
        console.log('🤖 [CART] Verificando configurações de IA...');
        
        // Verificar configuração específica primeiro
        const aiEnabled = localStorage.getItem('ai_sales_assistant_enabled');
        console.log('🤖 [CART] ai_sales_assistant_enabled:', aiEnabled);
        
        if (aiEnabled !== null) {
          const enabled = JSON.parse(aiEnabled);
          setLocalAiEnabled(enabled);
          console.log('🤖 [CART] Estado local definido (específico):', enabled);
          return;
        }
        
        // Fallback para configuração geral
        const savedSettings = localStorage.getItem('delivery_suggestions_settings');
        console.log('🤖 [CART] delivery_suggestions_settings:', savedSettings);
        
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const enabled = settings.enabled !== false;
          const showInCartSetting = settings.showInCart !== false;
          setLocalAiEnabled(enabled);
          setShowInCart(showInCartSetting);
          console.log('🤖 [CART] Estado local definido (geral):', enabled);
          console.log('🤖 [CART] Mostrar no carrinho:', showInCartSetting);
        } else {
          setLocalAiEnabled(true);
          setShowInCart(true);
          console.log('🤖 [CART] Estado local definido (padrão): true');
        }
      } catch (error) {
        console.warn('🤖 [CART] Erro ao verificar configuração:', error);
        setLocalAiEnabled(true);
        setShowInCart(true);
      }
    };

    checkAISettings();

    // Escutar mudanças nas configurações
    const loadSettings = async () => {
      try {
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || 
            supabaseUrl.includes('placeholder') || 
            supabaseKey.includes('placeholder')) {
          console.warn('⚠️ [CART] Supabase não configurado - usando localStorage');
          loadFromLocalStorage();
          return;
        }

        // Carregar do banco de dados
        const { data, error } = await supabase
          .from('order_settings')
          .select('ai_suggestions_enabled')
          .eq('id', 'default')
          .maybeSingle();

        if (error) {
          console.error('❌ [CART] Erro ao carregar do banco:', error);
          loadFromLocalStorage();
          return;
        }

        if (data) {
          const enabled = data.ai_suggestions_enabled ?? true;
          setLocalAiEnabled(enabled);
          console.log('✅ [CART] Configuração carregada do banco:', enabled);
          
          // Backup no localStorage
          localStorage.setItem('ai_sales_assistant_enabled', JSON.stringify(enabled));
        } else {
          console.log('ℹ️ [CART] Nenhuma configuração no banco, usando localStorage');
          loadFromLocalStorage();
        }
      } catch (dbError) {
        console.error('❌ [CART] Erro de conexão com banco:', dbError);
        loadFromLocalStorage();
      }
    };
    
    const loadFromLocalStorage = () => {
      try {
        const aiEnabled = localStorage.getItem('ai_sales_assistant_enabled');
        console.log('🤖 [CART] Carregando do localStorage:', aiEnabled);
        
        if (aiEnabled !== null) {
          const enabled = JSON.parse(aiEnabled);
          setLocalAiEnabled(enabled);
          console.log('🤖 [CART] Estado do localStorage aplicado:', enabled);
        }
      } catch (error) {
        console.error('❌ [CART] Erro ao carregar do localStorage:', error);
      }
    };

    const handleConfigChange = (event: CustomEvent) => {
      console.log('🤖 [CART] Evento de mudança de configuração recebido:', event.detail);
      setLocalAiEnabled(event.detail.enabled);
      if (event.detail.settings) {
        setShowInCart(event.detail.settings.showInCart !== false);
      }
      
      // Forçar re-render
      setTimeout(() => {
        console.log('🤖 [CART] Estado após evento:', event.detail.enabled);
      }, 100);
    };

    window.addEventListener('aiSuggestionsConfigChanged', handleConfigChange as EventListener);
    
    return () => {
      window.removeEventListener('aiSuggestionsConfigChanged', handleConfigChange as EventListener);
    };
  }, []);

  // Combinar configurações: prop externa E configuração local
  const finalAiEnabled = aiSuggestionsEnabled && localAiEnabled && showInCart;

  console.log('🤖 [CART] Estado final das sugestões IA:', {
    aiSuggestionsEnabled,
    localAiEnabled,
    showInCart,
    finalAiEnabled,
    itemsCount: items.length,
    hasAvailableProducts: availableProducts.length > 0,
    hasOnAddProduct: !!onAddProduct
  });

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:w-[90vw] md:max-w-2xl h-full md:h-auto md:max-h-[90vh] md:rounded-2xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b bg-gradient-to-r from-purple-50 to-green-50 md:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 rounded-full p-2">
              <ShoppingCart size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                Meu Carrinho
              </h2>
              <p className="text-sm text-gray-600">
                {items.length} produto(s) • {getTotalItems()} item(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors touch-manipulation"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <div className="p-6 md:p-8 text-center">
              <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Seu carrinho está vazio</h3>
              <p className="text-gray-500 text-sm">
                Adicione produtos deliciosos do nosso cardápio!
              </p>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3 md:gap-4">
                    {/* Product Image */}
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 text-sm md:text-base leading-tight">
                            {item.product.name}
                          </h3>
                          {item.selectedSize && (
                            <p className="text-xs text-gray-600 mt-1">
                              Tamanho: {item.selectedSize.name}
                            </p>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 md:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors touch-manipulation"
                            disabled={disabled}
                            title="Remover produto"
                          >
                            <Trash2 size={14} className="md:w-4 md:h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Complementos */}
                      {item.selectedComplements && item.selectedComplements.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-gray-700">Complementos:</p>
                            {onEditItem && (
                              <button
                                onClick={() => onEditItem(item)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                disabled={disabled}
                              >
                                Editar
                              </button>
                            )}
                          </div>
                          <div className="max-h-16 md:max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            <div className="flex flex-wrap gap-1 pr-2">
                            {item.selectedComplements.slice(0, 4).map((selectedComp, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full break-words"
                              >
                                {selectedComp.complement.name}
                                {selectedComp.complement.price > 0 && ` (+${formatPrice(selectedComp.complement.price)})`}
                              </span>
                            ))}
                            {item.selectedComplements.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{item.selectedComplements.length - 4} mais
                              </span>
                            )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      {item.observations && (
                        <div className="mb-2 p-2 md:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                          <p className="text-xs text-yellow-800">
                            <strong>Obs:</strong> {item.observations}
                          </p>
                            </div>
                            {onEditItem && (
                              <button
                                onClick={() => onEditItem(item)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                                disabled={disabled}
                                title="Editar observações"
                              >
                                Editar
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Edit Product Button - More Prominent */}
                      {onEditItem && (item.selectedComplements.length > 0 || item.observations || item.selectedSize) && (
                        <div className="mb-2">
                          <button
                            onClick={() => onEditItem(item)}
                            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium border border-blue-200"
                            disabled={disabled}
                          >
                            <Edit3 size={16} />
                            Personalizar este produto
                          </button>
                        </div>
                      )}

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-300 rounded-full transition-colors touch-manipulation"
                            disabled={disabled}
                          >
                            <Minus size={14} className="md:w-4 md:h-4" />
                          </button>
                          <span className="w-8 md:w-10 text-center font-medium text-gray-800 text-sm md:text-base">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-300 rounded-full transition-colors touch-manipulation"
                            disabled={disabled}
                          >
                            <Plus size={14} className="md:w-4 md:h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 text-sm md:text-base">
                            {formatPrice(item.totalPrice)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.unit_price)} cada
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Sales Assistant */}
        {items.length > 0 && availableProducts.length > 0 && onAddProduct && finalAiEnabled && (
          <div className="p-4 md:p-6 border-t border-gray-200">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">IA Ativa</span>
              </div>
            </div>
            <AISalesAssistant
              cartItems={items}
              availableProducts={availableProducts}
              onAddSuggestion={(product, reason) => {
                onAddProduct(product);
                
                // Show success message with AI reason
                const successMessage = document.createElement('div');
                successMessage.className = 'fixed top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 md:px-4 py-2 rounded-lg shadow-lg z-50 max-w-xs md:max-w-sm text-sm md:text-base';
                successMessage.innerHTML = `
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <div>
                      <p class="font-medium text-xs md:text-sm">🤖 Sugestão adicionada!</p>
                      <p class="text-xs opacity-90">${product.name}</p>
                    </div>
                  </div>
                `;
                document.body.appendChild(successMessage);
                
                setTimeout(() => {
                  if (document.body.contains(successMessage)) {
                    document.body.removeChild(successMessage);
                  }
                }, 4000);
              }}
            />
          </div>
        )}
        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-white p-4 md:p-6 md:rounded-b-2xl">
            {/* Total */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 md:p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-base md:text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-xl md:text-2xl font-bold text-green-600">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>{items.length} produto(s)</span>
                <span>{getTotalItems()} item(s)</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClearCart}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
                disabled={disabled}
              >
                <Trash2 size={16} />
                Limpar
              </button>
              
             <button
               onClick={onClose}
               className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
               disabled={disabled}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
               Continuar comprando
             </button>
             
              <button
                onClick={onCheckout || onClose}
               className="flex-1 sm:flex-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 touch-manipulation"
                disabled={disabled}
              >
                <ShoppingCart size={18} />
               {onCheckout ? 'Finalizar' : 'Fechar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;