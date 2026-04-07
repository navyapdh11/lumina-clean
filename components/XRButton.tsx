'use client';
import { XRButton as DreiXRButton } from '@react-three/xr';
import type { ComponentProps } from 'react';

type XRButtonProps = ComponentProps<typeof DreiXRButton>;

export default function XRButton(props: XRButtonProps) {
  return <DreiXRButton {...props} />;
}
