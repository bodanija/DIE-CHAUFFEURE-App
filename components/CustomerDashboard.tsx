import React, { useEffect, useState, useRef } from 'react';
import { User, RideRequest, RideStatus, LocationData } from '../types';
import { createRide, getRides } from '../services/mockBackend';
import { findDestination, DestinationResult, calculateRouteInfo } from '../services/geminiService';
import { RideCard } from './RideCard';
import { Button } from './Button';
import { LogOut, MapPin, Search, Navigation, Car, Clock, Calculator, ArrowRight, AlertTriangle, X, CheckCircle } from 'lucide-react';

interface CustomerDashboardProps {
  user: User;
  onLogout: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, onLogout }) => {
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const prevRideStatusRef = useRef<RideStatus | null>(null);
  
  // Start Address State
  const [location, setLocation] = useState<LocationData | null>(null);
  const [useGPS, setUseGPS] = useState(true);
  const [manualStartQuery, setManualStartQuery] = useState('');
  const [manualStartResult, setManualStartResult] = useState<DestinationResult | null>(null);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [locationError, setLocationError] = useState<string>('');

  // Destination State
  const [destinationQuery, setDestinationQuery] = useState('');
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [destinationResult, setDestinationResult] = useState<DestinationResult | null>(null);

  // Price & Route State
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{distance: number, price: number} | null>(null);

  // Additional Details State
  const [isPreOrder, setIsPreOrder] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [carModel, setCarModel] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAcceptedPopup, setShowAcceptedPopup] = useState(false);

  // Load active ride and poll for status updates
  useEffect(() => {
    const checkActiveRide = () => {
      const allRides = getRides();
      const myActiveRide = allRides
        .filter(r => r.customerId === user.id && r.status !== RideStatus.CANCELLED && r.status !== RideStatus.COMPLETED)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      // Check for status change to ACCEPTED
      if (myActiveRide) {
        if (prevRideStatusRef.current === RideStatus.PENDING && myActiveRide.status === RideStatus.ACCEPTED) {
            setShowAcceptedPopup(true);
             try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
        }
        prevRideStatusRef.current = myActiveRide.status;
      } else {
        prevRideStatusRef.current = null;
      }

      setActiveRide(myActiveRide || null);
    };

    checkActiveRide();
    const handleUpdate = () => checkActiveRide();
    window.addEventListener('storage-update', handleUpdate);
    
    // Polling is important for customer to see admin changes without page refresh
    const interval = setInterval(checkActiveRide, 3000);

    return () => {
        window.removeEventListener('storage-update', handleUpdate);
        clearInterval(interval);
    };
  }, [user.id]);

  // Get Location
  useEffect(() => {
    if (useGPS) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setLocationError('');
          },
          (error) => {
            console.error("Geo error:", error);
            setLocationError('Standort konnte nicht ermittelt werden.');
          },
          { enableHighAccuracy: true }
        );
      } else {
        setLocationError('Geolocation nicht unterstützt.');
      }
    }
  }, [useGPS]);

  // Calculate Price Effect
  useEffect(() => {
    const calculatePrice = async () => {
      // Determine Start String
      let startStr = '';
      if (useGPS && location) {
        startStr = `${location.latitude},${location.longitude}`;
      } else if (!useGPS && manualStartResult) {
        startStr = manualStartResult.text;
      }

      // Determine End String
      const endStr = destinationResult?.text;

      if (startStr && endStr) {
        setCalculatingPrice(true);
        setRouteInfo(null);
        try {
          const info = await calculateRouteInfo(startStr, endStr);
          const distance = info.distanceKm;
          // Pricing: 34€ Base + 2€ per KM
          const price = 34 + (distance * 2);
          
          setRouteInfo({
            distance: parseFloat(distance.toFixed(1)),
            price: parseFloat(price.toFixed(2))
          });
        } catch (e) {
          console.error("Price calc failed", e);
        } finally {
          setCalculatingPrice(false);
        }
      } else {
        setRouteInfo(null);
      }
    };

    const timer = setTimeout(calculatePrice, 500);
    return () => clearTimeout(timer);
  }, [useGPS, location, manualStartResult, destinationResult]);


  const handleSearchStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStartQuery.trim()) return;
    setIsSearchingStart(true);
    try {
      const result = await findDestination(manualStartQuery);
      setManualStartResult(result);
    } catch (err) {
      alert('Konnte Startadresse nicht finden.');
    } finally {
      setIsSearchingStart(false);
    }
  };

  const handleSearchDest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationQuery.trim()) return;
    setIsSearchingDest(true);
    try {
      const result = await findDestination(destinationQuery, location || undefined);
      setDestinationResult(result);
    } catch (err) {
      alert('Konnte Zieladresse nicht finden.');
    } finally {
      setIsSearchingDest(false);
    }
  };

  const validateInputs = (): boolean => {
    if (useGPS && !location) {
      alert("Bitte warten Sie auf GPS oder geben Sie die Adresse manuell ein.");
      return false;
    }
    if (!useGPS && !manualStartResult) {
      alert("Bitte suchen und bestätigen Sie eine Startadresse.");
      return false;
    }
    if (!destinationResult) {
      alert("Bitte geben Sie ein Ziel an.");
      return false;
    }
    if (isPreOrder && !pickupTime) {
      alert("Bitte geben Sie eine Abholzeit an.");
      return false;
    }
    return true;
  };

  const handleInitiateOrder = () => {
    if (validateInputs()) {
      setShowConfirmModal(true);
    }
  };

  const handleExecuteOrder = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const startAddrText = useGPS 
      ? `GPS (${location?.latitude.toFixed(4)}, ${location?.longitude.toFixed(4)})` 
      : manualStartResult!.text;
    
    const startAddrLink = !useGPS ? manualStartResult?.mapUri : undefined;

    const newRide: RideRequest = {
      id: Date.now().toString(),
      customerId: user.id,
      customerName: user.name,
      startLocation: useGPS ? location! : undefined,
      startAddress: startAddrText,
      startMapUri: startAddrLink,
      destination: destinationResult!.text,
      destinationMapUri: destinationResult!.mapUri,
      pickupTime: isPreOrder ? `${pickupTime} Uhr` : 'Sofort',
      carModel: carModel.trim() || undefined,
      distanceKm: routeInfo?.distance,
      estimatedPrice: routeInfo?.price,
      status: RideStatus.PENDING,
      timestamp: Date.now()
    };

    createRide(newRide);
    setIsSubmitting(false);
    
    // Reset
    setDestinationQuery('');
    setDestinationResult(null);
    setManualStartQuery('');
    setManualStartResult(null);
    setCarModel('');
    setIsPreOrder(false);
    setPickupTime('');
    setRouteInfo(null);
    
    // Reset Prev Status Logic so popup doesn't trigger immediately for new ride (stays pending)
    prevRideStatusRef.current = RideStatus.PENDING;
  };

  return (
    <div className="min-h-screen bg-[#343233] pb-20 relative">
       <header className="bg-[#343233] border-b border-[#403e3f] sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
             <img src="/logo.png" alt="DIE CHAUFFEURE" className="h-10 object-contain" onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.nextElementSibling?.classList.remove('hidden');
             }}/>
             <h1 className="hidden text-xl font-serif font-bold text-white tracking-wider ml-2">
               DIE <span className="text-[#e32b2d]">CHAUFFEURE</span>
             </h1>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        
        {activeRide ? (
          <div>
            <h2 className="text-xl text-white font-semibold mb-4">Ihr Auftrag</h2>
            <RideCard ride={activeRide} />
            <p className="text-center text-slate-500 text-sm mt-4">
              Wir benachrichtigen Sie, sobald der Chauffeur eintrifft.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            
            {/* 1. Start Address */}
            <div className="bg-[#403e3f] p-5 rounded-xl border border-[#504e4f] shadow-lg">
              <h2 className="text-lg text-white font-medium mb-4 flex items-center">
                <Navigation className="mr-2 text-blue-400" size={20} />
                Abholort
              </h2>
              
              <div className="flex bg-[#343233] rounded-lg p-1 mb-4 border border-[#504e4f]">
                <button 
                  onClick={() => setUseGPS(true)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${useGPS ? 'bg-[#e32b2d] text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  GPS Standort
                </button>
                <button 
                  onClick={() => setUseGPS(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!useGPS ? 'bg-[#e32b2d] text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Adresse eingeben
                </button>
              </div>

              {useGPS ? (
                location ? (
                  <div className="flex items-center text-slate-300 bg-[#343233] p-3 rounded-lg border border-[#504e4f]">
                     <div className="w-2 h-2 rounded-full bg-green-500 mr-3 animate-pulse"></div>
                     <span className="text-sm">
                       GPS Position erfasst ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                     </span>
                  </div>
                ) : (
                  <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-900/30">
                    {locationError || 'Ermittle Standort...'}
                  </div>
                )
              ) : (
                <>
                  <form onSubmit={handleSearchStart} className="relative">
                    <input
                      type="text"
                      value={manualStartQuery}
                      onChange={(e) => setManualStartQuery(e.target.value)}
                      placeholder="Startadresse (z.B. Hauptstraße 5)"
                      className="w-full bg-[#343233] border border-[#504e4f] rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:border-[#e32b2d] placeholder-slate-500"
                    />
                    <button 
                      type="submit"
                      disabled={isSearchingStart || !manualStartQuery}
                      className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-white disabled:opacity-50"
                    >
                      {isSearchingStart ? <span className="block w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span> : <Search size={20} />}
                    </button>
                  </form>
                  {manualStartResult && (
                    <div className="mt-2 p-3 bg-[#343233]/50 border border-[#e32b2d]/30 rounded text-sm text-slate-200 flex justify-between items-center">
                      <div>
                         <span className="text-[#e32b2d] text-xs font-bold block mb-1">Gewählter Start:</span>
                         {manualStartResult.text}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 2. Destination */}
            <div className="bg-[#403e3f] p-5 rounded-xl border border-[#504e4f] shadow-lg">
              <h2 className="text-lg text-white font-medium mb-4 flex items-center">
                <MapPin className="mr-2 text-[#e32b2d]" size={20} />
                Wohin geht die Fahrt?
              </h2>
              
              <form onSubmit={handleSearchDest} className="relative">
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  placeholder="Zielort suchen (autom. Berechnung)"
                  className="w-full bg-[#343233] border border-[#504e4f] rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:border-[#e32b2d] placeholder-slate-500"
                />
                <button 
                  type="submit"
                  disabled={isSearchingDest || !destinationQuery}
                  className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-white disabled:opacity-50"
                >
                  {isSearchingDest ? <span className="block w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span> : <Search size={20} />}
                </button>
              </form>

              {destinationResult && (
                <div className="mt-2 p-3 bg-[#343233]/50 border border-[#e32b2d]/30 rounded text-sm text-slate-200">
                  <span className="text-[#e32b2d] text-xs font-bold block mb-1">Gewähltes Ziel:</span>
                  {destinationResult.text}
                </div>
              )}
            </div>

            {/* Price Calculation Display */}
            {(manualStartResult || (useGPS && location)) && destinationResult && (
              <div className="bg-[#343233] border border-[#504e4f] rounded-xl p-4 shadow-inner">
                {calculatingPrice ? (
                   <div className="flex items-center justify-center py-4 text-slate-400">
                     <span className="w-5 h-5 border-2 border-slate-500 border-t-[#e32b2d] rounded-full animate-spin mr-3"></span>
                     Berechne Fahrpreis...
                   </div>
                ) : routeInfo ? (
                   <div>
                     <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#504e4f]">
                        <span className="text-slate-400 text-sm flex items-center">
                          <Navigation size={14} className="mr-1"/> Distanz
                        </span>
                        <span className="text-white font-mono">{routeInfo.distance} km</span>
                     </div>
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-sm">Anfahrtspauschale</span>
                        <span className="text-slate-300 font-mono">34,00 €</span>
                     </div>
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-sm">Fahrpreis (2,00 €/km)</span>
                        <span className="text-slate-300 font-mono">{(routeInfo.distance * 2).toFixed(2).replace('.', ',')} €</span>
                     </div>
                     <div className="mt-3 pt-2 border-t border-[#e32b2d]/30 flex justify-between items-end">
                        <span className="text-white font-medium">Geschätzter Gesamtpreis:</span>
                        <span className="text-[#e32b2d] text-2xl font-bold">{routeInfo.price.toFixed(2).replace('.', ',')} €</span>
                     </div>
                   </div>
                ) : (
                  <div className="text-center text-xs text-red-400">Preis konnte nicht berechnet werden.</div>
                )}
              </div>
            )}

            {/* 3. Details */}
            <div className="bg-[#403e3f] p-5 rounded-xl border border-[#504e4f] shadow-lg">
               <h2 className="text-lg text-white font-medium mb-4 flex items-center">
                <Clock className="mr-2 text-slate-400" size={20} />
                Optionen
              </h2>

              <div className="space-y-4">
                 <div>
                    <div className="flex items-center mb-2">
                       <input 
                         type="checkbox" 
                         id="preorder" 
                         checked={isPreOrder} 
                         onChange={(e) => setIsPreOrder(e.target.checked)}
                         className="w-4 h-4 rounded border-slate-600 text-[#e32b2d] focus:ring-[#e32b2d] bg-[#343233]"
                       />
                       <label htmlFor="preorder" className="ml-2 text-sm text-slate-300">
                         Vorbestellung für später
                       </label>
                    </div>
                    {isPreOrder && (
                       <input 
                         type="time" 
                         value={pickupTime}
                         onChange={(e) => setPickupTime(e.target.value)}
                         className="w-full bg-[#343233] border border-[#504e4f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#e32b2d]"
                       />
                    )}
                 </div>

                 <div>
                   <label className="block text-sm text-slate-400 mb-1 flex items-center">
                     <Car size={14} className="mr-1" /> Fahrzeugmodell (Optional)
                   </label>
                   <input
                     type="text"
                     value={carModel}
                     onChange={(e) => setCarModel(e.target.value)}
                     placeholder="z.B. Audi A6"
                     className="w-full bg-[#343233] border border-[#504e4f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#e32b2d] placeholder-slate-600"
                   />
                 </div>
              </div>
            </div>

            <Button 
              onClick={handleInitiateOrder} 
              isLoading={isSubmitting}
              className="w-full mt-4"
              disabled={(!useGPS && !manualStartResult) || !destinationResult}
            >
              Kostenpflichtig bestellen
            </Button>
            
            <div className="text-xs text-slate-500 text-center px-4">
              Mit der Bestellung akzeptieren Sie unsere AGB. Die Fahrt erfolgt in Ihrem versicherten Fahrzeug.
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#403e3f] border border-[#504e4f] rounded-2xl w-full max-w-sm shadow-2xl transform transition-all scale-100 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#e32b2d]/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-[#e32b2d]" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Kostenpflichtige Bestellung</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Bitte bestätigen Sie, dass die Fahrt nach Bestellung <span className="text-white font-semibold">nicht mehr kostenfrei storniert werden kann</span>.
              </p>
              
              <div className="flex gap-3 w-full">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleExecuteOrder}
                  className="flex-1"
                >
                  Verbindlich buchen
                </Button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Accepted Ride Popup */}
      {showAcceptedPopup && activeRide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
           <div className="bg-[#403e3f] border border-[#504e4f] border-t-4 border-t-green-500 rounded-xl shadow-2xl p-5 animate-in slide-in-from-bottom-10 max-w-md mx-auto">
              <div className="flex items-start">
                 <CheckCircle className="text-green-500 mr-3 mt-1" size={24} />
                 <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Fahrt bestätigt!</h3>
                    <p className="text-slate-300 text-sm mb-2">
                       Der Chauffeur ist unterwegs.
                    </p>
                    <div className="bg-[#343233] p-3 rounded-lg border border-[#504e4f] mb-3 text-center">
                       <span className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Ankunft in ca.</span>
                       <span className="text-[#e32b2d] text-2xl font-bold">{activeRide.etaMinutes} Minuten</span>
                    </div>
                    <Button 
                       onClick={() => setShowAcceptedPopup(false)} 
                       className="w-full py-2 text-sm"
                    >
                       Verstanden
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};