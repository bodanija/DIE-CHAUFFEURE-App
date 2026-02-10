import React from 'react';
import { RideRequest, RideStatus } from '../types';
import { MapPin, Navigation, Clock, User, ExternalLink, Car, CalendarClock, Euro, Route } from 'lucide-react';

interface RideCardProps {
  ride: RideRequest;
  isAdmin?: boolean;
  onUpdateEta?: (id: string, minutes: number) => void;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, isAdmin, onUpdateEta }) => {
  const [etaInput, setEtaInput] = React.useState<string>('');

  const statusColors = {
    [RideStatus.PENDING]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    [RideStatus.ACCEPTED]: 'bg-green-500/10 text-green-500 border-green-500/20',
    [RideStatus.COMPLETED]: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    [RideStatus.CANCELLED]: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const handleSubmitEta = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateEta && etaInput) {
      onUpdateEta(ride.id, parseInt(etaInput));
      setEtaInput('');
    }
  };

  const arrivalTime = ride.etaTimestamp 
    ? new Date(ride.etaTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ride.etaMinutes 
      ? new Date(Date.now() + ride.etaMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : null;

  return (
    <div className="bg-[#403e3f] border border-[#504e4f] rounded-xl p-5 mb-4 shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[ride.status]}`}>
          {ride.status === RideStatus.PENDING ? 'ANFRAGE' : 
           ride.status === RideStatus.ACCEPTED ? 'BESTÄTIGT' : ride.status}
        </div>
        <span className="text-slate-400 text-xs">
          Bestellt: {new Date(ride.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isAdmin && (
        <div className="flex items-center text-slate-200 mb-4 pb-3 border-b border-[#504e4f]">
          <User size={16} className="mr-2 text-[#e32b2d]" />
          <span className="font-semibold">{ride.customerName}</span>
        </div>
      )}

      <div className="space-y-4">
        
        <div className="flex items-start">
          <Navigation size={18} className="mr-3 text-blue-400 mt-1 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-slate-400">Abholort</p>
            <p className="text-sm text-slate-200">{ride.startAddress}</p>
            {ride.startMapUri ? (
               <a 
               href={ride.startMapUri}
               target="_blank" 
               rel="noreferrer"
               className="flex items-center mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
             >
               <ExternalLink size={10} className="mr-1" />
               Karte öffnen
             </a>
            ) : ride.startLocation && (
              <a 
                 href={`https://www.google.com/maps/search/?api=1&query=${ride.startLocation.latitude},${ride.startLocation.longitude}`}
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
               >
                 <ExternalLink size={10} className="mr-1" />
                 Karte öffnen
               </a>
            )}
          </div>
        </div>

        <div className="flex items-start">
          <MapPin size={18} className="mr-3 text-[#e32b2d] mt-1 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-slate-400">Zielort</p>
            <p className="text-sm text-slate-200">{ride.destination}</p>
            {ride.destinationMapUri && (
                 <a 
                 href={ride.destinationMapUri}
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center mt-1 text-xs text-[#e32b2d] hover:text-red-400 underline"
               >
                 <ExternalLink size={10} className="mr-1" />
                 Karte öffnen
               </a>
            )}
          </div>
        </div>

        {/* Pricing Info */}
        {(ride.estimatedPrice || ride.distanceKm) && (
            <div className="bg-[#343233] p-3 rounded border border-[#504e4f] flex justify-between items-center">
                <div className="flex items-center text-slate-300 text-sm">
                    <Route size={14} className="mr-2 text-slate-400"/>
                    {ride.distanceKm} km
                </div>
                {ride.estimatedPrice && (
                    <div className="flex items-center text-white font-bold">
                        <Euro size={14} className="mr-1 text-[#e32b2d]"/>
                        {ride.estimatedPrice.toFixed(2).replace('.', ',')} €
                    </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-[#343233] p-2 rounded border border-[#504e4f]">
                <div className="flex items-center text-slate-400 text-xs mb-1">
                    <CalendarClock size={12} className="mr-1" />
                    Abholzeit
                </div>
                <div className="text-white text-sm font-medium">{ride.pickupTime}</div>
            </div>
            
            {ride.carModel && (
                <div className="bg-[#343233] p-2 rounded border border-[#504e4f]">
                    <div className="flex items-center text-slate-400 text-xs mb-1">
                        <Car size={12} className="mr-1" />
                        Fahrzeug
                    </div>
                    <div className="text-white text-sm font-medium">{ride.carModel}</div>
                </div>
            )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#504e4f]">
        {isAdmin && ride.status === RideStatus.PENDING ? (
          <form onSubmit={handleSubmitEta} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Ankunftszeit (Minuten)</label>
              <input
                type="number"
                min="1"
                required
                value={etaInput}
                onChange={(e) => setEtaInput(e.target.value)}
                className="w-full bg-[#343233] border border-[#504e4f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#e32b2d]"
                placeholder="z.B. 15"
              />
            </div>
            <button 
              type="submit"
              className="bg-[#e32b2d] hover:bg-[#c42527] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Bestätigen
            </button>
          </form>
        ) : (
          <div className="flex flex-col">
             <div className="flex items-center justify-between mb-1">
                 <div className="flex items-center text-slate-300">
                   <Clock size={18} className="mr-2 text-slate-400" />
                   <span className="text-sm">Chauffeur Ankunft:</span>
                 </div>
                 <div className="text-xl font-bold text-white">
                    {ride.etaMinutes ? (
                      <span className="text-[#e32b2d]">{ride.etaMinutes} Min.</span>
                    ) : (
                      <span className="text-slate-500 text-sm">Warte auf Bestätigung...</span>
                    )}
                 </div>
             </div>
             {arrivalTime && (
                 <div className="text-right text-xs text-slate-400">
                     (ca. {arrivalTime} Uhr)
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};