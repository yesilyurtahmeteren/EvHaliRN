// Seçili ev (users/{uid}.homeId). (app) layout'undaki HomeGate yalnızca ev
// varken sekmeleri gösterir ve bu bağlamı sağlar; sekmeler homeId'yi URL'de
// taşımaz (docs/ANALYSIS.md §10).
//
// Evden ayrılınca homeId null olur ama navigator sekmeleri aynı render'da
// kaldırmayabilir; o son render'da çökmemek için bağlam son evi tutar.
import { createContext, useContext, useState, type ReactNode } from 'react';

const HomeIdContext = createContext<string | null>(null);

export function HomeIdProvider({
  homeId,
  children,
}: {
  homeId: string | null;
  children: ReactNode;
}) {
  const [lastHomeId, setLastHomeId] = useState(homeId);
  if (homeId !== null && homeId !== lastHomeId) {
    setLastHomeId(homeId);
  }
  return <HomeIdContext.Provider value={homeId ?? lastHomeId}>{children}</HomeIdContext.Provider>;
}

export function useRequiredHomeId(): string {
  const homeId = useContext(HomeIdContext);
  if (homeId === null) {
    throw new Error('useRequiredHomeId called outside a home');
  }
  return homeId;
}
