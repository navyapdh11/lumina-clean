'use client';
import { XRButton as DreiXRButton } from '@react-three/xr';

export default function XRButton({ children, ...props }: any) {
  return <DreiXRButton {...props}>{children}</DreiXRButton>;
}
