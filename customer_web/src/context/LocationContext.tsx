import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

export interface UserLocation {
  name: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  isGps: boolean;
  locality?: string;
  city?: string;
  postalCode?: string;
}

interface LocationContextType {
  currentLocation: UserLocation | null;
  recentLocations: UserLocation[];
  nearbyLocalities: UserLocation[];
  isDetecting: boolean;
  detectGpsLocation: () => Promise<UserLocation | null>;
  setLocation: (loc: UserLocation) => void;
  updateManualLocation: (name: string, addressLine?: string, city?: string) => void;
  searchLocalities: (query: string) => Promise<UserLocation[]>;
  fetchNearbyPlaces: (lat: number, lng: number) => Promise<UserLocation[]>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [nearbyLocalities, setNearbyLocalities] = useState<UserLocation[]>([]);

  const cleanLocationString = (str?: string | null): string => {
    if (!str) return '';
    return str
      .replace(/mainland\s*india,?\s*/gi, '')
      .replace(/^,\s*/, '')
      .trim();
  };

  // Load recent locations from localStorage
  const [recentLocations, setRecentLocations] = useState<UserLocation[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('aajori_recent_locations');
      if (!raw) return [];
      const parsed: UserLocation[] = JSON.parse(raw);
      return parsed.map((item) => ({
        ...item,
        name: cleanLocationString(item.name) || item.name,
        addressLine: cleanLocationString(item.addressLine) || item.addressLine,
      }));
    } catch {
      return [];
    }
  });

  // Initialize current location strictly from localStorage if user previously selected/detected it
  const [currentLocation, setCurrentLocationState] = useState<UserLocation | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedName = localStorage.getItem('aajori_user_location_name');
    const savedLat = localStorage.getItem('aajori_user_lat');
    const savedLng = localStorage.getItem('aajori_user_lng');
    const savedAddress = localStorage.getItem('aajori_user_address');
    const savedIsGps = localStorage.getItem('aajori_user_is_gps') === 'true';

    if (savedName && savedLat && savedLng) {
      const cleanName = cleanLocationString(savedName) || 'Current Location';
      const cleanAddress = cleanLocationString(savedAddress) || cleanName;
      return {
        name: cleanName,
        addressLine: cleanAddress,
        latitude: Number(savedLat),
        longitude: Number(savedLng),
        isGps: savedIsGps,
      };
    }
    return null;
  });

  // Save location to state and recent history
  const setLocation = useCallback((loc: UserLocation) => {
    setCurrentLocationState(loc);
    localStorage.setItem('aajori_user_location_name', loc.name);
    localStorage.setItem('aajori_user_address', loc.addressLine);
    localStorage.setItem('aajori_user_lat', String(loc.latitude));
    localStorage.setItem('aajori_user_lng', String(loc.longitude));
    localStorage.setItem('aajori_user_is_gps', String(loc.isGps));

    // Update recent locations (max 6, no duplicates)
    setRecentLocations((prev) => {
      const filtered = prev.filter(
        (p) => p.name.toLowerCase() !== loc.name.toLowerCase()
      );
      const updated = [loc, ...filtered].slice(0, 6);
      localStorage.setItem('aajori_recent_locations', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateManualLocation = useCallback(
    (name: string, addressLine?: string, city?: string) => {
      const cleanName = cleanLocationString(name) || 'Custom Location';
      const cleanAddress = cleanLocationString(addressLine) || cleanName;
      const updated: UserLocation = {
        name: cleanName,
        addressLine: cleanAddress,
        latitude: currentLocation?.latitude || 26.18,
        longitude: currentLocation?.longitude || 91.75,
        isGps: false,
        city: city || cleanName,
      };
      setLocation(updated);
      toast.success('Location Updated', cleanName);
    },
    [currentLocation, setLocation, toast]
  );

  // Free API 1: Fetch nearby places/localities around coordinates from OpenStreetMap Nominatim/Photon
  const fetchNearbyPlaces = useCallback(async (lat: number, lng: number): Promise<UserLocation[]> => {
    try {
      // Free Photon API by Komoot (built on OpenStreetMap, free, fast, no API key needed)
      const res = await fetch(
        `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.features && Array.isArray(data.features)) {
          const items: UserLocation[] = data.features.slice(0, 6).map((f: any) => {
            const props = f.properties || {};
            const title =
              cleanLocationString(props.name) ||
              cleanLocationString(props.street) ||
              cleanLocationString(props.district) ||
              cleanLocationString(props.city) ||
              'Nearby Landmark';
            const subtitle = [props.street, props.district, props.city, props.state]
              .filter(Boolean)
              .map((s) => cleanLocationString(s))
              .filter(Boolean)
              .join(', ');

            return {
              name: title,
              addressLine: subtitle || title,
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0],
              isGps: false,
              locality: props.district || props.city,
              postalCode: props.postcode,
            };
          });

          setNearbyLocalities(items);
          return items;
        }
      }
    } catch (e) {
      console.warn('Could not fetch nearby places from free Photon API:', e);
    }
    return [];
  }, []);

  // Free API 2: Reverse Geocode coordinates to exact human-readable address
  // Uses OpenStreetMap Nominatim first (most accurate, granular localities), BigDataCloud as fallback
  const reverseGeocode = async (
    lat: number,
    lng: number
  ): Promise<{ name: string; addressLine: string; city: string; postcode?: string }> => {
    const isGeneric = (str?: string): boolean => {
      if (!str) return true;
      const s = str.trim().toLowerCase();
      return (
        s === '' ||
        s === 'india' ||
        s.includes('mainland india') ||
        s === 'unnamed road'
      );
    };

    // 1. OpenStreetMap Nominatim (Granular, accurate, real neighborhood/suburb names)
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (nomRes.ok) {
        const nom = await nomRes.json();
        if (nom && nom.address) {
          const addr = nom.address;
          const suburb = !isGeneric(addr.suburb) ? addr.suburb : '';
          const neighbourhood = !isGeneric(addr.neighbourhood) ? addr.neighbourhood : '';
          const residential = !isGeneric(addr.residential) ? addr.residential : '';
          const road = !isGeneric(addr.road) ? addr.road : '';
          const village = !isGeneric(addr.village) ? addr.village : '';
          const cityDistrict = !isGeneric(addr.city_district) ? addr.city_district : '';
          const town = !isGeneric(addr.town) ? addr.town : '';
          const city = !isGeneric(addr.city) ? addr.city : town || addr.county || '';
          const state = !isGeneric(addr.state) ? addr.state : '';
          const postcode = addr.postcode || '';

          // The primary short locality for the header
          const shortName =
            suburb ||
            neighbourhood ||
            residential ||
            road ||
            village ||
            cityDistrict ||
            town ||
            city ||
            'Current Location';

          // Descriptive address line
          const addressParts = [
            road,
            suburb || neighbourhood || residential,
            city,
            state,
          ].filter(Boolean);
          const addressLine =
            addressParts.length > 0
              ? addressParts.join(', ') + (postcode ? ` - ${postcode}` : '')
              : nom.display_name || shortName;

          return {
            name: shortName,
            addressLine: cleanLocationString(addressLine),
            city,
            postcode,
          };
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse geocoder error, trying BigDataCloud fallback:', err);
    }

    // 2. BigDataCloud free client reverse geocoder fallback
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        const locality = !isGeneric(bdc.locality) ? bdc.locality : '';
        const city = !isGeneric(bdc.city) ? bdc.city : '';
        const sub = !isGeneric(bdc.principalSubdivision) ? bdc.principalSubdivision : '';
        const postcode = bdc.postcode ? ` - ${bdc.postcode}` : '';

        // Extract most descriptive street/road if available
        let road = '';
        if (bdc.localityInfo?.informative) {
          const roadObj = bdc.localityInfo.informative.find(
            (i: any) =>
              !isGeneric(i.name) &&
              (i.description?.toLowerCase().includes('road') || i.order >= 4)
          );
          if (roadObj && roadObj.name) road = roadObj.name;
        }

        const shortName = locality || road || city || sub || 'Current Location';
        const addressParts = [road, locality, city, sub].filter(Boolean);
        const addressLine =
          addressParts.length > 0 ? addressParts.join(', ') + postcode : shortName;

        return {
          name: shortName,
          addressLine: cleanLocationString(addressLine),
          city,
          postcode: bdc.postcode,
        };
      }
    } catch (err) {
      console.warn('BigDataCloud geocoder error:', err);
    }

    // 3. Fallback coordinate
    return {
      name: `GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      addressLine: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      city: '',
    };
  };

  // Real device GPS detection
  const detectGpsLocation = useCallback(async (): Promise<UserLocation | null> => {
    setIsDetecting(true);

    if (!('geolocation' in navigator)) {
      toast.error('Location Error', 'Geolocation is not supported by your browser');
      setIsDetecting(false);
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Call free reverse geocoding API
          const geo = await reverseGeocode(lat, lng);

          const detected: UserLocation = {
            name: geo.name,
            addressLine: geo.addressLine,
            latitude: lat,
            longitude: lng,
            isGps: true,
            city: geo.city,
            postalCode: geo.postcode,
          };

          setLocation(detected);
          toast.success('Exact Location Detected', geo.name);
          setIsDetecting(false);

          // Fetch real nearby places around the newly detected GPS point
          fetchNearbyPlaces(lat, lng);

          resolve(detected);
        },
        (error) => {
          console.warn('Geolocation permission denied or failed:', error.message);
          let message = 'Could not access device GPS.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'GPS permission was denied. Please search or select an address below.';
          }
          toast.info('GPS Unavailable', message);
          setIsDetecting(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [setLocation, fetchNearbyPlaces, toast]);

  // Free API 3: Live Address & Locality Search via OpenStreetMap Nominatim + Photon
  const searchLocalities = useCallback(async (query: string): Promise<UserLocation[]> => {
    if (!query || !query.trim()) return [];
    const q = query.trim();

    try {
      // 1. Try Nominatim with countrycodes=in
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&countrycodes=in&limit=8&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );

      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((item: any) => {
            const addr = item.address || {};
            const shortName =
              addr.road ||
              addr.suburb ||
              addr.neighbourhood ||
              item.name ||
              item.display_name.split(',')[0];

            return {
              name: cleanLocationString(shortName),
              addressLine: cleanLocationString(item.display_name),
              latitude: Number(item.lat),
              longitude: Number(item.lon),
              isGps: false,
              city: addr.city || addr.town || addr.county || '',
              postalCode: addr.postcode,
            };
          });
        }
      }
    } catch (e) {
      console.warn('Nominatim search error, trying Photon fallback:', e);
    }

    // 2. Photon API fallback for fast auto-complete
    try {
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`
      );
      if (photonRes.ok) {
        const data = await photonRes.json();
        if (data.features && Array.isArray(data.features)) {
          return data.features.map((f: any) => {
            const props = f.properties || {};
            const title = props.name || props.street || props.city || q;
            const subtitle = [props.street, props.district, props.city, props.state]
              .filter(Boolean)
              .join(', ');

            return {
              name: title,
              addressLine: subtitle || title,
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0],
              isGps: false,
              city: props.city,
              postalCode: props.postcode,
            };
          });
        }
      }
    } catch {
      // fallback
    }

    return [];
  }, []);

  // On initial mount: if no saved location in storage, automatically detect real device GPS
  useEffect(() => {
    if (!currentLocation && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      detectGpsLocation();
    }
  }, []);

  // Fetch nearby places around current location whenever valid coordinates exist
  useEffect(() => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      fetchNearbyPlaces(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation?.latitude, currentLocation?.longitude, fetchNearbyPlaces]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        recentLocations,
        nearbyLocalities,
        isDetecting,
        detectGpsLocation,
        setLocation,
        updateManualLocation,
        searchLocalities,
        fetchNearbyPlaces,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
