import React, {
  ComponentRef,
  RefObject,
  createContext,
  useContext,
  useState,
} from 'react';
import type { View } from 'react-native';

export type BlurTargetRef = RefObject<ComponentRef<typeof View> | null>;

interface TabBlurContextValue {
  activeBlurTarget: BlurTargetRef | undefined;
  setActiveBlurTarget: (ref: BlurTargetRef | undefined) => void;
}

const TabBlurContext = createContext<TabBlurContextValue>({
  activeBlurTarget: undefined,
  setActiveBlurTarget: () => {},
});

export function TabBlurProvider({ children }: { children: React.ReactNode }) {
  const [activeBlurTarget, setActiveBlurTarget] = useState<
    BlurTargetRef | undefined
  >(undefined);

  return (
    <TabBlurContext.Provider
      value={{ activeBlurTarget, setActiveBlurTarget }}>
      {children}
    </TabBlurContext.Provider>
  );
}

export function useTabBlurTarget() {
  return useContext(TabBlurContext);
}
