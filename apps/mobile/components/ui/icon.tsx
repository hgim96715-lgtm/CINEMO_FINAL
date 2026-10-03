import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { styled } from 'nativewind';
import * as React from 'react';

type IconProps = LucideProps & {
  as: LucideIcon;
} & React.RefAttributes<LucideIcon>;

function Icon({ as: IconComponent, className, size = 14, ...props }: IconProps) {
  const textClass = React.useContext(TextClassContext);
  const StyledIcon = React.useMemo(
    () =>
      styled(IconComponent, {
        className: {
          target: 'style',
          nativeStyleMapping: {
            height: true,
            width: true,
          },
        },
      }),
    [IconComponent]
  );

  return (
    <StyledIcon
      className={cn('text-foreground', textClass, className)}
      size={size}
      {...props}
    />
  );
}

export { Icon };
