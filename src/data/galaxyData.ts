import * as THREE from 'three';
import type { StarSystem, Anomaly, Fleet } from '@/types';

// ============================================
// STAR SYSTEMS - Old Republic Era (~4000-3950 BBY)
// ============================================

export const starSystems: StarSystem[] = [
  {
    id: 'tython',
    name: 'Tython',
    position: new THREE.Vector3(30, 0, 45),
    faction: 'galactic_republic',
    starType: 'yellow',
    importance: 'major',
    description: 'Ancient birthplace of the Jedi Order. Home to the Jedi Temple and training grounds.',
    region: 'deep_core',
    planets: [
      {
        id: 'tython-prime',
        name: 'Tython',
        type: 'terrestrial',
        position: new THREE.Vector3(0, 0, 0),
        radius: 1,
        faction: 'galactic_republic',
        description: 'Force-rich world where the Jedi Order was founded.',
        climate: 'Temperate',
        terrain: 'Mountains, forests, ruins',
        systemId: 'tython',
      }
    ],
  },
  {
    id: 'coruscant',
    name: 'Coruscant',
    position: new THREE.Vector3(0, 0, 0),
    faction: 'galactic_republic',
    starType: 'yellow',
    importance: 'capital',
    description: 'Capital of the Galactic Republic. Seat of the Senate and Jedi Temple.',
    region: 'core_worlds',
    planets: [
      {
        id: 'coruscant-prime',
        name: 'Coruscant',
        type: 'city',
        position: new THREE.Vector3(0, 0, 0),
        radius: 1.2,
        faction: 'galactic_republic',
        description: 'Ecumenopolis where the entire surface is a vast city.',
        population: '1 trillion',
        climate: 'Controlled',
        terrain: 'Urban cityscape',
        systemId: 'coruscant',
      }
    ],
  },
  {
    id: 'alderaan',
    name: 'Alderaan',
    position: new THREE.Vector3(30, 0, 15),
    faction: 'galactic_republic',
    starType: 'yellow',
    importance: 'major',
    description: 'Peaceful world known for its beauty, culture, and noble houses.',
    region: 'core_worlds',
    planets: [
      {
        id: 'alderaan-prime',
        name: 'Alderaan',
        type: 'terrestrial',
        position: new THREE.Vector3(0, 0, 0),
        radius: 1,
        faction: 'galactic_republic',
        description: 'Verdant world of mountains, lakes, and plains.',
        climate: 'Temperate',
        terrain: 'Mountains, grasslands',
        systemId: 'alderaan',
      }
    ],
  },
  {
    id: 'corellia',
    name: 'Corellia',
    position: new THREE.Vector3(15, 0, 0),
    faction: 'galactic_republic',
    starType: 'yellow',
    importance: 'major',
    description: 'Major shipbuilding world and birthplace of many famous pilots.',
    region: 'core_worlds',
    planets: [
      {
        id: 'corellia-prime',
        name: 'Corellia',
        type: 'terrestrial',
        position: new THREE.Vector3(0, 0, 0),
        radius: 1,
        faction: 'galactic_republic',
        description: 'Industrialized world with rich shipyards and cities.',
        climate: 'Temperate',
        terrain: 'Urban regions, plains',
        systemId: 'corellia',
      }
    ],
  },
  {
    id: 'balmorra',
    name: 'Balmorra',
    position: new THREE.Vector3(45, 0, -15),
    faction: 'contested',
    starType: 'yellow',
    importance: 'major',
    description: 'Major weapons manufacturing world contested by Republic and Empire.',
    region: 'colonies',
    planets: [
      {
        id: 'balmorra-prime',
        name: 'Balmorra',
        type: 'terrestrial',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.95,
        faction: 'contested',
        description: 'Industrialized world scarred by conflict.',
        climate: 'Varied',
        terrain: 'Factories, war zones',
        systemId: 'balmorra',
      }
    ],
  },
  {
    id: 'belsavis',
    name: 'Belsavis',
    position: new THREE.Vector3(-45, 0, 45),
    faction: 'neutral',
    starType: 'white',
    importance: 'major',
    description: 'Frozen prison world holding ancient secrets.',
    region: 'outer_rim',
    planets: [
      {
        id: 'belsavis-prime',
        name: 'Belsavis',
        type: 'ice',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.95,
        faction: 'neutral',
        description: 'Icy world with deep prison complexes.',
        climate: 'Frigid',
        terrain: 'Ice fields, prisons',
        systemId: 'belsavis',
      }
    ],
  },
  {
    id: 'dromund-kaas',
    name: 'Dromund Kaas',
    position: new THREE.Vector3(-30, 0, 15),
    faction: 'sith_empire',
    starType: 'yellow',
    importance: 'capital',
    description: 'Capital of the resurgent Sith Empire. Shrouded in perpetual storms.',
    region: 'outer_rim',
    planets: [
      {
        id: 'dromund-kaas-prime',
        name: 'Dromund Kaas',
        type: 'jungle',
        position: new THREE.Vector3(0, 0, 0),
        radius: 1,
        faction: 'sith_empire',
        description: 'Storm-wrapped jungle world of the Sith Empire.',
        climate: 'Stormy',
        terrain: 'Jungles, swamps',
        systemId: 'dromund-kaas',
      }
    ],
  },
  {
    id: 'korriban',
    name: 'Korriban',
    position: new THREE.Vector3(-30, 0, 0),
    faction: 'sith_empire',
    starType: 'red',
    importance: 'capital',
    description: 'Ancient Sith homeworld. Burial ground of the Dark Lords.',
    region: 'outer_rim',
    planets: [
      {
        id: 'korriban-prime',
        name: 'Korriban',
        type: 'desert',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.9,
        faction: 'sith_empire',
        description: 'Barren world steeped in dark side energy.',
        climate: 'Arid',
        terrain: 'Desert, tombs, canyons',
        systemId: 'korriban',
      }
    ],
  },
  {
    id: 'hoth',
    name: 'Hoth',
    position: new THREE.Vector3(-75, 0, 30),
    faction: 'neutral',
    starType: 'blue',
    importance: 'major',
    description: 'Remote ice world covered in perpetual winter.',
    region: 'outer_rim',
    planets: [
      {
        id: 'hoth-prime',
        name: 'Hoth',
        type: 'ice',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.9,
        faction: 'neutral',
        description: 'Frozen world of glaciers and snowfields.',
        climate: 'Frigid',
        terrain: 'Ice, tundra',
        systemId: 'hoth',
      }
    ],
  },
  {
    id: 'hutta',
    name: 'Hutta',
    position: new THREE.Vector3(60, 0, -30),
    faction: 'neutral',
    starType: 'yellow',
    importance: 'major',
    description: 'Swamp world and capital of Hutt Space.',
    region: 'mid_rim',
    planets: [
      {
        id: 'hutta-prime',
        name: 'Hutta',
        type: 'barren',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.95,
        faction: 'neutral',
        description: 'Toxic world of swamps and pollution.',
        climate: 'Toxic',
        terrain: 'Swamps, industrial waste',
        systemId: 'hutta',
      }
    ],
  },
  {
    id: 'ilum',
    name: 'Ilum',
    position: new THREE.Vector3(-90, 0, 60),
    faction: 'galactic_republic',
    starType: 'blue',
    importance: 'major',
    description: 'Sacred Jedi world and source of lightsaber crystals.',
    region: 'unknown_regions',
    planets: [
      {
        id: 'ilum-prime',
        name: 'Ilum',
        type: 'ice',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.8,
        faction: 'galactic_republic',
        description: 'Frozen world rich in kyber crystals.',
        climate: 'Frigid',
        terrain: 'Ice caverns, glaciers',
        systemId: 'ilum',
      }
    ],
  },
  {
    id: 'makeb',
    name: 'Makeb',
    position: new THREE.Vector3(90, 0, -45),
    faction: 'neutral',
    starType: 'yellow',
    importance: 'major',
    description: 'Resource-rich world under tectonic strain.',
    region: 'outer_rim',
    planets: [
      {
        id: 'makeb-prime',
        name: 'Makeb',
        type: 'terrestrial',
        position: new THREE.Vector3(0, 0, 0),
        radius: 1,
        faction: 'neutral',
        description: 'Unstable world with rich resources and oceans.',
        climate: 'Varied',
        terrain: 'Plateaus, oceans',
        systemId: 'makeb',
      }
    ],
  },
  {
    id: 'nar-shaddaa',
    name: 'Nar Shaddaa',
    position: new THREE.Vector3(60, 0, -15),
    faction: 'neutral',
    starType: 'yellow',
    importance: 'major',
    description: 'The Smuggler\'s Moon. A lawless ecumenopolis controlled by the Hutts.',
    region: 'mid_rim',
    planets: [
      {
        id: 'nar-shaddaa-prime',
        name: 'Nar Shaddaa',
        type: 'city',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.85,
        faction: 'neutral',
        description: 'Urban sprawl and towering skylines.',
        climate: 'Polluted',
        terrain: 'Urban, industrial',
        systemId: 'nar-shaddaa',
      }
    ],
  },
  {
    id: 'ord-mantell',
    name: 'Ord Mantell',
    position: new THREE.Vector3(75, 0, -15),
    faction: 'galactic_republic',
    starType: 'yellow',
    importance: 'major',
    description: 'War-torn world of scrapyards and rebel holdouts.',
    region: 'mid_rim',
    planets: [
      {
        id: 'ord-mantell-prime',
        name: 'Ord Mantell',
        type: 'terrestrial',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.95,
        faction: 'galactic_republic',
        description: 'Rugged world scarred by conflict.',
        climate: 'Temperate',
        terrain: 'Scrapyards, plains',
        systemId: 'ord-mantell',
      }
    ],
  },
  {
    id: 'quesh',
    name: 'Quesh',
    position: new THREE.Vector3(45, 0, -45),
    faction: 'sith_empire',
    starType: 'red',
    importance: 'major',
    description: 'Toxic world producing valuable chemicals for the Empire.',
    region: 'outer_rim',
    planets: [
      {
        id: 'quesh-prime',
        name: 'Quesh',
        type: 'volcanic',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.9,
        faction: 'sith_empire',
        description: 'Toxic atmosphere and industrial extraction.',
        climate: 'Toxic',
        terrain: 'Industrial zones',
        systemId: 'quesh',
      }
    ],
  },
  {
    id: 'taris',
    name: 'Taris',
    position: new THREE.Vector3(45, 0, 30),
    faction: 'galactic_republic',
    starType: 'yellow',
    importance: 'major',
    description: 'Urban world devastated during the Jedi Civil War.',
    region: 'mid_rim',
    planets: [
      {
        id: 'taris-prime',
        name: 'Taris',
        type: 'city',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.95,
        faction: 'galactic_republic',
        description: 'City world with layers of ruins and rebuilt districts.',
        climate: 'Temperate',
        terrain: 'Urban ruins',
        systemId: 'taris',
      }
    ],
  },
  {
    id: 'tatooine',
    name: 'Tatooine',
    position: new THREE.Vector3(90, 0, -15),
    faction: 'neutral',
    starType: 'binary',
    importance: 'minor',
    description: 'Desert world on the Outer Rim. Home to moisture farmers and criminals.',
    region: 'outer_rim',
    planets: [
      {
        id: 'tatooine-prime',
        name: 'Tatooine',
        type: 'desert',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.85,
        faction: 'neutral',
        description: 'Twin-sunned desert world.',
        climate: 'Arid',
        terrain: 'Desert, canyons',
        systemId: 'tatooine',
      }
    ],
  },
  {
    id: 'voss',
    name: 'Voss',
    position: new THREE.Vector3(-15, 0, 60),
    faction: 'neutral',
    starType: 'white',
    importance: 'major',
    description: 'Mystical world home to the Voss people.',
    region: 'unknown_regions',
    planets: [
      {
        id: 'voss-prime',
        name: 'Voss',
        type: 'jungle',
        position: new THREE.Vector3(0, 0, 0),
        radius: 0.95,
        faction: 'neutral',
        description: 'Mystical forests and ancient shrines.',
        climate: 'Temperate',
        terrain: 'Forests, plateaus',
        systemId: 'voss',
      }
    ],
  },
];

// ============================================
// ============================================
// ANOMALIES
// ============================================

export const anomalies: Anomaly[] = [];

// ============================================
// FLEETS
// ============================================

export const fleets: Fleet[] = [
  // Republic Fleets
  {
    id: 'republic-home-fleet',
    name: 'Republic Home Fleet',
    faction: 'galactic_republic',
    position: new THREE.Vector3(5, 3, 5), // Near Coruscant (0,0,0)
    shipCount: 120,
    flagship: 'Hammerhead-class Cruiser "Endar Spire"',
    commander: 'Admiral Karath',
    systemId: 'coruscant',
  },
  {
    id: 'republic-second-fleet',
    name: 'Republic Second Fleet',
    faction: 'galactic_republic',
    position: new THREE.Vector3(35, 3, 20), // Near Alderaan (30, 0, 15)
    shipCount: 80,
    flagship: 'Hammerhead-class Cruiser',
    commander: 'Admiral Dodonna',
    systemId: 'alderaan',
  },
  {
    id: 'jedi-watchmen',
    name: 'Jedi Watchmen Squadron',
    faction: 'galactic_republic',
    position: new THREE.Vector3(35, 4, 50), // Near Tython (30, 0, 45)
    shipCount: 15,
    flagship: 'Jedi Cruiser',
    systemId: 'tython',
  },
  
  // Sith Fleets
  {
    id: 'sith-imperial-armada',
    name: 'Sith Imperial Armada',
    faction: 'sith_empire',
    position: new THREE.Vector3(-35, 4, 20), // Near Dromund Kaas (-30, 0, 15)
    shipCount: 200,
    flagship: 'Harrower-class Dreadnought "Leviathan"',
    commander: 'Darth Malak',
    systemId: 'dromund-kaas',
  },
  {
    id: 'sith-korriban-guard',
    name: 'Korriban Defense Fleet',
    faction: 'sith_empire',
    position: new THREE.Vector3(-35, 5, 5), // Near Korriban (-30, 0, 0)
    shipCount: 50,
    flagship: 'Interdictor-class Cruiser',
    systemId: 'korriban',
  },
  {
    id: 'sith-invasion-fleet',
    name: 'Sith Invasion Fleet',
    faction: 'sith_empire',
    position: new THREE.Vector3(-70, 4, 35), // Near Hoth (-75, 0, 30)
    shipCount: 150,
    flagship: 'Harrower-class Dreadnought',
    commander: 'Admiral Saul Karath',
  },
  
  // Mandalorian Remnants
  {
    id: 'mandalorian-remnant',
    name: 'Mandalorian Remnant',
    faction: 'neutral',
    position: new THREE.Vector3(55, 4, -25), // Near Nar Shaddaa (60, 0, -15)
    shipCount: 30,
    flagship: 'Basilisk War Droid Carrier',
    commander: 'Canderous Ordo',
    systemId: 'mandalore',
  },
];

