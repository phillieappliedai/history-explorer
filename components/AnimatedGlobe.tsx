'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, type MapRef } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { useAnimationStore } from '@/lib/animationEngine';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface AnimatedGlobeProps {
  onMapLoad?: () => void;
}

export default function AnimatedGlobe({ onMapLoad }: AnimatedGlobeProps) {
  const mapRef = useRef<MapRef>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    sequence,
    currentTime,
    currentCityStates,
    currentTerritoryGeometry,
    targetViewState
  } = useAnimationStore();

  // Initial view state
  const [viewState, setViewState] = useState({
    longitude: 85,
    latitude: 44,
    zoom: 3,
    pitch: 0,
    bearing: 0
  });

  // Update view state when target changes (camera movements)
  useEffect(() => {
    if (targetViewState && mapRef.current) {
      mapRef.current.flyTo({
        center: [targetViewState.longitude, targetViewState.latitude],
        zoom: targetViewState.zoom,
        pitch: targetViewState.pitch ?? 0,
        bearing: targetViewState.bearing ?? 0,
        duration: 2000,
        essential: true
      });
    }
  }, [targetViewState]);

  // Initialize deck.gl overlay when map is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) {
      console.log('Waiting for map to load...', { mapLoaded, hasMapRef: !!mapRef.current });
      return;
    }

    if (deckOverlayRef.current) {
      console.log('deck.gl overlay already initialized');
      return;
    }

    console.log('Initializing deck.gl overlay...');

    const map = mapRef.current.getMap();

    const overlay = new MapboxOverlay({
      interleaved: false, // Render on top of map
      layers: []
    });

    deckOverlayRef.current = overlay;

    try {
      map.addControl(overlay as any);
      console.log('✅ deck.gl overlay added successfully!');
    } catch (error) {
      console.error('❌ Failed to add deck.gl overlay:', error);
    }

    return () => {
      if (deckOverlayRef.current) {
        try {
          map.removeControl(deckOverlayRef.current as any);
          console.log('deck.gl overlay removed');
        } catch (error) {
          console.error('Failed to remove deck.gl overlay:', error);
        }
      }
    };
  }, [mapLoaded]);

  // Update deck.gl layers when animation state changes
  useEffect(() => {
    if (!deckOverlayRef.current) {
      console.warn('deckOverlayRef is null, skipping layer update');
      return;
    }

    if (!sequence) {
      console.warn('sequence is null, skipping layer update');
      return;
    }

    console.log('=== UPDATING DECK.GL LAYERS ===');
    console.log('Current time:', currentTime);
    console.log('Sequence loaded:', sequence.id);

    const layers = [];

    // ======================================================================
    // 1. Territory Layer (Polygons)
    // ======================================================================
    if (currentTerritoryGeometry) {
      layers.push(
        new GeoJsonLayer({
          id: 'territory-layer',
          data: {
            type: 'Feature',
            geometry: currentTerritoryGeometry.geometry,
            properties: {}
          },
          filled: true,
          stroked: true,
          getFillColor: currentTerritoryGeometry.fillColor,
          getLineColor: currentTerritoryGeometry.lineColor,
          getLineWidth: 4, // Thicker borders
          lineWidthMinPixels: 3,
          pickable: true,
          updateTriggers: {
            getFillColor: [currentTerritoryGeometry.fillColor],
            getLineColor: [currentTerritoryGeometry.lineColor]
          }
        })
      );
    }

    // ======================================================================
    // 2. Army Movement Paths (TripsLayer)
    // ======================================================================
    const tripsData = sequence.armies.map(army => ({
      path: army.path.map(([lng, lat]) => [lng, lat, 0]), // Add altitude
      timestamps: army.timestamps,
      color: hexToRgb(army.style.color),
      width: army.style.width
    }));

    layers.push(
      new TripsLayer({
        id: 'trips-layer',
        data: tripsData,
        getPath: (d: any) => d.path,
        getTimestamps: (d: any) => d.timestamps,
        getColor: (d: any) => d.color,
        getWidth: (d: any) => d.width * 3, // Much thicker lines
        widthMinPixels: 8, // Thicker minimum width
        jointRounded: true,
        capRounded: true,
        trailLength: 20, // Longer trail
        currentTime,
        shadowEnabled: false,
        updateTriggers: {
          currentTime: [currentTime]
        }
      })
    );

    // ======================================================================
    // 3. City Markers (ScatterplotLayer - circles)
    // ======================================================================
    const citiesData = sequence.cities.map(city => {
      const state = currentCityStates.get(city.id) || 'neutral';
      const event = city.events.find(e => e.timestamp <= currentTime && e.state === state);

      return {
        position: city.location,
        name: city.name,
        state,
        size: event?.iconSize || 20,
        color: getCityColor(state)
      };
    });

    layers.push(
      new ScatterplotLayer({
        id: 'cities-layer',
        data: citiesData,
        getPosition: (d: any) => d.position,
        getRadius: (d: any) => d.size * 5000, // Much larger radius
        getFillColor: (d: any) => d.color,
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 3,
        stroked: true,
        filled: true,
        radiusMinPixels: 15, // Bigger minimum size
        radiusMaxPixels: 60,
        pickable: true,
        updateTriggers: {
          getRadius: [currentTime],
          getFillColor: [currentTime]
        }
      })
    );

    // Add a test layer that's DEFINITELY visible
    layers.push(
      new ScatterplotLayer({
        id: 'test-layer',
        data: [
          { position: [85, 44], color: [255, 0, 0, 255] }, // Red dot in Central Asia
          { position: [0, 0], color: [0, 255, 0, 255] },   // Green dot at origin
          { position: [100, 40], color: [0, 0, 255, 255] } // Blue dot in China
        ],
        getPosition: (d: any) => d.position,
        getRadius: 500000, // Huge radius
        getFillColor: (d: any) => d.color,
        radiusMinPixels: 30,
        radiusMaxPixels: 100,
        pickable: true
      })
    );

    console.log('Setting layers:', layers.length, 'layers');
    console.log('Current time:', currentTime);
    console.log('Cities data:', citiesData.length, 'cities');
    console.log('Trips data:', tripsData.length, 'army paths');

    // Update the overlay with new layers
    deckOverlayRef.current.setProps({ layers });
  }, [sequence, currentTime, currentCityStates, currentTerritoryGeometry]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-2">Mapbox token not configured</p>
          <p className="text-sm text-gray-400">
            Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: 'globe' } as any}
        onLoad={() => {
          console.log('Map loaded!');
          setMapLoaded(true);
          if (onMapLoad) onMapLoad();
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* deck.gl layers are added via MapboxOverlay control */}
      </Map>

      {/* Debug info overlay */}
      {sequence && (
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-sm text-white">
          <div className="font-semibold mb-1">{sequence.title}</div>
          <div className="text-xs text-gray-400">
            <div>Time: {currentTime.toFixed(1)}/100</div>
            <div>Year: {useAnimationStore.getState().currentYear}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [255, 255, 255];
}

function getCityColor(state: string): [number, number, number, number] {
  const colors: Record<string, [number, number, number, number]> = {
    neutral: [200, 200, 200, 255],
    under_siege: [255, 68, 68, 255],
    conquered: [210, 105, 30, 255],
    allied: [65, 105, 225, 255],
    mongol_capital: [255, 215, 0, 255]
  };
  return colors[state] || colors.neutral;
}
