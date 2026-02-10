import React, { useState } from 'react';
import { User, UserRole } from './types';
import { loginUser } from './services/mockBackend';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { Button } from './components/Button';
import { Car } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // In this mock, password check is skipped for simplicity as per requirements ("Login with username")
      // but in real app would verify password.
      const loggedInUser = await loginUser(username);
      if (loggedInUser) {
        setUser(loggedInUser);
      } else {
        setError('Benutzername nicht gefunden. (Versuche "admin" oder "kunde1")');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setError('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#343233] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 flex flex-col items-center">
            {/* Logo Section */}
            <div className="mb-6 relative">
               <img 
                 src="/logo.png" 
                 alt="DIE CHAUFFEURE" 
                 className="h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(227,43,45,0.3)]"
                 onError={(e) => {
                   // Fallback if image not found
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                 }}
               />
               <div className="hidden flex-col items-center">
                 <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#343233] border-2 border-[#e32b2d] mb-4 shadow-[0_0_30px_rgba(227,43,45,0.2)]">
                   <Car size={40} className="text-[#e32b2d]" />
                 </div>
                 <h1 className="text-3xl font-serif font-bold text-white tracking-widest">
                  DIE <span className="text-[#e32b2d]">CHAUFFEURE</span>
                 </h1>
               </div>
            </div>
            <p className="text-slate-400 mt-2 font-light">Ihr sicherer Weg nach Hause.</p>
          </div>

          <div className="bg-[#403e3f] p-8 rounded-2xl border border-[#504e4f] shadow-2xl">
            <h2 className="text-xl text-white font-medium mb-6 border-b border-[#504e4f] pb-4">Anmelden</h2>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Benutzername</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#343233] border border-[#504e4f] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#e32b2d] transition-colors placeholder-slate-600"
                  placeholder="Ihr Benutzername"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Passwort</label>
                <input
                  type="password"
                  className="w-full bg-[#343233] border border-[#504e4f] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#e32b2d] transition-colors placeholder-slate-600"
                  placeholder="••••••••"
                />
              </div>
              
              {error && (
                <div className="text-red-300 text-sm bg-red-900/30 p-3 rounded border border-red-900/50">
                  {error}
                </div>
              )}

              <Button type="submit" isLoading={isLoading} className="w-full">
                Einloggen
              </Button>
            </form>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-[#666465] text-xs">
              Systemzugang nur für autorisierte Personen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return user.role === UserRole.ADMIN ? (
    <AdminDashboard user={user} onLogout={handleLogout} />
  ) : (
    <CustomerDashboard user={user} onLogout={handleLogout} />
  );
};

export default App;