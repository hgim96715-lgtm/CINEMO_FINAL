import { PortalHost } from '@rn-primitives/portal';
import { Slot } from 'expo-router';

import '../global.css';

export default function RootLayout() {
  return (
    <>
      <Slot />
      <PortalHost />
    </>
  );
}
