'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { XR, createXRStore, useGLTF } from '@react-three/xr';
import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';

// Preload GLTF to prevent memory leaks
useGLTF.preload('/models/office-before.glb');
useGLTF.preload('/models/office-after.glb');

interface OfficeModelProps {
  modelPath: string;
  scale?: number;
}

function OfficeModel({ modelPath, scale = 1.8 }: OfficeModelProps) {
  const { scene } = useGLTF(modelPath);
  const ref = useRef<THREE.Group>(null);
  
  // Subtle idle animation
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  useEffect(() => {
    // Cleanup on unmount to prevent memory leaks
    return () => {
      if (scene) {
        scene.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else {
              mesh.material?.dispose();
            }
          }
        });
      }
    };
  }, [scene]);

  return <primitive ref={ref} object={scene} scale={scale} />;
}

function FallbackModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[3, 2, 3]} />
      <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.7} />
    </mesh>
  );
}

interface OfficeSceneProps {
  onCleanComplete?: () => void;
}

export default function OfficeScene({ onCleanComplete }: OfficeSceneProps) {
  const [isClean, setIsClean] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const xrStore = useMemo(() => createXRStore(), []);

  const handleClean = () => {
    setIsClean(true);
    onCleanComplete?.();
  };

  const currentModel = isClean ? '/models/office-after.glb' : '/models/office-before.glb';

  return (
    <div className="relative w-full h-full" role="img" aria-label="Interactive 3D office cleaning preview">
      <button
        className="absolute top-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none text-white px-4 py-2 rounded shadow-lg transition"
        onClick={() => xrStore.enterXR?.('immersive-ar')}
        aria-label="Launch augmented reality tour"
      >
        Launch AR Tour
      </button>
      
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [5, 3, 5], fov: 50 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#111827', 1);
        }}
      >
        <Suspense fallback={null}>
          <XR store={xrStore}>
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[10, 20, 10]} 
              castShadow 
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            
            <Suspense fallback={<FallbackModel />}>
              <OfficeModel 
                modelPath={currentModel} 
                scale={1.8} 
              />
            </Suspense>
            
            <OrbitControls 
              enablePan={false} 
              minDistance={3} 
              maxDistance={10}
              ariaLabel="3D scene controls"
            />
            <Environment preset="warehouse" />
          </XR>
        </Suspense>
      </Canvas>
      
      <button
        onClick={handleClean}
        className="absolute bottom-4 left-4 bg-white hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 focus:outline-none text-black px-4 py-2 rounded shadow-lg transition"
        aria-label="Trigger cleaning animation"
      >
        {isClean ? '✨ Cleaned!' : 'Trigger Full Cleaning Animation'}
      </button>
    </div>
  );
}
