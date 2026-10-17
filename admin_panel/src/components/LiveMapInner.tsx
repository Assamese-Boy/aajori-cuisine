'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface LiveMapInnerProps {
  mapData: any;
}

export const LiveMapInner: React.FC<LiveMapInnerProps> = ({ mapData }) => {
  const mapCenter: [number, number] = React.useMemo(() => {
    if (mapData?.restaurants?.length > 0) {
      for (const r of mapData.restaurants) {
        const lat = r.latitude ?? r.lat ?? r.location?.latitude;
        const lng = r.longitude ?? r.lng ?? r.location?.longitude;
        if (lat && lng) return [lat, lng];
      }
    }
    if (mapData?.zones?.length > 0) {
      for (const z of mapData.zones) {
        const lat = z.latitude ?? z.centerPoint?.latitude ?? z.center?.latitude;
        const lng = z.longitude ?? z.centerPoint?.longitude ?? z.center?.longitude;
        if (lat && lng) return [lat, lng];
      }
    }
    if (mapData?.riders?.length > 0) {
      for (const rd of mapData.riders) {
        const lat = rd.lat ?? rd.currentLat ?? rd.currentLocation?.latitude;
        const lng = rd.lng ?? rd.currentLng ?? rd.currentLocation?.longitude;
        if (lat && lng) return [lat, lng];
      }
    }
    return [26.16, 91.76];
  }, [mapData]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapData?.restaurants?.length > 0 || mapData?.zones?.length > 0 ? 13 : 11}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Delivery Zone Radius Circles from Database */}
      {mapData?.zones?.map((zone: any, idx: number) => {
        const lat = zone.latitude ?? zone.centerPoint?.latitude ?? zone.center?.latitude;
        const lng = zone.longitude ?? zone.centerPoint?.longitude ?? zone.center?.longitude;
        if (!lat || !lng) return null;
        const radius = (zone.maxDeliveryDistanceKm ?? zone.radiusKm ?? 5) * 1000;

        return (
          <Circle
            key={zone.id || `zone_${idx}`}
            center={[lat, lng]}
            radius={radius}
            pathOptions={{
              color: '#f97316',
              fillColor: '#ea580c',
              fillOpacity: 0.05,
              dashArray: '4, 8',
            }}
          />
        );
      })}

      {/* Restaurant Pins with Real GIS Coordinates */}
      {mapData?.restaurants?.map((r: any, idx: number) => {
        const lat = r.latitude ?? r.lat ?? r.location?.latitude;
        const lng = r.longitude ?? r.lng ?? r.location?.longitude;
        if (!lat || !lng) return null;

        return (
          <Marker
            key={r.id || `rest_${idx}`}
            position={[lat, lng]}
            icon={restaurantIcon}
          >
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                <p className="text-slate-500">{r.address || r.city || 'Restaurant'}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="font-semibold text-brand-700">
                    Status: {r.isOpen ? 'Open' : 'Closed'}
                  </span>
                  <span className="text-slate-600 font-mono">
                    Rating: {r.rating || 5.0}★
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Online Riders Pins with Real GIS GPS Telemetry */}
      {mapData?.riders
        ?.filter((rd: any) => {
          const status = rd.shiftStatus ?? rd.status;
          return status !== 'OFFLINE';
        })
        ?.map((rd: any, idx: number) => {
          const lat = rd.lat ?? rd.currentLat ?? rd.currentLocation?.latitude ?? rd.location?.latitude;
          const lng = rd.lng ?? rd.currentLng ?? rd.currentLocation?.longitude ?? rd.location?.longitude;
          if (!lat || !lng) return null;

          const riderName = rd.name || rd.fullName || 'Delivery Partner';
          const riderStatus = rd.shiftStatus || rd.status || 'ONLINE';
          const vehicle = rd.vehicleNumber || rd.vehicleType || 'Bike';

          return (
            <Marker
              key={rd.id || `rider_${idx}`}
              position={[lat, lng]}
              icon={riderIcon}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <p className="font-bold text-slate-900 text-sm">{riderName}</p>
                  <p className="text-slate-600">Vehicle: {vehicle}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-semibold text-blue-700">{riderStatus}</span>
                    <span className="text-slate-600 font-mono">{rd.phone}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* Active Orders Dropoff Pins */}
      {mapData?.activeOrders?.map((ord: any, idx: number) => {
        const lat = ord.deliveryAddress?.latitude ?? ord.deliveryAddress?.location?.latitude;
        const lng = ord.deliveryAddress?.longitude ?? ord.deliveryAddress?.location?.longitude;
        if (!lat || !lng) return null;

        return (
          <Marker
            key={ord.id || `ord_${idx}`}
            position={[lat, lng]}
            icon={orderIcon}
          >
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <p className="font-bold font-mono text-slate-900">{ord.orderNumber || ord.id}</p>
                <p className="text-slate-600">{ord.deliveryAddress?.addressLine1 || ord.deliveryAddress?.city || 'Delivery Address'}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="font-semibold text-emerald-700">{ord.status || 'ACTIVE'}</span>
                  <span className="font-mono font-bold">₹{ord.pricing?.totalCustomerPrice ?? 0}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default LiveMapInner;
