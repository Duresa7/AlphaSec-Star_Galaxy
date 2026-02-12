export const AMBIENT_LIGHT = {
  galaxy: {
    intensity: 0.3,
    color: '#404060',
  },
  system: {
    intensity: 0.4,
    color: '#606080',
  },
};
export const DIRECTIONAL_LIGHT = {
  galaxy: {
    intensity: 0.6,
    color: '#FFF5E6',
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
    color: '#FFFAF0',
    position: [20, 15, 20] as [number, number, number],
    castShadow: true,
  },
};
export const POINT_LIGHTS = {
  galaxy: [
    {
      name: 'core',
      position: [0, 15, 0] as [number, number, number],
      intensity: 0.8,
      color: '#FFD700',
      distance: 120,
      decay: 2,
    },
    {
      name: 'sith',
      position: [50, 8, 30] as [number, number, number],
      intensity: 0.4,
      color: '#DC143C',
      distance: 80,
      decay: 2,
    },
    {
      name: 'republic',
      position: [-30, 8, -20] as [number, number, number],
      intensity: 0.35,
      color: '#4169E1',
      distance: 70,
      decay: 2,
    },
  ],
  system: [
    {
      name: 'star',
      position: [15, 10, 15] as [number, number, number],
      intensity: 1.5,
      color: '#FFF8DC',
      distance: 60,
      decay: 2,
    },
    {
      name: 'fill',
      position: [-10, 5, -10] as [number, number, number],
      intensity: 0.3,
      color: '#87CEEB',
      distance: 40,
      decay: 2,
    },
  ],
};
export const HEMISPHERE_LIGHT = {
  galaxy: {
    skyColor: '#1a1a3e',
    groundColor: '#0a0a15',
    intensity: 0.25,
  },
  system: {
    skyColor: '#2a2a4e',
    groundColor: '#151520',
    intensity: 0.3,
  },
};
export const BACKGROUND_COLOR = '#030308';
