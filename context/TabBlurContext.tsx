import React, {
  ComponentRef,
  RefObject,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { View } from 'react-native';

export type BlurTargetRef = RefObject<ComponentRef<typeof View> | null>;
type SetBlurTargetFn = (ref: BlurTargetRef | undefined) => void;

const TabBlurValueContext = createContext<BlurTargetRef | undefined>(undefined);
const TabBlurSetterContext = createContext<SetBlurTargetFn>(() => {});

export function TabBlurProvider({ children }: { children: React.ReactNode }) {
  const [activeBlurTarget, setActiveBlurTarget] = useState<
    BlurTargetRef | undefined
  >(undefined);

  return (
    <TabBlurSetterContext.Provider value={setActiveBlurTarget}>
      <TabBlurValueContext.Provider value={activeBlurTarget}>
        {children}
      </TabBlurValueContext.Provider>
    </TabBlurSetterContext.Provider>
  );
}

export function useSetTabBlurTarget() {
  return useContext(TabBlurSetterContext);
}

export function useTabBlurTarget() {
  const activeBlurTarget = useContext(TabBlurValueContext);
  const setActiveBlurTarget = useContext(TabBlurSetterContext);
  return useMemo(
    () => ({ activeBlurTarget, setActiveBlurTarget }),
    [activeBlurTarget, setActiveBlurTarget]
  );
}
