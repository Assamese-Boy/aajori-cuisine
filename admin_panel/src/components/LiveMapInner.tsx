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
  const guwahatiCenter: [number, number] = [26.16, 91.765];

  return (
    <MapContainer
      center={guwahatiCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Delivery Zone Radius Circles with safe coordinate fallbacks */}
      {mapData?.zones?.map((zone: any, idx: number) => {
        const lat = zone.centerPoint?.latitude ?? zone.center?.latitude ?? 26.16;
        const lng = zone.centerPoint?.longitude ?? zone.center?.longitude ?? 91.765;
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

      {/* Restaurant Pins with safe location access */}
      {mapData?.restaurants?.map((r: any, idx: number) => {
        const lat = r.location?.latitude ?? 26.16;
        const lng = r.location?.longitude ?? 91.76;

        return (
          <Marker
            key={r.id || `rest_${idx}`}
            position={[lat, lng]}
            icon={restaurantIcon}
          >
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                <p className="text-slate-500">{r.addressLine || 'Guwahati District'}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="font-semibold text-brand-700">
                    Active Orders: {r.activeOrderCount ?? 0}
                  </span>
                  <span className="text-slate-600 font-mono">
                    Prep: ~{r.avgPrepTimeMinutes ?? 20}m
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Online Riders Pins with safe location access */}
      {mapData?.riders
        ?.filter((rd: any) => {
          const status = rd.shiftStatus ?? rd.status;
          return status !== 'OFFLINE';
        })
        ?.map((rd: any, idx: number) => {
          const lat = rd.currentLocation?.latitude ?? rd.location?.latitude;
          const lng = rd.currentLocation?.longitude ?? rd.location?.longitude;
          if (!lat || !lng) return null;

          const riderName = rd.user?.fullName || rd.fullName || rd.name || 'Delivery Partner';
          const riderStatus = rd.shiftStatus || rd.status || 'ONLINE';
          const vehicle = rd.vehicleNumber || rd.vehicleType || 'Bike';
          const battery = rd.batteryPercentage ?? 90;

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
                    <span className="text-slate-600">Battery: {battery}%</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* Active Orders Dropoff Pins */}
      {mapData?.activeOrders?.map((ord: any, idx: number) => {
        const lat = ord.deliveryAddress?.location?.latitude ?? 26.155;
        const lng = ord.deliveryAddress?.location?.longitude ?? 91.769;

        return (
          <Marker
            key={ord.id || `ord_${idx}`}
            position={[lat, lng]}
            icon={orderIcon}
          >
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <p className="font-bold font-mono text-slate-900">{ord.orderNumber || ord.id}</p>
                <p className="text-slate-600">{ord.deliveryAddress?.addressLine1 || 'Kamrup Metro'}</p>
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
