import { RideRequest, RideStatus, User, UserRole } from "../types";

// Initial Mock Users
const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', role: UserRole.ADMIN, name: 'Zentrale', password: '123' },
  { id: '2', username: 'kunde1', role: UserRole.CUSTOMER, name: 'Max Mustermann', password: '123' },
  { id: '3', username: 'kunde2', role: UserRole.CUSTOMER, name: 'Erika Musterfrau', password: '123' },
];

const RIDES_STORAGE_KEY = 'die_chauffeure_rides';
const USERS_STORAGE_KEY = 'die_chauffeure_users';

// Helper to get users from storage or init
const getStoredUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersJson) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(usersJson);
};

export const getUsers = (): User[] => {
  return getStoredUsers();
};

export const saveUser = (user: User): void => {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === user.id);
  
  if (index >= 0) {
    // Update
    users[index] = { ...users[index], ...user };
  } else {
    // Create
    users.push(user);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event('user-update'));
};

export const deleteUser = (userId: string): void => {
  const users = getStoredUsers().filter(u => u.id !== userId);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event('user-update'));
};

export const loginUser = async (username: string): Promise<User | null> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const users = getStoredUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  // Note: Password check is implicit/skipped in this simple mock as per initial prompt style, 
  // but logically would happen here.
  return user || null;
};

export const getRides = (): RideRequest[] => {
  const ridesJson = localStorage.getItem(RIDES_STORAGE_KEY);
  return ridesJson ? JSON.parse(ridesJson) : [];
};

export const createRide = (ride: RideRequest): void => {
  const rides = getRides();
  rides.push(ride);
  localStorage.setItem(RIDES_STORAGE_KEY, JSON.stringify(rides));
  // Dispatch event for reactive updates in this mock env
  window.dispatchEvent(new Event('storage-update'));
};

export const updateRideEta = (rideId: string, etaMinutes: number): void => {
  const rides = getRides();
  const updatedRides = rides.map(r => {
    if (r.id === rideId) {
      // Calculate estimated arrival timestamp based on current time + minutes
      const etaTimestamp = Date.now() + (etaMinutes * 60 * 1000);
      return { 
        ...r, 
        status: RideStatus.ACCEPTED, 
        etaMinutes: etaMinutes,
        etaTimestamp: etaTimestamp
      };
    }
    return r;
  });
  localStorage.setItem(RIDES_STORAGE_KEY, JSON.stringify(updatedRides));
  window.dispatchEvent(new Event('storage-update'));
};

export const cancelRide = (rideId: string): void => {
    const rides = getRides();
    const updatedRides = rides.map(r => {
      if (r.id === rideId) {
        return { ...r, status: RideStatus.CANCELLED };
      }
      return r;
    });
    localStorage.setItem(RIDES_STORAGE_KEY, JSON.stringify(updatedRides));
    window.dispatchEvent(new Event('storage-update'));
  };