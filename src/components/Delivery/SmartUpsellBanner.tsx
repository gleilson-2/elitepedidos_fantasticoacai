import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Users, Clock, Zap, X } from 'lucide-react';
import { CartItem } from '../../types/cart';
import { Product } from '../../types/product';

interface SmartUpsellBannerProps {
  cartItems: CartItem[];
  availableProducts: Product[];
  onProductSelect: (product: Product) => void;
  className?: string;
}

interface UpsellSuggestion {
  product: Product;
  message: string;
  trigger: 'social_proof' | 'urgency' | 'affinity' | 'value';
  confidence: number;
  priceIncrease?: number;
}

const SmartUpsellBanner: React.FC<SmartUpsellBannerProps> = ({
  cartItems,
  availableProducts,
  onProductSelect,
  className = ''
}) => {
  const [currentSuggestion, setCurrentSuggestion] = useState<UpsellSuggestion | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [aiEnabled, setAiEnabled] = useState(true);

  // Verificar se as sugestões IA estão habilitadas
  useEffect(() => {
    const checkAISettings = () => {
      try {
        const aiEnabled = localStorage.getItem('ai_sales_assistant_enabled');
        if (aiEnabled !== null) {
          setAiEnabled(JSON.parse(aiEnabled));
        } else {
          const savedSettings = localStorage.getItem('delivery_suggestions_settings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            setAiEnabled(settings.enabled !== false);
          }
        }
      } catch (error) {
        console.warn('Erro ao verificar configuração de sugestões no banner:', error);
      }
    };

    checkAISettings();

    // Escutar mudanças nas configurações
    const handleConfigChange = (event: CustomEvent) => {
      setAiEnabled(event.detail.enabled);
    };

    window.addEventListener('aiSuggestionsConfigChanged', handleConfigChange as EventListener);
    
    return () => {
      window.removeEventListener('aiSuggestionsConfigChanged', handleConfigChange as EventListener);
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Generate smart upsell suggestions
  const generateUpsellSuggestions = (): UpsellSuggestion[] => {
    if (cartItems.length === 0) return [];

    const suggestions: UpsellSuggestion[] = [];
    const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const addedProductIds = new Set(cartItems.map(item => item.product.id));
    const addedComplements = new Set<string>();
    
    // Complementos pagos disponíveis
    const paidComplements = [
      { name: 'AMENDOIN', price: 2.00 },
      { name: 'CASTANHA EM BANDA', price: 3.00 },
      { name: 'CEREJA', price: 2.00 },
      { name: 'CHOCOBALL POWER', price: 2.00 },
      { name: 'CREME DE COOKIES', price: 3.00 },
      { name: 'CHOCOLATE COM AVELÃ (NUTELA)', price: 3.00 },
      { name: 'COBERTURA DE CHOCOLATE', price: 2.00 },
      { name: 'GRANOLA', price: 2.00 },
      { name: 'KIWI', price: 3.00 },
      { name: 'LEITE CONDENSADO', price: 2.00 },
      { name: 'MORANGO', price: 3.00 },
      { name: 'PAÇOCA', price: 2.00 }
    ];
    
    // Coletar complementos já adicionados
    cartItems.forEach(item => {
      item.selectedComplements.forEach(comp => {
        addedComplements.add(comp.complement.name.toLowerCase().trim());
      });
    });

    // Size upgrade suggestions (high priority)
    // PRIORITY: Açaí 300g promotion message
    const hasNoAcai300g = !cartItems.some(item => 
      item.product.name.includes('300g') && item.product.category === 'acai'
    );

    if (hasNoAcai300g) {
      const acai300g = availableProducts.find(p => 
        p.name.includes('300g') && p.category === 'acai' && !addedProductIds.has(p.id)
      );
      
      if (acai300g) {
        suggestions.push({
          product: acai300g,
          message: 'O Açaí 300g é um dos mais pedidos do dia! Garanta o seu por apenas R$14,50.',
          trigger: 'social_proof',
          confidence: 0.95
        });
      }
    }

    const smallAcaiItems = cartItems.filter(item => 
      item.product.category === 'acai' && item.product.name.includes('300g')
    );

    if (smallAcaiItems.length > 0) {
      const upgrade500g = availableProducts.find(p => 
        p.name.includes('500g') && p.category === 'acai' && !addedProductIds.has(p.id)
      );
      
      if (upgrade500g) {
        const priceIncrease = upgrade500g.price - smallAcaiItems[0].product.price;
        suggestions.push({
          product: upgrade500g,
          message: `🔥 **87% dos clientes** preferem o tamanho 500g! Mais açaí por apenas +${formatPrice(priceIncrease)}`,
          trigger: 'social_proof',
          confidence: 0.9,
          priceIncrease
        });
      }
    }

    // Combo suggestions for single items
    if (cartItems.length === 1 && !cartItems.some(item => item.product.category === 'combo')) {
      const comboProduct = availableProducts.find(p => 
        p.category === 'combo' && !addedProductIds.has(p.id)
      );
      
      if (comboProduct) {
        suggestions.push({
          product: comboProduct,
          message: `💕 **Combo Casal** - perfeito para compartilhar! Economia garantida vs pedidos separados`,
          trigger: 'value',
          confidence: 0.8
        });
      }
    }

    // Beverage pairing for açaí orders
    if (cartItems.some(item => item.product.category === 'acai') && 
        !cartItems.some(item => item.product.category === 'bebidas')) {
      const beverage = availableProducts.find(p => 
        p.category === 'bebidas' && !addedProductIds.has(p.id)
      );
      
      if (beverage) {
        suggestions.push({
          product: beverage,
          message: `🥤 **${beverage.name}** - a combinação favorita de 73% dos nossos clientes!`,
          trigger: 'social_proof',
          confidence: 0.7
        });
      }
    }

    // Milkshake complement for açaí
    if (cartItems.some(item => item.product.category === 'acai') && 
        !cartItems.some(item => item.product.category === 'milkshake')) {
      const milkshake = availableProducts.find(p => 
        p.category === 'milkshake' && !addedProductIds.has(p.id)
      );
      
      if (milkshake) {
        suggestions.push({
          product: milkshake,
          message: `🥛 Que tal um **milkshake cremoso**? Combinação perfeita com açaí!`,
          trigger: 'affinity',
          confidence: 0.75
        });
      }
    }

    // Sugestões de complementos pagos para açaí
    if (cartItems.some(item => item.product.category === 'acai')) {
      const complementSuggestions = [
        {
          complement: paidComplements.find(c => c.name.includes('PAÇOCA')),
          message: 'Esse copo fica ainda mais gostoso com **paçoca crocante**.',
          trigger: 'affinity' as const
        },
        {
          complement: paidComplements.find(c => c.name.includes('LEITE CONDENSADO')),
          message: 'A maioria completa com **leite condensado extra (+{price})**.',
          trigger: 'social_proof' as const
        },
        {
          complement: paidComplements.find(c => c.name.includes('MORANGO') && !c.name.includes('COBERTURA')),
          message: 'Top escolha junto com esse copo: **morango fresco 🍓**.',
          trigger: 'social_proof' as const
        },
        {
          complement: paidComplements.find(c => c.name.includes('GRANOLA')),
          message: 'Adicione **granola crocante** agora por apenas +{price}.',
          trigger: 'urgency' as const
        }
      ];
      
      complementSuggestions.forEach(({ complement, message, trigger }) => {
        if (complement && !addedComplements.has(complement.name.toLowerCase())) {
          // Criar produto virtual para o complemento
          const virtualProduct: Product = {
            id: `complement-${complement.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: complement.name,
            category: 'complementos',
            price: complement.price,
            description: `Adicional: ${complement.name}`,
            image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
            isActive: true
          };
          
          suggestions.push({
            product: virtualProduct,
            message: message.replace('{price}', formatPrice(complement.price)),
            trigger,
            confidence: 0.85
          });
        }
      });
    }

    // Low cart value upsell
    if (cartTotal < 25) {
      const premiumProduct = availableProducts.find(p => 
        p.price > cartTotal * 0.5 && !addedProductIds.has(p.id) && p.category === 'acai'
      );
      
      if (premiumProduct) {
        suggestions.push({
          product: premiumProduct,
          message: `⚡ **Últimas unidades** do ${premiumProduct.name} - aproveite agora!`,
          trigger: 'urgency',
          confidence: 0.6
        });
      }
    }

    // High value customer - premium suggestions
    if (cartTotal > 40) {
      const premiumOptions = availableProducts.filter(p => 
        p.originalPrice && p.originalPrice > p.price && !addedProductIds.has(p.id)
      );
      
      if (premiumOptions.length > 0) {
        const premiumProduct = premiumOptions[0];
        suggestions.push({
          product: premiumProduct,
          message: `🌟 **Experiência premium** - você merece o melhor! Oferta especial hoje`,
          trigger: 'affinity',
          confidence: 0.85
        });
      }
    }

    return suggestions.slice(0, 2); // Limitar a 2 para melhor experiência
  };

  // Update suggestions when cart changes
  useEffect(() => {
    const suggestions = generateUpsellSuggestions();
    
    if (suggestions.length > 0 && aiEnabled) {
      setCurrentSuggestion(suggestions[0]);
      setIsVisible(true);
      setSuggestionIndex(0);
    } else {
      setIsVisible(false);
      setCurrentSuggestion(null);
    }
  }, [cartItems, availableProducts, aiEnabled]);

  // Rotate suggestions every 8 seconds
  useEffect(() => {
    if (!isVisible || !aiEnabled) return;

    const suggestions = generateUpsellSuggestions();
    if (suggestions.length <= 1) return;

    const interval = setInterval(() => {
      setSuggestionIndex(prev => {
        const nextIndex = (prev + 1) % suggestions.length;
        setCurrentSuggestion(suggestions[nextIndex]);
        return nextIndex;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [isVisible, cartItems, aiEnabled]);

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'social_proof':
        return <Users size={18} className="text-blue-600" />;
      case 'urgency':
        return <Clock size={18} className="text-orange-600" />;
      case 'affinity':
        return <TrendingUp size={18} className="text-green-600" />;
      case 'value':
        return <Zap size={18} className="text-purple-600" />;
      default:
        return <Sparkles size={18} className="text-pink-600" />;
    }
  };

  const getTriggerGradient = (trigger: string) => {
    switch (trigger) {
      case 'social_proof':
        return 'from-blue-500 to-indigo-500';
      case 'urgency':
        return 'from-orange-500 to-red-500';
      case 'affinity':
        return 'from-green-500 to-emerald-500';
      case 'value':
        return 'from-purple-500 to-violet-500';
      default:
        return 'from-pink-500 to-rose-500';
    }
  };

  if (!isVisible || !currentSuggestion || !aiEnabled) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-lg ${className}`}>
      <div className={`bg-gradient-to-r ${getTriggerGradient(currentSuggestion.trigger)} p-4 text-white`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-white/20 to-transparent rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                {getTriggerIcon(currentSuggestion.trigger)}
              </div>
              <div>
                <h3 className="font-bold text-lg">🤖 Assistente IA</h3>
                <p className="text-white/80 text-sm">Sugestão personalizada para você</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={currentSuggestion.product.image}
              alt={currentSuggestion.product.name}
              className="w-16 h-16 object-cover rounded-xl shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400';
              }}
            />
            
            <div className="flex-1">
              <div 
                className="text-white font-medium mb-2"
                dangerouslySetInnerHTML={{ 
                  __html: currentSuggestion.message.replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-200">$1</strong>')
                }}
              />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{currentSuggestion.product.name}</p>
                  <p className="text-white/80 text-sm">
                    {currentSuggestion.priceIncrease 
                      ? `+${formatPrice(currentSuggestion.priceIncrease)}` 
                      : formatPrice(currentSuggestion.product.price)
                    }
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    onProductSelect(currentSuggestion.product);
                    setIsVisible(false);
                    
                    // Show success feedback
                    const successMessage = document.createElement('div');
                    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
                    successMessage.innerHTML = `
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      🤖 Sugestão da IA adicionada!
                    `;
                    document.body.appendChild(successMessage);
                    
                    setTimeout(() => {
                      if (document.body.contains(successMessage)) {
                        document.body.removeChild(successMessage);
                      }
                    }, 3000);
                  }}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Sparkles size={16} />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Confidence indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-white/20 rounded-full h-1">
              <div 
                className="bg-white rounded-full h-1 transition-all duration-1000"
                style={{ width: `${currentSuggestion.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-white/80 text-xs font-medium">
              {Math.round(currentSuggestion.confidence * 100)}% match
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartUpsellBanner;