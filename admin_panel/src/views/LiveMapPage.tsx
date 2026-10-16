'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { apiRequest } from '../services/api';
import { RefreshCw, MapPin, Loader2 } from 'lucide-react';
import { MapErrorBoundary } from '../components/MapErrorBoundary';

// Dynamically import Leaflet map with SSR disabled to guarantee no server-side crashes
const LiveMapInner = dynamic(() => import('../components/LiveMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[620px] rounded-xl border border-slate-200 bg-slate-100 flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      <p className="text-xs font-semibold text-slate-600">Initializing GIS Map Engine & PostGIS layers...</p>
    </div>
  ),
});

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
  }, []);

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
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 shadow-xs rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
          Refresh GIS Telemetry
        </button>
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-brand-600"></span>
          <span>Restaurants ({mapData?.restaurants?.length || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600"></span>
          <span>
            Riders Online (
            {mapData?.riders?.filter((r: any) => (r.shiftStatus || r.status) !== 'OFFLINE').length || 0}
            )
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
          <span>Active Orders ({mapData?.activeOrders?.length || 0})</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 border-l pl-4">
          <span>Engine: OpenStreetMap + PostGIS Projection</span>
        </div>
      </div>

      {/* Live Map Frame with Error Boundary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden h-[620px] relative z-0">
        <MapErrorBoundary>
          <LiveMapInner mapData={mapData} />
        </MapErrorBoundary>
      </div>
    </div>
  );
};

export default LiveMapPage;
