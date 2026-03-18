"use client";

import { createContext, useContext, useState } from "react";

export type AuraTask = "case_summary" | "subject_profile" | "osint_interpretation" | "threat_assessment" | "case_qa" | null;

interface AuraOptions {
  task?: AuraTask;
  caseId?: number;
  personId?: number;
  watchlistId?: number;
}

interface AuraContextType {
  auraOpen: boolean;
  auraTask: AuraTask;
  auraCaseId: number | undefined;
  auraPersonId: number | undefined;
  auraWatchlistId: number | undefined;
  openAura: (opts?: AuraOptions) => void;
  closeAura: () => void;
}

const AuraContext = createContext<AuraContextType | null>(null);

export function AuraProvider({ children }: { children: React.ReactNode }) {
  const [auraOpen, setAuraOpen] = useState(false);
  const [auraTask, setAuraTask] = useState<AuraTask>(null);
  const [auraCaseId, setAuraCaseId] = useState<number | undefined>(undefined);
  const [auraPersonId, setAuraPersonId] = useState<number | undefined>(undefined);
  const [auraWatchlistId, setAuraWatchlistId] = useState<number | undefined>(undefined);

  function openAura(opts?: AuraOptions) {
    setAuraTask(opts?.task ?? null);
    setAuraCaseId(opts?.caseId);
    setAuraPersonId(opts?.personId);
    setAuraWatchlistId(opts?.watchlistId);
    setAuraOpen(true);
  }

  function closeAura() {
    setAuraOpen(false);
    setAuraTask(null);
    setAuraCaseId(undefined);
    setAuraPersonId(undefined);
    setAuraWatchlistId(undefined);
  }

  return (
    <AuraContext.Provider value={{ auraOpen, auraTask, auraCaseId, auraPersonId, auraWatchlistId, openAura, closeAura }}>
      {children}
    </AuraContext.Provider>
  );
}

export function useAura() {
  const ctx = useContext(AuraContext);
  if (!ctx) throw new Error("useAura must be used within AuraProvider");
  return ctx;
}
