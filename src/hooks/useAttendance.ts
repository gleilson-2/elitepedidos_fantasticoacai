import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface AttendanceUser {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: 'attendant' | 'admin';
  is_active: boolean;
  permissions: {
    can_chat: boolean;
    can_view_orders: boolean;
    can_print_orders: boolean;
    can_update_status: boolean;
    can_create_manual_orders: boolean;
    can_view_cash_register: boolean;
    can_view_sales: boolean;
    can_view_reports: boolean;
    can_view_cash_report: boolean;
    can_view_sales_report: boolean;
    can_manage_products: boolean;
    can_view_operators: boolean;
    can_view_attendance: boolean;
    can_manage_settings: boolean;
    can_use_scale: boolean;
    can_discount: boolean;
    can_cancel: boolean;
    can_view_expected_balance: boolean;
    can_edit_orders: boolean;
    can_delete_orders: boolean;
    can_cancel_orders: boolean;
    can_manage_cash_entries: boolean;
    can_edit_sales: boolean;
    can_delete_sales: boolean;
    can_edit_cash_entries: boolean;
    can_delete_cash_entries: boolean;
    can_cancel_cash_entries: boolean;
  };
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface AttendanceSession {
  isAuthenticated: boolean;
  user?: AttendanceUser;
}

export const useAttendance = () => {
  const [session, setSession] = useState<AttendanceSession>(() => {
    try {
      const storedSession = localStorage.getItem('attendance_session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        console.log('🔍 useAttendance - Sessão recuperada do localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      localStorage.removeItem('attendance_session');
    }
    return { isAuthenticated: false };
  });

  const [users, setUsers] = useState<AttendanceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credenciais padrão
  const FALLBACK_CREDENTIALS = {
    username: 'admin',
    password: 'elite2024'
  };

  // Usuários padrão
  const DEFAULT_USERS: AttendanceUser[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'admin',
      password_hash: 'elite2024',
      name: 'Administrador',
      role: 'admin',
      is_active: true,
      permissions: {
        can_chat: true,
        can_view_orders: true,
        can_print_orders: true,
        can_update_status: true,
        can_create_manual_orders: true,
        can_view_cash_register: true,
        can_view_sales: true,
        can_view_reports: true,
        can_view_cash_report: true,
        can_view_sales_report: true,
        can_manage_products: true,
        can_view_operators: true,
        can_view_attendance: true,
        can_manage_settings: true,
        can_use_scale: true,
        can_discount: true,
        can_cancel: true,
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
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      username: 'sarahsantos',
      password_hash: 'elite2024',
      name: 'Sarah Santos',
      role: 'attendant',
      is_active: true,
      permissions: {
        can_chat: true,
        can_view_orders: true,
        can_print_orders: true,
        can_update_status: true,
        can_create_manual_orders: true,
        can_view_cash_register: true,
        can_view_sales: true,
        can_view_reports: true,
        can_view_cash_report: true,
        can_view_sales_report: true,
        can_manage_products: true,
        can_view_operators: true,
        can_view_attendance: true,
        can_manage_settings: true,
        can_use_scale: true,
        can_discount: true,
        can_cancel: true,
        can_view_expected_balance: true,
        can_edit_orders: true,
        can_delete_orders: true,
        can_cancel_orders: true,
        can_manage_cash_entries: true,
        can_edit_sales: true,
        can_delete_sales: true,
        can_edit_cash_entries: true,
        can_delete_cash_entries: true,
        can_cancel_cash_entries: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      username: 'kevelly',
      password_hash: 'elite2024',
      name: 'Kevelly',
      role: 'attendant',
      is_active: true,
      permissions: {
        can_chat: true,
        can_view_orders: true,
        can_print_orders: true,
        can_update_status: true,
        can_create_manual_orders: true,
        can_view_cash_register: true,
        can_view_sales: true,
        can_view_reports: true,
        can_view_cash_report: true,
        can_view_sales_report: true,
        can_manage_products: true,
        can_view_operators: true,
        can_view_attendance: true,
        can_manage_settings: true,
        can_use_scale: true,
        can_discount: true,
        can_cancel: true,
        can_view_expected_balance: true,
        can_edit_orders: true,
        can_delete_orders: true,
        can_cancel_orders: true,
        can_manage_cash_entries: true,
        can_edit_sales: true,
        can_delete_sales: true,
        can_edit_cash_entries: true,
        can_delete_cash_entries: true,
        can_cancel_cash_entries: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Carregar usuários
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const isSupabaseConfigured = supabaseUrl && supabaseKey && 
                                  supabaseUrl !== 'your_supabase_url_here' && 
                                  supabaseKey !== 'your_supabase_anon_key_here' &&
                                  !supabaseUrl.includes('placeholder');

      if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando localStorage');
        loadUsersFromLocalStorage();
        return;
      }

      // Verificar se já existem usuários no banco antes de tentar criar
      console.log('🔍 Verificando se usuários já existem no banco...');
      const { data: existingUsers, error: checkError } = await supabase
        .from('attendance_users')
        .select('id, username, name')
        .limit(1);

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('⚠️ Erro ao verificar usuários existentes:', checkError);
        if (checkError.message?.includes('Failed to fetch')) {
          console.warn('🌐 Erro de conectividade - usando localStorage');
        }
        loadUsersFromLocalStorage();
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log('ℹ️ Usuários já existem no banco, carregando...');
        const { data: allUsers, error: loadError } = await supabase
          .from('attendance_users')
          .select('*')
          .order('name');

        if (loadError) {
          console.error('❌ Erro ao carregar usuários existentes:', loadError);
          if (loadError.message?.includes('Failed to fetch')) {
            console.warn('🌐 Erro de conectividade - usando localStorage');
          }
          loadUsersFromLocalStorage();
          return;
        }

        setUsers(allUsers || []);
        if (allUsers && allUsers.length > 0) {
          localStorage.setItem('attendance_users', JSON.stringify(allUsers));
        }
        return;
      }

      console.log('🔄 Carregando usuários de atendimento do banco...');

      const { data, error } = await supabase
        .from('attendance_users')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        
        // Se é erro de rede (Failed to fetch), usar localStorage
        if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
          console.warn('🌐 Erro de conectividade - usando localStorage');
          loadUsersFromLocalStorage();
          return;
        }
        
        // Para outros erros, tentar criar usuários padrão
        if (error.code === 'PGRST116' || !data || data.length === 0) {
          console.log('📝 Criando usuários padrão no banco...');
          await createDefaultUsersInDatabase();
        } else {
          loadUsersFromLocalStorage();
        }
        return;
      }

      if (!data || data.length === 0) {
        console.log('📝 Nenhum usuário encontrado, criando usuários padrão...');
        await createDefaultUsersInDatabase();
        return;
      }

      console.log(`✅ ${data?.length || 0} usuários carregados do banco`);
      setUsers(data || []);

      // Salvar backup no localStorage
      if (data && data.length > 0) {
        localStorage.setItem('attendance_users', JSON.stringify(data));
      }

    } catch (err) {
      console.error('❌ Erro ao carregar usuários:', err);
      
      // Se é erro de rede, usar localStorage
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('fetch'))) {
        console.warn('🌐 Erro de conectividade - usando localStorage');
        loadUsersFromLocalStorage();
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      // Em caso de erro, tentar criar usuários padrão
      await createDefaultUsersInDatabase();
    } finally {
      setLoading(false);
    }
  };

  // Criar usuários padrão no banco de dados
  const createDefaultUsersInDatabase = async () => {
    try {
      console.log('📝 Inserindo usuários padrão no banco...');
      
      // Verificar quais usuários já existem com tratamento de erro
      const { data: existingUsers, error: existingError } = await supabase
        .from('attendance_users')
        .select('id, username, name');
      
      if (existingError) {
        console.error('❌ Erro ao verificar usuários existentes:', existingError);
        if (existingError.message?.includes('Failed to fetch')) {
          console.warn('🌐 Erro de conectividade - usando localStorage');
          loadUsersFromLocalStorage();
          return;
        }
        throw existingError;
      }
      
      const existingUsernames = existingUsers?.map(u => u.username) || [];
      console.log('👥 Usuários existentes:', existingUsernames);
      
      // Se não existem usuários, criar todos os padrão
      // Se existem, atualizar permissões dos usuários existentes
      if (existingUsernames.length === 0) {
        console.log('📝 Criando todos os usuários padrão...');
        const { data, error } = await supabase
          .from('attendance_users')
          .insert(DEFAULT_USERS)
          .select();
        
        if (error) throw error;
        console.log('✅ Usuários padrão criados:', data?.length);
      } else {
        console.log('🔄 Atualizando permissões dos usuários existentes...');
        
        // FORÇAR atualização das permissões para Sarah Santos e Kevelly
        for (const defaultUser of DEFAULT_USERS) {
          if (existingUsernames.includes(defaultUser.username)) {
            console.log(`🔄 FORÇANDO atualização de permissões para ${defaultUser.username}...`);
            console.log(`📋 Permissões que serão aplicadas:`, defaultUser.permissions);
            
            const { error: updateError } = await supabase
              .from('attendance_users')
              .update({
                permissions: defaultUser.permissions,
                role: defaultUser.role,
                is_active: defaultUser.is_active,
                updated_at: new Date().toISOString()
              })
              .eq('username', defaultUser.username);
            
            if (updateError) {
              console.error(`❌ Erro ao atualizar ${defaultUser.username}:`, updateError);
            } else {
              console.log(`✅ Permissões atualizadas para ${defaultUser.username}`);
              
              // Verificar se a atualização foi aplicada
              const { data: verifyData, error: verifyError } = await supabase
                .from('attendance_users')
                .select('username, permissions')
                .eq('username', defaultUser.username)
                .single();
              
              if (!verifyError && verifyData) {
                console.log(`✅ VERIFICAÇÃO - Permissões salvas para ${verifyData.username}:`, verifyData.permissions);
              }
            }
          }
        }
        
        // Criar usuários que não existem
        const usersToCreate = DEFAULT_USERS.filter(user => 
          !existingUsernames.includes(user.username)
        );
        
        if (usersToCreate.length > 0) {
          console.log(`📝 Criando ${usersToCreate.length} novos usuários...`);
          const { data, error } = await supabase
            .from('attendance_users')
            .insert(usersToCreate)
            .select();
          
          if (error) throw error;
          console.log('✅ Novos usuários criados:', data?.length);
        }
      }
      
      // Carregar todos os usuários após criação
      const { data: allUsers, error: finalLoadError } = await supabase
        .from('attendance_users')
        .select('*')
        .order('name');
      
      if (finalLoadError) {
        console.error('❌ Erro ao carregar usuários após criação:', finalLoadError);
        loadUsersFromLocalStorage();
        return;
      }
      
      setUsers(allUsers || DEFAULT_USERS);
      
      // Salvar backup no localStorage
      if (allUsers) {
        localStorage.setItem('attendance_users', JSON.stringify(allUsers));
      }
      
    } catch (err) {
      console.error('❌ Erro ao criar usuários padrão no banco:', err);
      
      // Se é erro de rede, usar localStorage
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('fetch'))) {
        console.warn('🌐 Erro de conectividade - usando localStorage');
      }
      
      loadUsersFromLocalStorage();
    }
  };

  // Carregar usuários do localStorage
  const loadUsersFromLocalStorage = () => {
    try {
      const savedUsers = localStorage.getItem('attendance_users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        console.log('✅ Usuários carregados do localStorage:', parsedUsers.length);
        setUsers(parsedUsers);
      } else {
        console.log('ℹ️ Nenhum usuário no localStorage, criando usuários padrão');
        setUsers(DEFAULT_USERS);
        localStorage.setItem('attendance_users', JSON.stringify(DEFAULT_USERS));
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      setUsers(DEFAULT_USERS);
    }
  };

  // Criar usuário
  const createUser = async (userData: Omit<AttendanceUser, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const isSupabaseConfigured = supabaseUrl && supabaseKey && 
                                  supabaseUrl !== 'your_supabase_url_here' && 
                                  supabaseKey !== 'your_supabase_anon_key_here' &&
                                  !supabaseUrl.includes('placeholder');

      if (!isSupabaseConfigured) {
        // Fallback para localStorage
        const newUser: AttendanceUser = {
          ...userData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
        
        console.log('✅ Usuário criado no localStorage:', newUser.username);
        return newUser;
      }

      console.log('🚀 Criando usuário no banco:', userData.username);

      const { data, error } = await supabase
        .from('attendance_users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Usuário criado no banco:', data);
      
      // Atualizar lista local
      setUsers(prev => [...prev, data]);
      
      // Atualizar localStorage
      const updatedUsers = [...users, data];
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));

      return data;
    } catch (err) {
      console.error('❌ Erro ao criar usuário:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar usuário');
    }
  };

  // Atualizar usuário
  const updateUser = async (id: string, updates: Partial<AttendanceUser>) => {
    try {
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const isSupabaseConfigured = supabaseUrl && supabaseKey && 
                                  supabaseUrl !== 'your_supabase_url_here' && 
                                  supabaseKey !== 'your_supabase_anon_key_here' &&
                                  !supabaseUrl.includes('placeholder');

      if (!isSupabaseConfigured) {
        // Fallback para localStorage
        const updatedUsers = users.map(user => 
          user.id === id 
            ? { ...user, ...updates, updated_at: new Date().toISOString() }
            : user
        );
        setUsers(updatedUsers);
        localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
        
        console.log('✅ Usuário atualizado no localStorage:', id);
        return;
      }

      console.log('✏️ Atualizando usuário no banco:', id);

      const { data, error } = await supabase
        .from('attendance_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Usuário atualizado no banco:', data);
      
      // Atualizar lista local
      setUsers(prev => prev.map(user => user.id === id ? data : user));
      
      // Atualizar localStorage
      const updatedUsers = users.map(user => user.id === id ? data : user);
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));

      return data;
    } catch (err) {
      console.error('❌ Erro ao atualizar usuário:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    }
  };

  // Excluir usuário
  const deleteUser = async (id: string) => {
    try {
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const isSupabaseConfigured = supabaseUrl && supabaseKey && 
                                  supabaseUrl !== 'your_supabase_url_here' && 
                                  supabaseKey !== 'your_supabase_anon_key_here' &&
                                  !supabaseUrl.includes('placeholder');

      if (!isSupabaseConfigured) {
        // Fallback para localStorage
        const updatedUsers = users.filter(user => user.id !== id);
        setUsers(updatedUsers);
        localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
        
        console.log('✅ Usuário excluído do localStorage:', id);
        return;
      }

      console.log('🗑️ Excluindo usuário do banco:', id);

      const { error } = await supabase
        .from('attendance_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Usuário excluído do banco');
      
      // Atualizar lista local
      setUsers(prev => prev.filter(user => user.id !== id));
      
      // Atualizar localStorage
      const updatedUsers = users.filter(user => user.id !== id);
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));

    } catch (err) {
      console.error('❌ Erro ao excluir usuário:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir usuário');
    }
  };

  // Buscar usuário no banco de dados
  const findUserInDatabase = useCallback(async (searchUsername: string, searchPassword: string): Promise<AttendanceUser | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey && 
          !supabaseUrl.includes('placeholder') && 
          !supabaseKey.includes('placeholder')) {
        
        console.log('🔍 Buscando usuário atualizado no banco...');
        const { data: dbUser, error } = await supabase
          .from('attendance_users')
          .select('*')
          .eq('username', searchUsername)
          .eq('is_active', true)
          .single();
        
        if (!error && dbUser && dbUser.password_hash === searchPassword) {
          console.log('✅ Usuário encontrado no banco com permissões atualizadas');
          console.log('🔍 Permissões do banco:', dbUser.permissions);
          
          // Atualizar lista local com dados do banco
          setUsers(prev => {
            const updated = prev.filter(u => u.id !== dbUser.id);
            return [...updated, dbUser];
          });
          
          // Se já há uma sessão ativa, atualizar com dados do banco
          const currentSession = JSON.parse(localStorage.getItem('attendance_session') || '{}');
          if (currentSession.isAuthenticated && currentSession.user?.username === searchUsername) {
            const updatedSession = {
              isAuthenticated: true,
              user: dbUser
            };
            setSession(updatedSession);
            localStorage.setItem('attendance_session', JSON.stringify(updatedSession));
            console.log('🔄 Sessão atualizada com dados do banco');
          }
          
          return dbUser;
        }
      }
    } catch (err) {
      console.warn('⚠️ Erro ao buscar usuário no banco:', err);
    }
    
    return null;
  }, []);

  // Login
  const login = (username: string, password: string): boolean => {
    console.log('🔐 useAttendance - Tentativa de login:', { username, password: password ? '***' : 'vazio' });
    console.log('👥 Usuários disponíveis:', users.map(u => ({ username: u.username, name: u.name, role: u.role, is_active: u.is_active })));
    
    // Verificar usuários locais PRIMEIRO para resposta imediata
    const localUser = users.find(u => 
      u.username === username && 
      u.password_hash === password && 
      u.is_active
    );

    console.log('🔍 Usuário local encontrado:', localUser ? { 
      username: localUser.username, 
      name: localUser.name, 
      role: localUser.role,
      id: localUser.id,
      permissions: localUser.permissions 
    } : 'NENHUM');

    if (localUser) {
      console.log('✅ Login imediato com dados locais:', {
        username: localUser.username,
        name: localUser.name,
        role: localUser.role,
        id: localUser.id,
        permissions: localUser.permissions
      });
      
      const newSession = {
        isAuthenticated: true,
        user: localUser
      };
      
      setSession(newSession);
      localStorage.setItem('attendance_session', JSON.stringify(newSession));
      
      // Atualizar último login
      updateLastLogin(localUser.id);
      
      // DEPOIS buscar usuário atualizado do banco de dados em background
      setTimeout(() => {
        findUserInDatabase(username, password);
      }, 100);
      
      return true;
    }
    
    // Buscar no banco em background para sincronizar permissões
    findUserInDatabase(username, password);
    
    console.log('❌ Login falhou - credenciais inválidas');
    return false;
  };

  // Logout
  const logout = () => {
    console.log('🚪 useAttendance - Logout');
    setSession({ isAuthenticated: false });
    localStorage.removeItem('attendance_session');
  };

  const updateLastLogin = async (userId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        // Atualizar no localStorage se Supabase não estiver configurado
        const updatedUsers = users.map(user => 
          user.id === userId 
            ? { ...user, last_login: new Date().toISOString() }
            : user
        );
        setUsers(updatedUsers);
        localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
        return;
      }

      await supabase
        .from('attendance_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
        
      // Também atualizar no estado local
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, last_login: new Date().toISOString() }
          : user
      );
      setUsers(updatedUsers);
        
    } catch (error) {
      console.warn('Erro ao atualizar último login:', error);
    }
  };

  // Carregar usuários quando o hook for inicializado
  useEffect(() => {
    fetchUsers();
    
    // Recarregar usuários a cada 30 segundos para manter permissões sincronizadas
    const interval = setInterval(() => {
      console.log('🔄 Recarregando usuários para sincronizar permissões...');
      fetchUsers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    session,
    users,
    loading,
    error,
    login,
    logout,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
};