import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Float, Sparkles, Stars, MeshTransmissionMaterial, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { monogram } from '@/config/relationship';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { haptic } from '@/lib/haptics';

/** A smooth, slightly plump heart profile extruded into a crystal gem. */
function useHeartGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    const x = 0;
    const y = 0;
    s.moveTo(x, y + 0.5);
    s.bezierCurveTo(x, y + 0.5, x - 0.6, y + 1.2, x - 1.2, y + 1.1);
    s.bezierCurveTo(x - 2.1, y + 1.0, x - 2.1, y - 0.2, x - 2.1, y - 0.2);
    s.bezierCurveTo(x - 2.1, y - 1.0, x - 1.1, y - 1.8, x, y - 2.4);
    s.bezierCurveTo(x + 1.1, y - 1.8, x + 2.1, y - 1.0, x + 2.1, y - 0.2);
    s.bezierCurveTo(x + 2.1, y - 0.2, x + 2.1, y + 1.0, x + 1.2, y + 1.1);
    s.bezierCurveTo(x + 0.6, y + 1.2, x, y + 0.5, x, y + 0.5);

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.9,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.32,
      bevelSegments: 10,
      curveSegments: 24,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);
}

function Heart({ reduce }: { reduce: boolean }) {
  const geo = useHeartGeometry();
  const refractBg = useMemo(() => new THREE.Color('#fce7df'), []);
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const target = useRef({ x: -0.15, y: 0 });
  const [pressed, setPressed] = useState(0);

  useFrame((state, delta) => {
    if (!group.current || !mesh.current) return;
    const t = state.clock.elapsedTime;

    // Heartbeat — a gentle double-thump, calmer under reduced motion.
    const beat = reduce
      ? 1
      : 1 +
        0.045 * Math.exp(-6 * ((t % 1.6) / 1.6)) +
        0.03 * Math.exp(-6 * (((t % 1.6) / 1.6 - 0.18) % 1));
    const press = 1 - pressed * 0.06;
    mesh.current.scale.setScalar(beat * press);

    // Ease toward the pointer; idle drift when untouched.
    if (!reduce) target.current.y += delta * 0.12;
    group.current.rotation.y += (target.current.y - group.current.rotation.y) * 0.06;
    group.current.rotation.x += (target.current.x - group.current.rotation.x) * 0.06;

    if (light.current) {
      light.current.intensity = 2.4 + (reduce ? 0 : Math.sin(t * 3) * 0.8 + pressed * 3);
    }
    if (pressed > 0) setPressed((p) => Math.max(0, p - delta * 2.5));
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (reduce) return;
    const px = (e.point.x || 0) / 4;
    const py = (e.point.y || 0) / 4;
    target.current = { x: -0.15 - py * 0.4, y: px * 0.8 };
  };

  const onTap = () => {
    haptic('soft');
    setPressed(1);
  };

  return (
    <group ref={group} rotation={[-0.15, 0, 0]}>
      <pointLight ref={light} position={[0, 0, 0]} color="#ffd9c9" intensity={2.4} distance={9} />
      <mesh
        ref={mesh}
        geometry={geo}
        onPointerMove={onMove}
        onPointerDown={onTap}
        scale={1}
      >
        {reduce ? (
          <meshPhysicalMaterial
            color="#f4c3c0"
            transmission={0.6}
            thickness={1.4}
            roughness={0.18}
            metalness={0}
            ior={1.4}
            clearcoat={1}
            clearcoatRoughness={0.15}
            emissive="#b76e79"
            emissiveIntensity={0.12}
          />
        ) : (
          <MeshTransmissionMaterial
            background={refractBg}
            samples={4}
            resolution={256}
            transmission={1}
            thickness={1.6}
            roughness={0.12}
            ior={1.42}
            chromaticAberration={0.06}
            anisotropy={0.4}
            distortion={0.3}
            distortionScale={0.4}
            temporalDistortion={0.1}
            color="#f6cdc8"
            attenuationColor="#e9b9b2"
            attenuationDistance={3}
            clearcoat={1}
          />
        )}
      </mesh>

      {/* Inner glow core */}
      <mesh scale={0.42}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#ffb3a7" transparent opacity={reduce ? 0.4 : 0.55} />
      </mesh>

      {!reduce && (
        <Sparkles count={40} scale={6} size={3} speed={0.3} color="#ffe7b8" opacity={0.7} />
      )}
    </group>
  );
}

/** The full hero scene: galaxy backdrop, floating crystal heart, monogram. */
export function CrystalHeart({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        dpr={[1, reduce ? 1.5 : 2]}
        camera={{ position: [0, 0, 9], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ touchAction: 'pan-y' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 6, 5]} intensity={1.1} color="#fff1e6" />
        <pointLight position={[-6, -2, 4]} intensity={1.4} color="#c9a6ff" />
        <pointLight position={[6, 3, -3]} intensity={1.2} color="#ffd28a" />

        <Suspense fallback={null}>
          {reduce ? (
            <Heart reduce />
          ) : (
            <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.7}>
              <Heart reduce={false} />
            </Float>
          )}
          {!reduce && <Stars radius={60} depth={30} count={1200} factor={3} saturation={0.4} fade speed={0.6} />}
        </Suspense>
        <AdaptiveDpr pixelated />
      </Canvas>

      {/* Crisp monogram overlay — appears to glow within the crystal */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <span
          className="font-display text-3xl font-semibold tracking-[0.1em] sm:text-4xl"
          style={{
            color: '#fffaf6',
            textShadow:
              '0 1px 2px rgba(120,48,60,0.55), 0 0 16px rgba(227,112,106,0.85), 0 0 34px rgba(212,175,122,0.6)',
          }}
        >
          {monogram}
        </span>
      </div>
    </div>
  );
}

export default CrystalHeart;
