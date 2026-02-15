import type { ShipModelType } from '@/types';

export interface ShipCatalogEntry {
  id: string;
  name: string;
  shipClass: 'Frigate' | 'Dreadnought';
  modelType: ShipModelType;
  description: string;
}

export const shipCatalog: ShipCatalogEntry[] = [
  {
    id: 'republic-frigate',
    name: 'Republic Frigate',
    shipClass: 'Frigate',
    modelType: 'republic',
    description: 'Versatile Hammerhead-class cruiser, the backbone of the Republic Navy.',
  },
  {
    id: 'republic-venator',
    name: 'Venator-class Star Destroyer',
    shipClass: 'Dreadnought',
    modelType: 'venator',
    description: 'Republic capital ship configured for carrier operations, fleet command, and orbital assault.',
  },
  {
    id: 'sith-dreadnought',
    name: 'Sith Dreadnought',
    shipClass: 'Dreadnought',
    modelType: 'sith',
    description: 'Harrower-class dreadnought, a fearsome capital ship of the Sith Empire.',
  },
];
