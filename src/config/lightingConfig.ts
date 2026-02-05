/**
 * Centralized lighting configuration for the Star Wars Galaxy Map
 * This file contains all lighting-related settings for easy tuning
 */

// Ambient light settings
export const AMBIENT_LIGHT = {
  galaxy: {
    intensity: 0.3,
    color: '#404060', // Slight blue tint for space atmosphere
  },
  system: {
    intensity: 0.4,
    color: '#606080',
  },
  planet: {
    intensity: 0.2,
    color: '#404050',
  },
};

// Main directional light (simulates distant star illumination)
export const DIRECTIONAL_LIGHT = {
  galaxy: {
    intensity: 0.6,
    color: '#FFF5E6', // Warm white starlight
    position: [50, 100, 50] as [number, number, number],
    castShadow: true,
    shadow: {
      mapSize: 2048,
      camera: {
        near: 0.5,
        far: 500,
        left: -100,
        right: 100,
        top: 100,
        bottom: -100,
      },
    },
  },
  system: {
    intensity: 1.2,
    color: '#FFFAF0', // Slightly warmer for star proximity
    position: [20, 15, 20] as [number, number, number],
    castShadow: true,
  },
};

// Point lights for atmospheric effects
export const POINT_LIGHTS = {
  galaxy: [
    {
      name: 'core',
      position: [0, 15, 0] as [number, number, number],
      intensity: 0.8,
      color: '#FFD700', // Gold - galactic core
      distance: 120,
      decay: 2,
    },
    {
      name: 'sith',
      position: [50, 8, 30] as [number, number, number],
      intensity: 0.4,
      color: '#DC143C', // Crimson - Sith Empire territory
      distance: 80,
      decay: 2,
    },
    {
      name: 'republic',
      position: [-30, 8, -20] as [number, number, number],
      intensity: 0.35,
      color: '#4169E1', // Royal Blue - Republic territory
      distance: 70,
      decay: 2,
    },
  ],
  system: [
    {
      name: 'star',
      position: [15, 10, 15] as [number, number, number],
      intensity: 1.5,
      color: '#FFF8DC', // Cornsilk - nearby star
      distance: 60,
      decay: 2,
    },
    {
      name: 'fill',
      position: [-10, 5, -10] as [number, number, number],
      intensity: 0.3,
      color: '#87CEEB', // Sky blue - fill light
      distance: 40,
      decay: 2,
    },
  ],
};

// Hemisphere light for subtle sky/ground gradient
export const HEMISPHERE_LIGHT = {
  galaxy: {
    skyColor: '#1a1a3e', // Dark blue space
    groundColor: '#0a0a15', // Near black
    intensity: 0.25,
  },
  system: {
    skyColor: '#2a2a4e',
    groundColor: '#151520',
    intensity: 0.3,
  },
};

// Environment/HDRI settings
export const ENVIRONMENT = {
  preset: 'night' as const, // drei preset
  background: false,
  blur: 0.5,
  intensity: 0.3, // Subtle reflections
};

// Renderer/tone mapping settings
export const RENDERER_CONFIG = {
  toneMapping: 'ACESFilmic' as const,
  toneMappingExposure: 1.0,
  outputColorSpace: 'srgb' as const,
};

// Fog settings
export const FOG = {
  color: '#050510',
  near: 100,
  far: 400,
};

// Background color
export const BACKGROUND_COLOR = '#030308';
