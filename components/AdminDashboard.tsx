import React, { useEffect, useState, useRef } from 'react';
import { RideRequest, RideStatus, User, UserRole } from '../types';
import { getRides, updateRideEta, getUsers, saveUser, deleteUser } from '../services/mockBackend';
import { RideCard } from './RideCard';
import { LogOut, RefreshCw, Users, Car, Plus, Trash2, Edit2, Check, X, Bell } from 'lucide-react';
import { Button } from './Button';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type ViewMode = 'rides' | 'users';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<ViewMode>('rides');
  
  // Notification State
  const [showNewRidePopup, setShowNewRidePopup] = useState(false);
  const pendingRidesCountRef = useRef(0);

  // User Management State
  const [isEditingUser, setIsEditingUser] = useState<string | null>(null); // ID or 'NEW'
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const fetchRides = () => {
    const allRides = getRides().sort((a, b) => {
      if (a.status === RideStatus.PENDING && b.status !== RideStatus.PENDING) return -1;
      if (a.status !== RideStatus.PENDING && b.status === RideStatus.PENDING) return 1;
      return b.timestamp - a.timestamp;
    });
    setRides(allRides);

    // Check for new pending rides
    const currentPendingCount = allRides.filter(r => r.status === RideStatus.PENDING).length;
    if (currentPendingCount > pendingRidesCountRef.current) {
      setShowNewRidePopup(true);
      // Play sound optional
      try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
    }
    pendingRidesCountRef.current = currentPendingCount;
  };

  const fetchUsers = () => {
    setUsers(getUsers());
  };

  useEffect(() => {
    fetchRides();
    fetchUsers();
    
    const handleStorageUpdate = () => fetchRides();
    const handleUserUpdate = () => fetchUsers();
    
    window.addEventListener('storage-update', handleStorageUpdate);
    window.addEventListener('user-update', handleUserUpdate);
    
    // Polling fallback every 5 seconds to ensure we catch external updates
    const interval = setInterval(fetchRides, 5000);
    
    return () => {
      window.removeEventListener('storage-update', handleStorageUpdate);
      window.removeEventListener('user-update', handleUserUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateEta = (id: string, minutes: number) => {
    updateRideEta(id, minutes);
    fetchRides();
  };

  // --- User Management Logic ---

  const handleEditUser = (u: User) => {
    setIsEditingUser(u.id);
    setEditForm(u);
  };

  const handleCreateUser = () => {
    setIsEditingUser('NEW');
    setEditForm({ role: UserRole.CUSTOMER, username: '', name: '', password: '' });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.username || !editForm.name) return;

    const newUser: User = {
        id: isEditingUser === 'NEW' ? Date.now().toString() : isEditingUser!,
        username: editForm.username!,
        name: editForm.name!,
        role: editForm.role || UserRole.CUSTOMER,
        password: editForm.password 
    };

    saveUser(newUser);
    setIsEditingUser(null);
    setEditForm({});
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Benutzer wirklich löschen?')) {
      deleteUser(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#343233] pb-20 relative">
      <header className="bg-[#343233] border-b border-[#403e3f] sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
             <img src="/logo.png" alt="DIE CHAUFFEURE" className="h-10 object-contain" onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.nextElementSibling?.classList.remove('hidden');
             }}/>
             <h1 className="hidden text-xl font-serif font-bold text-white tracking-wider ml-2">
               DIE <span className="text-[#e32b2d]">CHAUFFEURE</span>
             </h1>
             <span className="text-xs bg-[#e32b2d]/20 text-[#e32b2d] px-2 py-0.5 rounded ml-3 border border-[#e32b2d]/30">ADMIN</span>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6 mb-4">
        <div className="flex space-x-2 bg-[#403e3f] p-1 rounded-lg inline-flex">
          <button 
            onClick={() => setView('rides')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${view === 'rides' ? 'bg-[#e32b2d] text-white shadow' : 'text-slate-300 hover:text-white'}`}
          >
            <Car size={16} className="mr-2" />
            Aufträge
          </button>
          <button 
             onClick={() => setView('users')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${view === 'users' ? 'bg-[#e32b2d] text-white shadow' : 'text-slate-300 hover:text-white'}`}
          >
            <Users size={16} className="mr-2" />
            Kundenverwaltung
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pb-6">
        
        {/* RIDES VIEW */}
        {view === 'rides' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg text-slate-200 font-medium">Aktuelle Aufträge</h2>
              <button 
                onClick={fetchRides} 
                className="p-2 bg-[#403e3f] rounded-full hover:bg-[#504e4f] text-slate-300 transition-colors border border-[#504e4f]"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {rides.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>Keine aktiven Aufträge vorhanden.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rides.map(ride => (
                  <RideCard 
                    key={ride.id} 
                    ride={ride} 
                    isAdmin={true} 
                    onUpdateEta={handleUpdateEta}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* USERS VIEW */}
        {view === 'users' && (
          <>
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg text-slate-200 font-medium">Benutzerliste</h2>
              <Button 
                onClick={handleCreateUser} 
                className="py-2 px-3 text-sm"
              >
                <Plus size={16} className="mr-2" /> Neuer Kunde
              </Button>
            </div>

            {/* Create/Edit Form */}
            {isEditingUser && (
               <div className="mb-6 bg-[#403e3f] border border-[#504e4f] rounded-xl p-5 shadow-lg animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-white font-medium mb-4">{isEditingUser === 'NEW' ? 'Neuen Kunden anlegen' : 'Kunden bearbeiten'}</h3>
                  <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs text-slate-400 mb-1">Name</label>
                        <input 
                           className="w-full bg-[#343233] border border-[#504e4f] rounded p-2 text-white text-sm"
                           value={editForm.name || ''}
                           onChange={e => setEditForm({...editForm, name: e.target.value})}
                           required
                        />
                     </div>
                     <div>
                        <label className="block text-xs text-slate-400 mb-1">Benutzername</label>
                        <input 
                           className="w-full bg-[#343233] border border-[#504e4f] rounded p-2 text-white text-sm"
                           value={editForm.username || ''}
                           onChange={e => setEditForm({...editForm, username: e.target.value})}
                           required
                        />
                     </div>
                     <div>
                        <label className="block text-xs text-slate-400 mb-1">Passwort</label>
                        <input 
                           className="w-full bg-[#343233] border border-[#504e4f] rounded p-2 text-white text-sm"
                           value={editForm.password || ''}
                           onChange={e => setEditForm({...editForm, password: e.target.value})}
                           placeholder={isEditingUser !== 'NEW' ? 'Ändern...' : 'Pflichtfeld'}
                           type="text"
                           required={isEditingUser === 'NEW'}
                        />
                     </div>
                     <div className="flex items-end gap-2">
                        <Button type="submit" className="flex-1 py-2 text-sm">Speichern</Button>
                        <Button 
                           type="button" 
                           variant="secondary" 
                           className="py-2 text-sm"
                           onClick={() => { setIsEditingUser(null); setEditForm({}); }}
                        >
                           Abbrechen
                        </Button>
                     </div>
                  </form>
               </div>
            )}

            <div className="bg-[#403e3f] rounded-xl border border-[#504e4f] overflow-hidden">
               <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#343233] text-slate-400 uppercase font-medium">
                     <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Benutzername</th>
                        <th className="px-4 py-3">Passwort</th>
                        <th className="px-4 py-3 text-right">Aktionen</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#504e4f]">
                     {users.filter(u => u.role === UserRole.CUSTOMER).map(u => (
                        <tr key={u.id} className="hover:bg-[#4d4b4c]/50 transition-colors">
                           <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                           <td className="px-4 py-3">{u.username}</td>
                           <td className="px-4 py-3 font-mono text-xs">{u.password || '****'}</td>
                           <td className="px-4 py-3 flex justify-end gap-2">
                              <button 
                                 onClick={() => handleEditUser(u)}
                                 className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"
                              >
                                 <Edit2 size={16} />
                              </button>
                              <button 
                                 onClick={() => handleDeleteUser(u.id)}
                                 className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                     {users.filter(u => u.role === UserRole.CUSTOMER).length === 0 && (
                        <tr>
                           <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Keine Kunden gefunden.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
          </>
        )}
      </main>

      {/* New Ride Popup Notification */}
      {showNewRidePopup && (
         <div className="fixed bottom-4 right-4 max-w-sm w-full bg-[#403e3f] border border-[#e32b2d] shadow-2xl rounded-xl p-4 animate-in slide-in-from-bottom-5 z-50">
            <div className="flex items-start">
               <div className="bg-[#e32b2d]/20 p-2 rounded-full mr-3 text-[#e32b2d]">
                  <Bell size={24} />
               </div>
               <div className="flex-1">
                  <h4 className="text-white font-bold mb-1">Neuer Auftrag!</h4>
                  <p className="text-sm text-slate-300 mb-3">Ein Kunde hat eine Fahrt angefragt.</p>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => { setShowNewRidePopup(false); setView('rides'); window.scrollTo(0,0); }}
                        className="bg-[#e32b2d] hover:bg-[#c42527] text-white text-xs px-3 py-1.5 rounded font-medium transition-colors"
                     >
                        Ansehen
                     </button>
                     <button 
                        onClick={() => setShowNewRidePopup(false)}
                        className="text-slate-400 hover:text-white text-xs px-3 py-1.5"
                     >
                        Schließen
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};