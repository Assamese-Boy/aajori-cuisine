import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { apiRequest } from '../services/api';
import { Store, Bike, MapPin, RefreshCw, Battery, Radio } from 'lucide-react';

// Custom icons using standard SVG markers for Leaflet
const createIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 11px;
    ">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const restaurantIcon = createIcon('#ea580c', 'R');
const riderIcon = createIcon('#2563eb', 'B');
const orderIcon = createIcon('#10b981', 'D');

export const LiveMapPage: React.FC = () => {
  const [mapData, setMapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMapData = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/admin/live-map');
      if (res.success) {
        setMapData(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(fetchMapData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const guwahatiCenter: [number, number] = [26.16, 91.765];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Live GIS Operations Map</h2>
          <p className="text-sm text-slate-500">
            Real-time geospatial fleet tracking, restaurant nodes & active deliveries (Kamrup Metro)
          </p>
        </div>

        <button
          onClick={fetchMapData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
          Refresh GIS Telemetry
        </button>
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-brand-600"></span>
          <span>Restaurants ({mapData?.restaurants?.length || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600"></span>
          <span>Riders Online ({mapData?.riders?.filter((r: any) => r.shiftStatus !== 'OFFLINE').length || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
          <span>Active Orders ({mapData?.activeOrders?.length || 0})</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 border-l pl-4">
          <span>Engine: OpenStreetMap + PostGIS Projection</span>
        </div>
      </div>

      {/* Live Map Frame */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[620px] relative z-0">
        <MapContainer
          center={guwahatiCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Delivery Zone Radius Circles */}
          {mapData?.zones?.map((zone: any) => (
            <Circle
              key={zone.id}
              center={[zone.centerPoint.latitude, zone.centerPoint.longitude]}
              radius={zone.maxDeliveryDistanceKm * 1000}
              pathOptions={{
                color: '#f97316',
                fillColor: '#ea580c',
                fillOpacity: 0.05,
                dashArray: '4, 8',
              }}
            />
          ))}

          {/* Restaurant Pins */}
          {mapData?.restaurants?.map((r: any) => (
            <Marker
              key={r.id}
              position={[r.location.latitude, r.location.longitude]}
              icon={restaurantIcon}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                  <p className="text-slate-500">{r.addressLine}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-semibold text-brand-700">
                      Active Orders: {r.activeOrderCount}
                    </span>
                    <span className="text-slate-600 font-mono">Prep: ~{r.avgPrepTimeMinutes}m</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Online Riders Pins */}
          {mapData?.riders
            ?.filter((rd: any) => rd.shiftStatus !== 'OFFLINE' && rd.currentLocation)
            ?.map((rd: any) => (
              <Marker
                key={rd.id}
                position={[rd.currentLocation.latitude, rd.currentLocation.longitude]}
                icon={riderIcon}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <p className="font-bold text-slate-900 text-sm">{rd.user?.fullName || 'Rider'}</p>
                    <p className="text-slate-600">Vehicle: {rd.vehicleNumber}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="font-semibold text-blue-700">{rd.shiftStatus}</span>
                      <span className="text-slate-600">Battery: {rd.batteryPercentage}%</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Active Orders Dropoff Pins */}
          {mapData?.activeOrders?.map((ord: any) => (
            <Marker
              key={ord.id}
              position={[
                ord.deliveryAddress.location?.latitude || 26.155,
                ord.deliveryAddress.location?.longitude || 91.769,
              ]}
              icon={orderIcon}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <p className="font-bold font-mono text-slate-900">{ord.orderNumber}</p>
                  <p className="text-slate-600">{ord.deliveryAddress?.addressLine1}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-semibold text-emerald-700">{ord.status}</span>
                    <span className="font-mono font-bold">₹{ord.pricing?.totalCustomerPrice}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
