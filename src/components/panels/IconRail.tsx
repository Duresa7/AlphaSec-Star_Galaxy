import { motion } from 'framer-motion';
import { useGalaxyUIStore, type ActiveModule } from '@/store/galaxyUIStore';

const MODULE_OPTIONS: { id: ActiveModule; label: string; icon: React.ReactNode }[] = [
  {
    id: 'search',
    label: 'Search',
    icon: (
      <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'overview',
    label: 'Galaxy Overview',
    icon: (
      <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: (
      <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const railContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const railItem = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export function IconRail() {
  const activeModule = useGalaxyUIStore((s) => s.activeModule);
  const setActiveModule = useGalaxyUIStore((s) => s.setActiveModule);

  return (
    <motion.div
      className="absolute left-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3"
      variants={railContainer}
      initial="hidden"
      animate="visible"
    >
      {MODULE_OPTIONS.map((mod) => {
        const isActive = activeModule === mod.id;

        return (
          <motion.div key={mod.id} className="holo-rail-item" variants={railItem}>
            <button
              onClick={() => setActiveModule(mod.id)}
              className={`holo-rail-button${isActive ? ' is-active' : ''}`}
              title={mod.label}
            >
              {mod.icon}
            </button>
            <div className="holo-rail-tooltip">
              <span className="text-[11px] uppercase tracking-wider holo-label-orbitron">{mod.label}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
