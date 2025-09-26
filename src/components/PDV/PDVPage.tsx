import React, { useState } from 'react';
import PDVLogin from './PDVLogin';
import PDVMain from './PDVMain';
import { PDVOperator } from '../../types/pdv';

const PDVPage: React.FC = () => {
  const [operator, setOperator] = useState<PDVOperator | null>(() => {
    // Tentar recuperar operador do localStorage
    try {
      const savedOperator = localStorage.getItem('pdv_operator');
      if (savedOperator) {
        const parsed = JSON.parse(savedOperator);
        console.log('🔍 PDV - Operador recuperado do localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao recuperar operador do localStorage:', error);
      localStorage.removeItem('pdv_operator');
    }
    return null;
  });

  // Credenciais padrão do sistema
  const DEFAULT_CREDENTIALS = {
    code: 'ADMIN',
    password: 'elite2024'
  };

  // Operador padrão
  const DEFAULT_OPERATOR: PDVOperator = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Administrador',
    code: 'ADMIN',
    password_hash: 'elite2024',
    is_active: true,
    role: 'admin',
    permissions: {
      can_cancel: true,
      can_discount: true,
      can_use_scale: true,
      can_view_sales: true,
      can_view_orders: true,
      can_view_reports: true,
      can_view_products: true,
      can_view_operators: true,
      can_manage_products: true,
      can_manage_settings: true,
      can_view_attendance: true,
      can_view_cash_report: true,
      can_view_sales_report: true,
      can_view_cash_register: true,
      can_view_tables: true,
      can_view_history: true,
      can_view_expected_balance: true,
      can_edit_orders: true,
      can_delete_orders: true,
      can_cancel_orders: true,
      can_manage_cash_entries: true,
      can_edit_sales: true,
      can_delete_sales: true,
      can_edit_cash_entries: true,
      can_delete_cash_entries: true,
      can_cancel_cash_entries: true,
      can_view_cash_balance: true,
      can_view_cash_details: true,
      can_view_sales_totals: true,
      can_view_cash_entries: true
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  };

  const handleLogin = (code: string, password: string): boolean => {
    console.log('🔐 PDV Login attempt:', { code, password: password ? '***' : 'empty' });
    
    // Verificar credenciais padrão
    if (code.toUpperCase() === DEFAULT_CREDENTIALS.code && password === DEFAULT_CREDENTIALS.password) {
      console.log('✅ PDV Login successful with default credentials');
      
      const operatorData = {
        ...DEFAULT_OPERATOR,
        last_login: new Date().toISOString()
      };
      
      setOperator(operatorData);
      
      // Salvar no localStorage
      localStorage.setItem('pdv_operator', JSON.stringify(operatorData));
      
      console.log('💾 Operador salvo no localStorage:', operatorData);
      return true;
    }
    
    console.log('❌ PDV Login failed - invalid credentials');
    return false;
  };

  const handleLogout = () => {
    console.log('🚪 PDV Logout');
    setOperator(null);
    localStorage.removeItem('pdv_operator');
  };

  // Se operador está logado, mostrar sistema PDV
  if (operator) {
    return <PDVMain operator={operator} onLogout={handleLogout} />;
  }

  // Se não está logado, mostrar tela de login
  return <PDVLogin onLogin={handleLogin} />;
};

export default PDVPage;