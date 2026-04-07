/**
 * R3F JSX type declarations
 *
 * @react-three/fiber maps Three.js objects to JSX elements but the
 * Object3DNode<> generic doesn't resolve correctly in all TS configs.
 * These declarations tell TypeScript that Three.js primitives are
 * valid JSX elements.
 *
 * @see https://github.com/pmndrs/react-three-fiber/issues/2396
 */

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Groups & objects
      group: any;
      primitive: any;

      // Meshes
      mesh: any;
      lineSegments: any;

      // Geometries
      boxGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      edgesGeometry: any;

      // Materials
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhysicalMaterial: any;
      lineBasicMaterial: any;
      lineDashedMaterial: any;

      // Lights
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      hemisphereLight: any;
      rectAreaLight: any;

      // Controls & helpers
      grid: any;
      text: any;
    }
  }
}

export {};
