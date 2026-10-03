import * as React from 'react';
import { Platform, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

type AnimatedPressableProps = React.ComponentProps<typeof Pressable> & {
  entering?: unknown;
  exiting?: unknown;
};

const AnimatedPressable = Animated.createAnimatedComponent(
  Pressable
) as unknown as React.ComponentType<AnimatedPressableProps>;

type NativeOnlyAnimatedViewProps =
  | (React.ComponentProps<typeof Animated.View> & {
      as?: 'View';
    })
  | (React.ComponentProps<typeof AnimatedPressable> & {
      as: 'Pressable';
    });

function NativeOnlyAnimatedView(props: NativeOnlyAnimatedViewProps) {
  if (Platform.OS === 'web') {
    return <>{props.children}</>;
  }

  if (props.as === 'Pressable') {
    const { as: _as, ...pressableProps } = props;
    return <AnimatedPressable {...pressableProps} />;
  }

  const { as: _as, ...viewProps } = props;
  return <Animated.View {...viewProps} />;
}

export { NativeOnlyAnimatedView };
