import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Save, X, Eye, EyeOff, Shield, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AttendanceUser {
  id: string;
  username: string;
  name: string;
  role: string;
  is_active: boolean;
  permissions: {
    can_chat: boolean;
    can_view_orders: boolean;
    can_print_orders: boolean;
    can_update_status: boolean;
    can_create_manual_orders: boolean;
    can_view_tables: boolean;
    can_view_history: boolean;
    can_view_cash_balance: boolean;
  };
  created_at: string;
  last_login?: string;
}

interface UserFormData {
  username: string;
  name: string;
  password: string;
  role: string;
  is_active: boolean;
  permissions: {
    can_chat: boolean;
    can_view_orders: boolean;
    can_print_orders: boolean;
    can_update_status: boolean;
    can_create_manual_orders: boolean;
    can_view_tables: boolean;
    can_view_history: boolean;
    can_view_cash_balance: boolean;
  };
}

const AttendanceUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<AttendanceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AttendanceUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    name: '',
    password: '',
    role: 'attendant',
    is_active: true,
    permissions: {
      can_chat: true,
      can_view_orders: true,
      can_print_orders: true,
      can_update_status: true,
      can_create_manual_orders: false,
      can_view_tables: false,
      can_view_history: false
    }
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      password: '',
      role: 'attendant',
      is_active: true,
      permissions: {
        can_chat: true,
        can_view_orders: true,
        can_print_orders: true,
        can_update_status: true,
        can_create_manual_orders: false,
        can_view_tables: false,
        can_view_history: false,
        can_view_expected_balance: false,
        can_view_cash_balance: true,
        can_view_cash_details: false,
        can_view_sales_totals: false,
        can_view_cash_entries: false
      }
    });
    setEditingUser(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (user: AttendanceUser) => {
    setFormData({
      username: user.username,
      name: user.name,
      password: '',
      role: user.role,
      is_active: user.is_active,
      permissions: user.permissions
    });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.name.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          username: formData.username,
          name: formData.name,
          role: formData.role,
          is_active: formData.is_active,
          permissions: formData.permissions
        };

        // Only include password if it's provided
        if (formData.password.trim()) {
          updateData.password_hash = formData.password;
        }

        const { error } = await supabase
          .from('attendance_users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        // Create new user
        if (!formData.password.trim()) {
          alert('Senha é obrigatória para novos usuários');
          return;
        }

        const { error } = await supabase
          .from('attendance_users')
          .insert({
            username: formData.username,
            name: formData.name,
            password_hash: formData.password,
            role: formData.role,
            is_active: formData.is_active,
            permissions: formData.permissions
          });

        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      loadUsers();
      alert(`Usuário ${editingUser ? 'atualizado' : 'criado'} com sucesso!`);
      
      // Disparar evento para sincronizar usuários no sistema de atendimento
      try {
        const event = new CustomEvent('refreshAttendanceUsers');
        window.dispatchEvent(event);
        console.log('🔄 Sincronização de usuários disparada após criar/editar');
      } catch (err) {
        console.warn('⚠️ Erro ao disparar sincronização:', err);
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário. Tente novamente.');
    }
  };

  const handleDelete = async (user: AttendanceUser) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance_users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;
      
      loadUsers();
      alert('Usuário excluído com sucesso!');
      
      // Disparar evento para sincronizar usuários no sistema de atendimento
      try {
        const event = new CustomEvent('refreshAttendanceUsers');
        window.dispatchEvent(event);
        console.log('🔄 Sincronização de usuários disparada após excluir');
      } catch (err) {
        console.warn('⚠️ Erro ao disparar sincronização:', err);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-blue-600" />
            Usuários do Atendimento
          </h2>
          <p className="text-gray-600">Gerencie usuários e permissões para o sistema de atendimento</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Usuários Cadastrados ({users.length})
          </h3>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhum usuário cadastrado
            </h3>
            <p className="text-gray-500 mb-4">
              Clique em "Novo Usuário" para adicionar o primeiro usuário
            </p>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Criar Primeiro Usuário
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-800">{user.name}</h4>
                      <span className="text-sm text-gray-500">@{user.username}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {user.role === 'admin' ? 'Administrador' : 'Atendente'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(user.permissions).map(([key, value]) => (
                        value && (
                          <span key={key} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {key.replace('can_', '').replace('_', ' ')}
                          </span>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
                    >
                      <Edit size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome de Usuário *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: joao.silva"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha {editingUser ? '(deixe em branco para manter)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite a senha"
                    required={!editingUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="attendant">Atendente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Usuário ativo
                  </span>
                </label>
              </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.permissions.can_view_cash_balance}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, can_view_cash_balance: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Visualizar saldos de caixa</span>
                </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_cash_details}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_cash_details: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Ver detalhes completos do caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_sales_totals}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_sales_totals: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar totais de vendas</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_cash_entries}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_cash_entries: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar movimentações de caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_expected_balance}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_expected_balance: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar saldo esperado</span>
                  </label>

              {/* Permissions */}
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-blue-600" />
                  Permissões
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_orders}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_orders: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar pedidos</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_chat}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_chat: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Chat com clientes</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_update_status}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_update_status: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Atualizar status</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_print_orders}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_print_orders: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Imprimir pedidos</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_create_manual_orders}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_create_manual_orders: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Criar pedidos manuais</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_tables}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_tables: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar mesas</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_history}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_history: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar histórico</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_expected_balance}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_expected_balance: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar saldo esperado</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_cash_register}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_cash_register: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_open_cash_register}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_open_cash_register: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Abrir caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_close_cash_register}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_close_cash_register: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Fechar caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_manage_cash_entries}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_manage_cash_entries: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Gerenciar movimentações de caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_add_cash_entries}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_add_cash_entries: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Adicionar movimentações de caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_edit_cash_entries}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_edit_cash_entries: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Editar movimentações de caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_delete_cash_entries}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_delete_cash_entries: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Excluir movimentações de caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_cancel_cash_entries}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_cancel_cash_entries: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Cancelar movimentações de caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_reports}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_reports: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar relatórios</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_cash_report}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_cash_report: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Relatório de caixa</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_sales_report}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_sales_report: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Relatório de vendas</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_manage_products}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_manage_products: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Gerenciar produtos</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_operators}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_operators: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar operadores</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_view_attendance}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_attendance: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visualizar atendimento</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_manage_settings}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_manage_settings: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Gerenciar configurações</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_use_scale}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_use_scale: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Usar balança</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_discount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_discount: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Aplicar descontos</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.can_cancel}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_cancel: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Cancelar vendas</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceUsersPanel;