import { createContext, useCallback, useContext, useEffect, useRef, useState, type RefObject } from 'react';
import { Keyboard, type LayoutChangeEvent, type ScrollView, type View } from 'react-native';
import { space } from '@/theme/tokens';

type Reveal = (target: View | null) => void;

export const RevealContext = createContext<Reveal | null>(null);

export const useRevealOnFocus = () => useContext(RevealContext);

const MARGIN = space.lg;
const SETTLE_MS = 60;

export function useKeyboardReveal(scrollRef: RefObject<ScrollView | null>, enabled: boolean) {
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const footerHeight = useRef(0);
  const target = useRef<View | null>(null);
  const frameRef = useRef<View>(null);
  const [frameTop, setFrameTop] = useState(0);

  const scrollIntoView = useCallback(() => {
    const node = target.current;
    const top = keyboardTop.current;
    const scroll = scrollRef.current;
    if (!node || top === null || !scroll) return;
    node.measureInWindow((_x, y, _w, height) => {
      const visibleBottom = top - footerHeight.current - MARGIN;
      const overflow = y + height - visibleBottom;
      if (overflow > 0) scroll.scrollTo({ y: scrollY.current + overflow, animated: true });
    });
  }, [scrollRef]);

  const reveal = useCallback<Reveal>(
    (node) => {
      target.current = node;
      if (keyboardTop.current !== null) setTimeout(scrollIntoView, SETTLE_MS);
    },
    [scrollIntoView],
  );

  useEffect(() => {
    if (!enabled) return;
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setTimeout(scrollIntoView, SETTLE_MS);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled, scrollIntoView]);

  return {
    reveal: enabled ? reveal : null,
    frameRef,
    frameTop,
    onFrameLayout: () => frameRef.current?.measureInWindow((_x, y) => setFrameTop(y)),
    onScroll: (y: number) => {
      scrollY.current = y;
    },
    onFooterLayout: (event: LayoutChangeEvent) => {
      footerHeight.current = event.nativeEvent.layout.height;
    },
  };
}
