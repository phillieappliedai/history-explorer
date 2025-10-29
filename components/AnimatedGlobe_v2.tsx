'use client';

import { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ScatterplotLayer, IconLayer, TextLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { Map } from 'react-map-gl/mapbox';
import { useAnimationStore } from '@/lib/animationEngine';
import type { ArmyPath } from '@/lib/types';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface AnimatedGlobeProps {
  onMapLoad?: () => void;
}

export default function AnimatedGlobe({ onMapLoad }: AnimatedGlobeProps) {
  const {
    sequence,
    currentTime,
    currentCityStates,
    currentTerritoryGeometry,
    targetViewState
  } = useAnimationStore();

  const [viewState, setViewState] = useState({
    longitude: 85,
    latitude: 44,
    zoom: 3,
    pitch: 0,
    bearing: 0
  });

  console.log('Rendering AnimatedGlobe with currentTime:', currentTime);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-2">Mapbox token not configured</p>
        </div>
      </div>
    );
  }

  const layers = [];

  if (sequence) {
    console.log('Creating layers for sequence:', sequence.id);

    // Territory layer
    if (currentTerritoryGeometry) {
      layers.push(
        new GeoJsonLayer({
          id: 'territory',
          data: {
            type: 'Feature',
            geometry: currentTerritoryGeometry.geometry,
            properties: {}
          },
          filled: true,
          stroked: true,
          getFillColor: currentTerritoryGeometry.fillColor,
          getLineColor: currentTerritoryGeometry.lineColor,
          getLineWidth: 5,
          lineWidthMinPixels: 3
        })
      );
    }

    // Cities
    const citiesData = sequence.cities.map(city => {
      const state = currentCityStates.get(city.id) || 'neutral';
      const event = city.events.find(e => e.timestamp <= currentTime && e.state === state);
      return {
        position: city.location,
        name: city.name,
        size: event?.iconSize || 20,
        color: getCityColor(state)
      };
    });

    layers.push(
      new ScatterplotLayer({
        id: 'cities',
        data: citiesData,
        getPosition: (d: any) => d.position,
        getRadius: (d: any) => d.size * 5000,
        getFillColor: (d: any) => d.color,
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 3,
        stroked: true,
        radiusMinPixels: 15,
        radiusMaxPixels: 60,
        pickable: true
      })
    );

    // Army visualization (as particle swarms)
    const armyParticlesData: any[] = [];

    sequence.armies.forEach(army => {
      const position = interpolateArmyPosition(army, currentTime);
      if (!position) return;

      const scale = calculateArmyScale(army.troopCount);
      const color = hexToRgb(army.style.color);

      // Create multiple particles to represent the army
      const particleCount = Math.ceil(scale * 3); // More troops = more particles

      for (let i = 0; i < particleCount; i++) {
        // Spread particles in a formation around the center
        const angle = (i / particleCount) * Math.PI * 2;
        const spread = 0.05 * scale; // Formation size based on troop count

        const offsetLng = Math.cos(angle) * spread;
        const offsetLat = Math.sin(angle) * spread;

        armyParticlesData.push({
          position: [position[0] + offsetLng, position[1] + offsetLat],
          color: [...color, 255],
          size: 8000 * scale,
          army: army.name
        });
      }
    });

    if (armyParticlesData.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: 'army-particles',
          data: armyParticlesData,
          getPosition: (d: any) => d.position,
          getRadius: (d: any) => d.size,
          getFillColor: (d: any) => d.color,
          getLineColor: [255, 255, 255, 200],
          lineWidthMinPixels: 2,
          stroked: true,
          filled: true,
          radiusMinPixels: 8,
          radiusMaxPixels: 40,
          pickable: true
        })
      );
    }

    // Army paths (keep for trail effect)
    const tripsData = sequence.armies.map(army => ({
      path: army.path.map(([lng, lat]) => [lng, lat, 0]),
      timestamps: army.timestamps,
      color: hexToRgb(army.style.color),
      width: army.style.width
    }));

    layers.push(
      new TripsLayer({
        id: 'armies',
        data: tripsData,
        getPath: (d: any) => d.path,
        getTimestamps: (d: any) => d.timestamps,
        getColor: (d: any) => [...d.color, 128], // Make semi-transparent
        getWidth: (d: any) => d.width * 2,
        widthMinPixels: 4,
        jointRounded: true,
        capRounded: true,
        trailLength: 20,
        currentTime
      })
    );
  }

  console.log('Total layers:', layers.length);

  return (
    <div className="w-full h-full relative">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }: any) => setViewState(viewState)}
        controller={true}
        layers={layers}
        getTooltip={({ object }: any) => object && object.name}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          projection={{ name: 'globe' } as any}
        />
      </DeckGL>

      {/* Debug info */}
      {sequence && (
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-sm text-white">
          <div className="font-semibold mb-1">{sequence.title}</div>
          <div className="text-xs text-gray-400">
            <div>Time: {currentTime.toFixed(1)}/100</div>
            <div>Year: {useAnimationStore.getState().currentYear}</div>
            <div>Layers: {layers.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Army Icon Helpers
// ============================================================================

function interpolateArmyPosition(army: ArmyPath, currentTime: number): [number, number] | null {
  // Find which segment of the path we're on
  for (let i = 0; i < army.timestamps.length - 1; i++) {
    const t1 = army.timestamps[i];
    const t2 = army.timestamps[i + 1];

    if (currentTime >= t1 && currentTime <= t2) {
      // Interpolate between points
      const progress = (currentTime - t1) / (t2 - t1);
      const [lng1, lat1] = army.path[i];
      const [lng2, lat2] = army.path[i + 1];

      const lng = lng1 + (lng2 - lng1) * progress;
      const lat = lat1 + (lat2 - lat1) * progress;

      return [lng, lat];
    }
  }

  // If before start, return null
  if (currentTime < army.timestamps[0]) {
    return null;
  }

  // If after end, return last position
  if (currentTime >= army.timestamps[army.timestamps.length - 1]) {
    return army.path[army.path.length - 1];
  }

  return null;
}

function calculateBearing(army: ArmyPath, currentTime: number): number {
  // Find which segment we're on
  for (let i = 0; i < army.timestamps.length - 1; i++) {
    const t1 = army.timestamps[i];
    const t2 = army.timestamps[i + 1];

    if (currentTime >= t1 && currentTime <= t2) {
      const [lng1, lat1] = army.path[i];
      const [lng2, lat2] = army.path[i + 1];

      // Calculate bearing (angle from north)
      const dLng = lng2 - lng1;
      const dLat = lat2 - lat1;

      let bearing = Math.atan2(dLng, dLat) * (180 / Math.PI);
      return bearing;
    }
  }

  return 0;
}

function getArmyIcon(army: ArmyPath): string {
  const { cavalry, infantry, siege } = army.composition;

  // Determine dominant unit type
  if (cavalry > infantry && cavalry > siege) {
    return '🏇'; // Cavalry dominant
  } else if (infantry > cavalry && infantry > siege) {
    return '🚶'; // Infantry dominant
  } else if (siege > 0 && siege > cavalry * 0.5) {
    return '⚔️'; // Siege equipment present
  } else {
    return '🏇'; // Default to cavalry
  }
}

function calculateArmyScale(troopCount: number): number {
  // Scale based on troop count
  // 10k troops = 1x, 100k troops = 2x, 200k troops = 3x
  const scale = Math.max(1, Math.min(4, troopCount / 50000));
  return scale;
}

// ============================================================================
// Color Helpers
// ============================================================================

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
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
