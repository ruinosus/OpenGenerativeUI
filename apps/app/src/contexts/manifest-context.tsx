import { createContext, useContext, type ReactNode } from "react";

const ManifestContext = createContext<any | null>(null);

export function ManifestProvider({ manifest, children }: { manifest: any; children: ReactNode }) {
  return (
    <ManifestContext.Provider value={manifest}>
      {children}
    </ManifestContext.Provider>
  );
}

export function useManifest() {
  const ctx = useContext(ManifestContext);
  if (!ctx) throw new Error("useManifest must be used inside ManifestProvider");
  return ctx;
}
