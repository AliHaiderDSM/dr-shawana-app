import { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, LayoutAnimation, Platform, type View } from 'react-native';

const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

export function useKeyboardInset(enabled = true) {
  const frame = useRef<View>(null);
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const animate = (duration: number) => {
      if (Platform.OS !== 'ios') return;
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          duration || 250,
          LayoutAnimation.Types.keyboard,
          LayoutAnimation.Properties.opacity,
        ),
      );
    };
    const show = Keyboard.addListener(SHOW, (event) => {
      const fromEvent = event.endCoordinates.screenY;
      const fromHeight = Dimensions.get('screen').height - event.endCoordinates.height;
      frame.current?.measureInWindow((_x, y, _w, height) => {
        const bottom = y + height;
        const overlap = Math.max(0, bottom - fromEvent, Platform.OS === 'android' ? bottom - fromHeight : 0);
        animate(event.duration);
        setInset(Math.round(overlap));
      });
    });
    const hide = Keyboard.addListener(HIDE, (event) => {
      animate(event.duration);
      setInset(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled]);

  return { frame, inset };
}
