import { motion } from "framer-motion";
import { useGalaxyUIStore } from "@/store/galaxyUIStore";
import { useRole } from "@/hooks/useRole";
import { CustomPlanetsPanel } from "@/components/panels/CustomPlanetsPanel";
import { CustomFleetsPanel } from "@/components/panels/CustomFleetsPanel";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export function BottomActionBar() {
  const { isAdmin } = useRole();
  const activeModule = useGalaxyUIStore((s) => s.activeModule);
  const setActiveModule = useGalaxyUIStore((s) => s.setActiveModule);

  return (
    <motion.div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
    >
      <div className="holo-toolbar">
        <button
          onClick={() => setActiveModule("mapControls")}
          className={`holo-button holo-button-sm${activeModule === "mapControls" ? " is-active" : ""}`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <span className="text-[11px] font-semibold tracking-wider">
            Map Controls
          </span>
        </button>

        {isAdmin && <div className="w-px h-8 bg-white/10 mx-1" />}

        {isAdmin && (
          <div className="flex gap-2">
            <PanelTriggerWrapper
              component={<CustomPlanetsPanel />}
              label="Create Planet"
              activeModule={activeModule}
              onOpen={() => setActiveModule(null)}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              }
            />
            <PanelTriggerWrapper
              component={<CustomFleetsPanel />}
              label="Create Fleet"
              activeModule={activeModule}
              onOpen={() => setActiveModule(null)}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PanelTriggerWrapper({
  component,
  label,
  icon,
  activeModule,
  onOpen,
}: {
  component: React.ReactNode;
  label: string;
  icon: React.ReactNode;
  activeModule: string | null;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (activeModule === 'mapControls') {
      setOpen(false);
    }
  }, [activeModule]);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);

  const computePosition = useCallback(() => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      left: rect.left + rect.width / 2,
      bottom: window.innerHeight - rect.top + 16,
    };
  }, []);

  const updatePosition = useCallback(() => {
    const p = computePosition();
    if (p) setPos(p);
  }, [computePosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        !target.closest('.fleet-modal-overlay')
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => {
          const next = !open;
          if (next) {
            setPos(computePosition());
            onOpen();
          }
          setOpen(next);
        }}
        className={`holo-button holo-button-sm${open ? " is-active" : ""}`}
      >
        {icon}
        <span className="text-[11px] font-semibold tracking-wider">
          {label}
        </span>
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed w-72 z-50"
            style={{
              left: pos.left,
              bottom: pos.bottom,
              transform: "translateX(-50%)",
            }}
          >
            <div className="animate-slide-up-subtle">
              {component}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
