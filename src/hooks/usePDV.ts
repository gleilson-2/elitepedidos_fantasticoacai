import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PDVProduct, PDVSale, PDVSaleItem, PDVOperator, PDVCartItem } from '../types/pdv';

// Helper function to get a valid operator ID
const getValidOperatorId = async (providedOperatorId?: string): Promise<string> => {
  try {
    // If no operator ID provided, try to find any active operator
    if (!providedOperatorId) {
      const { data: operators, error } = await supabase
        .from('pdv_operators')
        .select('id')
        .eq('is_active', true)
        .limit(1);
      
      if (error) throw error;
      
      if (operators && operators.length > 0) {
        return operators[0].id;
      }
      
      throw new Error('Nenhum operador ativo encontrado');
    }
    
    // Validate the provided operator ID exists
    const { data: operator, error } = await supabase
      .from('pdv_operators')
      .select('id')
      .eq('id', providedOperatorId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error || !operator) {
      // If provided ID is invalid, try to find an admin operator
      const { data: adminOperator, error: adminError } = await supabase
        .from('pdv_operators')
        .select('id')
        .eq('is_active', true)
        .ilike('name', '%admin%')
        .limit(1);
      
      if (!adminError && adminOperator && adminOperator.length > 0) {
        return adminOperator[0].id;
      }
      
      // Last resort: get any active operator
      const { data: anyOperator, error: anyError } = await supabase
        .from('pdv_operators')
        .select('id')
        .eq('is_active', true)
        .limit(1);
      
      if (!anyError && anyOperator && anyOperator.length > 0) {
        return anyOperator[0].id;
      }
      
      throw new Error('Nenhum operador válido encontrado no sistema');
    }
    
    return operator.id;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Erro ao validar operador');
  }
};

export const usePDVProducts = () => {
  const [products, setProducts] = useState<PDVProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando produtos de demonstração');
        
        // Produtos de demonstração para quando Supabase não estiver configurado
        const demoProducts: PDVProduct[] = [
          {
            id: 'demo-acai-300',
            code: 'ACAI300',
            name: 'Açaí 300ml',
            category: 'acai',
            is_weighable: false,
            unit_price: 15.90,
            price_per_gram: undefined,
            image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
            stock_quantity: 100,
            min_stock: 10,
            is_active: true,
            barcode: '',
            description: 'Açaí tradicional 300ml',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-acai-500',
            code: 'ACAI500',
            name: 'Açaí 500ml',
            category: 'acai',
            is_weighable: false,
            unit_price: 22.90,
            price_per_gram: undefined,
            image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
            stock_quantity: 100,
            min_stock: 10,
            is_active: true,
            barcode: '',
            description: 'Açaí tradicional 500ml',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-acai-1kg',
            code: 'ACAI1KG',
            name: 'Açaí 1kg (Pesável)',
            category: 'acai',
            is_weighable: true,
            unit_price: undefined,
            price_per_gram: 0.04499,
            image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
            stock_quantity: 50,
            min_stock: 5,
            is_active: true,
            barcode: '',
            description: 'Açaí tradicional vendido por peso',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setProducts(demoProducts);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('pdv_products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      let errorMessage = 'Erro ao carregar produtos';
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        errorMessage = 'Erro de conexão: Não foi possível conectar ao banco de dados. Verifique sua conexão de rede.';
        console.warn('⚠️ Erro de conexão ao carregar produtos - usando produtos de demonstração');
        
        // Use demo products when connection fails
        const demoProducts: PDVProduct[] = [
          {
            id: 'demo-acai-300',
            code: 'ACAI300',
            name: 'Açaí 300ml',
            category: 'acai',
            is_weighable: false,
            unit_price: 15.90,
            price_per_gram: undefined,
            image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
            stock_quantity: 100,
            min_stock: 10,
            is_active: true,
            barcode: '',
            description: 'Açaí tradicional 300ml',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-acai-500',
            code: 'ACAI500',
            name: 'Açaí 500ml',
            category: 'acai',
            is_weighable: false,
            unit_price: 22.90,
            price_per_gram: undefined,
            image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
            stock_quantity: 100,
            min_stock: 10,
            is_active: true,
            barcode: '',
            description: 'Açaí tradicional 500ml',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setProducts(demoProducts);
        setLoading(false);
        return;
      } else {
        errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      }
      
      console.error('Erro ao carregar produtos:', errorMessage);
      setError(errorMessage);
      
      // Set empty products array on non-connection errors
      if (!(err instanceof TypeError && err.message === 'Failed to fetch')) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (product: Omit<PDVProduct, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }
      
      console.log('🚀 Iniciando criação do produto:', product);
      
      // Remover o ID se estiver presente (pode acontecer se o objeto for passado completo)
      const { id, created_at, updated_at, ...productData } = product as any;
      
      const { data, error } = await supabase
        .from('pdv_products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => [...prev, data]);
      console.log('✅ Produto criado com sucesso:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar produto:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar produto');
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<PDVProduct>) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        // Demo mode - update local state
        const existingProduct = products.find(p => p.id === id);
        
        if (!existingProduct) {
          // Create a simulated product if not found in demo mode
          const simulatedProduct: PDVProduct = {
            id,
            code: updates.code || 'DEMO' + Date.now(),
            name: updates.name || 'Produto Demo',
            category: updates.category || 'outros',
            is_weighable: updates.is_weighable || false,
            unit_price: updates.unit_price || 0,
            price_per_gram: updates.price_per_gram || undefined,
            image_url: updates.image_url || '',
            stock_quantity: updates.stock_quantity || 0,
            min_stock: updates.min_stock || 0,
            is_active: updates.is_active !== undefined ? updates.is_active : true,
            barcode: updates.barcode || '',
            description: updates.description || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            display_order: updates.display_order || 1
          };
          
          setProducts(prev => [...prev, simulatedProduct]);
          return simulatedProduct;
        }
        
        const updatedProduct = { ...existingProduct, ...updates };
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
        return updatedProduct;
      }
      
      // First, check if the product exists
      const { data: existingProduct, error: fetchError } = await supabase
        .from('pdv_products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Erro ao buscar produto: ${fetchError.message}`);
      }
      
      if (!existingProduct) {
        throw new Error('Produto não encontrado');
      }

      // Remove properties that don't exist in pdv_products table schema
      const {
        complement_groups,
        sizes,
        availability,
        scheduledDays,
        original_price,
        image,
        has_complements,
       price,
        ...validUpdates
      } = updates as any;
      
      // Check if there are any actual changes to make
      const hasChanges = Object.keys(validUpdates).some(key => {
        return existingProduct[key] !== validUpdates[key];
      });

      // If no changes are needed, return the existing product
      if (!hasChanges) {
        setProducts(prev => prev.map(p => p.id === id ? existingProduct : p));
        return existingProduct;
      }

      const { data, error } = await supabase
        .from('pdv_products')
        .update(validUpdates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        // If update returns no rows but product exists, return existing product
        setProducts(prev => prev.map(p => p.id === id ? existingProduct : p));
        return existingProduct;
      }
      
      const updatedProduct = data[0];
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar produto');
    }
  }, [products, setProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        // Demo mode - remove from local state
        setProducts(prev => prev.filter(p => p.id !== id));
        return;
      }
      
      const { error } = await supabase
        .from('pdv_products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir produto');
    }
  }, [setProducts]);

  const searchProducts = useCallback((query: string) => {
    if (!query.trim()) return products;
    
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.code.toLowerCase().includes(searchTerm) ||
      product.barcode?.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }, [products]);

  const getActiveProducts = useCallback(() => {
    return products.filter(product => product.is_active);
  }, [products]);
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getActiveProducts,
    refetch: fetchProducts
  };
};

export const usePDVSales = () => {
  const [sales, setSales] = useState<PDVSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSale = useCallback(async (
    saleData: Omit<PDVSale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>,
    items: Omit<PDVSaleItem, 'id' | 'sale_id' | 'created_at'>[],
    debug: boolean = false,
    useRpc: boolean = true
  ) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }
      
      setLoading(true);

      // Get a valid operator ID before creating the sale
      const validOperatorId = await getValidOperatorId(saleData.operator_id);

      // Set channel to pdv if not specified
      const saleWithChannel = {
        ...saleData,
        channel: saleData.channel || 'pdv',
        operator_id: validOperatorId
      };
      
      if (debug) {
        console.log('🔍 Sale data:', saleWithChannel);
        console.log('🔍 Sale items:', items);
      }
      
      let sale;
      let saleError;
      
      if (useRpc) {
        // Use RPC function to process sale
        const { data, error } = await supabase.rpc('process_pdv_sale', {
          sale_data: saleWithChannel,
          items_data: items
        });
        
        if (error) {
          console.error('❌ Error using RPC:', error);
          throw new Error(`Error using RPC: ${error.message}`);
        }
        
        if (!data.success) {
          console.error('❌ RPC returned error:', data.error);
          throw new Error(data.error || 'Unknown error processing sale');
        }
        
        sale = data;
      } else {
        // Fallback to direct insert
        const result = await supabase
          .from('pdv_sales')
          .insert([saleWithChannel])
          .select()
          .single();
          
        sale = result.data;
        saleError = result.error;

        if (saleError) {
          console.error('❌ Error creating sale:', saleError);
          throw new Error(`Error creating sale: ${saleError.message}`);
        }
        
        if (debug) {
          console.log('✅ Sale created:', sale);
        }

        // Criar itens da venda
        const saleItems = items.map(item => ({
          ...item,
          sale_id: sale.id
        }));

        const { error: itemsError } = await supabase
          .from('pdv_sale_items')
          .insert(saleItems);

        if (itemsError) {
          console.error('❌ Error creating sale items:', itemsError);
          
          // Attempt to delete the sale to avoid orphaned records
          try {
            await supabase.from('pdv_sales').delete().eq('id', sale.id);
            console.log('🗑️ Orphaned sale deleted after items error');
          } catch (cleanupError) {
            console.error('⚠️ Failed to clean up orphaned sale:', cleanupError);
          }
          
          throw new Error(`Error creating sale items: ${itemsError.message}`);
        }
      }

      setSales(prev => [sale, ...prev]);
      return sale;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar venda';
      console.error('❌ Sale creation failed:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSale = useCallback(async (saleId: string, reason: string, operatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('pdv_sales')
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: operatorId,
          cancel_reason: reason
        })
        .eq('id', saleId)
        .select()
        .single();

      if (error) throw error;
      
      setSales(prev => prev.map(s => s.id === saleId ? data : s));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao cancelar venda');
    }
  }, []);

  const fetchSales = useCallback(async (limit = 50) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pdv_sales')
        .select(`
          *,
          pdv_sale_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sales,
    loading,
    error,
    createSale,
    cancelSale,
    fetchSales
  };
};

export const usePDVCart = () => {
  const [items, setItems] = useState<PDVCartItem[]>([]);
  const [discount, setDiscount] = useState({ type: 'none' as 'none' | 'percentage' | 'amount', value: 0 });
  const [paymentInfo, setPaymentInfo] = useState<{
    method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto';
    changeFor?: number;
    customerName?: string;
    customerPhone?: string;
  }>({
    method: 'dinheiro'
  });
  const [splitInfo, setSplitInfo] = useState<{
    enabled: boolean;
    parts: number;
    amounts: number[];
  }>({
    enabled: false,
    parts: 2,
    amounts: []
  });

  const addItem = useCallback((product: PDVProduct, quantity: number = 1, weight?: number) => {
    // Para produtos pesáveis, sempre adicionar como novo item (não agrupar)
    // Para produtos unitários, agrupar se for o mesmo produto
    const existingIndex = product.is_weighable ? -1 : items.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      // Atualizar item existente
      setItems(prev => prev.map((item, index) => {
        if (index === existingIndex) {
          const newQuantity = item.quantity + quantity;
          const newWeight = item.weight; // Manter peso original para produtos unitários
          return {
            ...item,
            quantity: newQuantity,
            weight: newWeight, 
            subtotal: calculateItemSubtotal(item.product, newQuantity, newWeight, item.discount)
          };
        }
        return item;
      }));
    } else {
      // Adicionar novo item
      const newItem: PDVCartItem = {
        id: `${product.id}-${Date.now()}-${Math.random()}`, // ID único para cada item
        product,
        quantity,
        weight,
        discount: 0,
        subtotal: calculateItemSubtotal(product, quantity, weight, 0)
      };
      setItems(prev => [...prev, newItem]);
    }
  }, [items]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity,
          subtotal: calculateItemSubtotal(item.product, quantity, item.weight, item.discount)
        };
      }
      return item;
    }));
  }, [removeItem]);

  const updateItemWeight = useCallback((productId: string, weight: number) => {
    setItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          weight,
          subtotal: calculateItemSubtotal(item.product, item.quantity, weight, item.discount)
        };
      }
      return item;
    }));
  }, []);

  const applyItemDiscount = useCallback((productId: string, discount: number) => {
    setItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          discount,
          subtotal: calculateItemSubtotal(item.product, item.quantity, item.weight, discount)
        };
      }
      return item;
    }));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount({ type: 'none', value: 0 });
    setPaymentInfo({ method: 'dinheiro' });
    setSplitInfo({ enabled: false, parts: 2, amounts: [] });
  }, []);

  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }, [items]);

  const getDiscountAmount = useCallback(() => {
    const subtotal = getSubtotal();
    if (discount.type === 'percentage') {
      return subtotal * (discount.value / 100);
    } else if (discount.type === 'amount') {
      return Math.min(discount.value, subtotal);
    }
    return 0;
  }, [getSubtotal, discount]);

  const getTotal = useCallback(() => {
    return Math.max(0, getSubtotal() - getDiscountAmount());
  }, [getSubtotal, getDiscountAmount]);

  const updatePaymentInfo = useCallback((info: Partial<typeof paymentInfo>) => {
    setPaymentInfo(prev => ({ ...prev, ...info }));
  }, []);

  const updateSplitInfo = useCallback((info: Partial<typeof splitInfo>) => {
    setSplitInfo(prev => ({ ...prev, ...info }));
  }, []);
  return {
    items,
    discount,
    paymentInfo,
    splitInfo,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemWeight,
    applyItemDiscount,
    setDiscount,
    updatePaymentInfo,
    updateSplitInfo,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    itemCount: items.length,
    totalItems: items.reduce((total, item) => total + item.quantity, 0)
  };
};

// Função auxiliar para calcular subtotal do item
const calculateItemSubtotal = (
  product: PDVProduct, 
  quantity: number, 
  weight?: number, 
  discount: number = 0
): number => {
  let basePrice = 0;
  
  if (product.is_weighable && weight && product.price_per_gram) {
    basePrice = weight * 1000 * product.price_per_gram; // peso em kg * 1000 * preço por grama
  } else if (!product.is_weighable && product.unit_price) {
    basePrice = quantity * product.unit_price;
  }
  
  return Math.max(0, basePrice - discount);
};