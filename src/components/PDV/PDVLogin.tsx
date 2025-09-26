import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Calculator } from 'lucide-react';

interface PDVLoginProps {
  onLogin: (code: string, password: string) => boolean;
}

const PDVLogin: React.FC<PDVLoginProps> = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔐 PDV Login attempt:', { code, password: password ? '***' : 'empty' });

    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = onLogin(code, password);
    
    if (!success) {
      setError('Código ou senha inválidos');
      console.log('❌ PDV Login failed');
    } else {
      console.log('✅ PDV Login successful');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-white rounded-full p-2 w-24 h-24 mx-auto mb-4 flex items-center justify-center shadow-lg border-2 border-blue-200">
            <img 
              src="/Logo_açai.jpeg" 
              alt="Elite Açaí Logo" 
              className="w-20 h-20 object-contain rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/logo.jpg';
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sistema PDV</h1>
          <p className="text-gray-600">Elite Açaí - Ponto de Venda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código do Operador
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="ADMIN"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Entrando...
              </>
            ) : (
              <>
                <Calculator size={20} />
                Entrar no PDV
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm font-medium mb-1">Credenciais de Acesso:</p>
            <p className="text-blue-700 text-sm">Código: <strong>ADMIN</strong></p>
            <p className="text-blue-700 text-sm">Senha: <strong>elite2024</strong></p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Voltar para o site
          </a>
        </div>
      </div>
    </div>
  );
};

export default PDVLogin;