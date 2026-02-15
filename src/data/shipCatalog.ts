export interface ShipCatalogEntry {
  id: string;
  name: string;
  shipClass: 'Frigate' | 'Dreadnought';
  modelType: 'republic' | 'sith';
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
    id: 'sith-dreadnought',
    name: 'Sith Dreadnought',
    shipClass: 'Dreadnought',
    modelType: 'sith',
    description: 'Harrower-class dreadnought, a fearsome capital ship of the Sith Empire.',
  },
];
