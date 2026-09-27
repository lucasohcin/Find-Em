import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ModelType } from '../types';

interface Item3DViewerProps {
  modelType: ModelType;
  modelColor?: string;
  glowColor?: string;
  autoRotate?: boolean;
  interactive?: boolean;
  height?: number | string;
  showPedestal?: boolean;
  className?: string;
}

export const Item3DViewer: React.FC<Item3DViewerProps> = ({
  modelType,
  modelColor = '#38bdf8',
  glowColor = '#0284c7',
  autoRotate = true,
  interactive = true,
  height = 360,
  showPedestal = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const stateRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0.15,
    rotY: 0,
    autoRotateSpeed: 0.015,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const heightNum = typeof height === 'number' ? height : (container.clientHeight || 360);

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / heightNum, 0.1, 1000);
    camera.position.set(0, 1.2, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightNum);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(new THREE.Color(glowColor), 3.5, 12);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const bottomGlow = new THREE.PointLight(new THREE.Color(modelColor), 2.2, 8);
    bottomGlow.position.set(0, -0.6, 1);
    scene.add(bottomGlow);

    // Root model group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Optional Pedestal
    if (showPedestal) {
      const pedestalGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.18, 32);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.8,
      });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.y = -1.1;
      pedestal.receiveShadow = true;
      rootGroup.add(pedestal);

      // Neon Ring on pedestal
      const ringGeo = new THREE.TorusGeometry(1.45, 0.03, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(glowColor) });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.0;
      rootGroup.add(ring);
    }

    // Dynamic item construction based on modelType
    const itemGroup = new THREE.Group();
    rootGroup.add(itemGroup);

    const primaryColor = new THREE.Color(modelColor);
    const secondaryColor = new THREE.Color(glowColor);

    if (modelType === 'little_guy') {
      // Build "The Little Guy" - charismatic mascot
      const bodyMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.25,
        metalness: 0.6,
      });

      // Head / Torso bean
      const headGeo = new THREE.SphereGeometry(0.7, 32, 32);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.scale.set(1, 1.15, 0.9);
      itemGroup.add(head);

      // Cute Eyes / Cyber Visor
      const visorGeo = new THREE.BoxGeometry(0.75, 0.22, 0.4);
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 0.15, 0.52);
      itemGroup.add(visor);

      // Eye dots
      const eyeGeo = new THREE.SphereGeometry(0.06, 16, 16);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.2, 0.16, 0.74);
      const rightEye = leftEye.clone();
      rightEye.position.set(0.2, 0.16, 0.74);
      itemGroup.add(leftEye, rightEye);

      // Little Antenna with glowing orb
      const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(0, 0.9, 0);
      itemGroup.add(stem);

      const orbGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({ color: secondaryColor });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(0, 1.1, 0);
      itemGroup.add(orb);

      // Floating Hands
      const handGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const leftHand = new THREE.Mesh(handGeo, bodyMat);
      leftHand.position.set(-0.95, -0.1, 0.2);
      const rightHand = new THREE.Mesh(handGeo, bodyMat);
      rightHand.position.set(0.95, -0.1, 0.2);
      itemGroup.add(leftHand, rightHand);

      // Orbiting Neon Ring
      const auraRingGeo = new THREE.TorusGeometry(1.15, 0.025, 16, 64);
      const auraRingMat = new THREE.MeshBasicMaterial({ color: secondaryColor });
      const auraRing = new THREE.Mesh(auraRingGeo, auraRingMat);
      auraRing.rotation.x = Math.PI / 3;
      itemGroup.add(auraRing);

    } else if (modelType === 'golden_trophy') {
      // Golden Athletic Trophy
      const goldMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.15,
        metalness: 0.9,
      });

      const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 0.4, 24), goldMat);
      cupBase.position.y = -0.5;
      itemGroup.add(cupBase);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 16), goldMat);
      stem.position.y = -0.15;
      itemGroup.add(stem);

      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.32, 0.8, 24), goldMat);
      bowl.position.y = 0.45;
      itemGroup.add(bowl);

      // Handles
      const handleGeo = new THREE.TorusGeometry(0.35, 0.06, 16, 32, Math.PI);
      const leftHandle = new THREE.Mesh(handleGeo, goldMat);
      leftHandle.rotation.z = Math.PI / 2;
      leftHandle.position.set(-0.65, 0.45, 0);
      const rightHandle = leftHandle.clone();
      rightHandle.rotation.z = -Math.PI / 2;
      rightHandle.position.set(0.65, 0.45, 0);
      itemGroup.add(leftHandle, rightHandle);

      // Floating star on top
      const starGeo = new THREE.OctahedronGeometry(0.22, 0);
      const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.y = 1.05;
      itemGroup.add(star);

    } else if (modelType === 'potion_flask') {
      // Chemical Flask / Slushie Elixir
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        transmission: 0.85,
        thickness: 0.5,
      });
      const liquidMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.2,
        emissive: secondaryColor,
        emissiveIntensity: 0.4,
      });

      const sphereGeo = new THREE.SphereGeometry(0.7, 32, 32);
      const outerFlask = new THREE.Mesh(sphereGeo, glassMat);
      itemGroup.add(outerFlask);

      const liquid = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 24), liquidMat);
      liquid.position.y = -0.05;
      itemGroup.add(liquid);

      const neckGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.55, 16);
      const neck = new THREE.Mesh(neckGeo, glassMat);
      neck.position.y = 0.85;
      itemGroup.add(neck);

      const corkGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.2, 16);
      const corkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const cork = new THREE.Mesh(corkGeo, corkMat);
      cork.position.y = 1.15;
      itemGroup.add(cork);

    } else if (modelType === 'school_pass') {
      // Hall Pass / Magic Badge
      const passGeo = new THREE.BoxGeometry(1.2, 1.7, 0.08);
      const passMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.2,
        metalness: 0.5,
      });
      const pass = new THREE.Mesh(passGeo, passMat);
      itemGroup.add(pass);

      // Lanyard clip
      const clipGeo = new THREE.TorusGeometry(0.18, 0.04, 16, 32);
      const clipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
      const clip = new THREE.Mesh(clipGeo, clipMat);
      clip.position.set(0, 0.95, 0);
      itemGroup.add(clip);

      // Glowing emblem
      const emblemGeo = new THREE.CircleGeometry(0.35, 32);
      const emblemMat = new THREE.MeshBasicMaterial({ color: secondaryColor });
      const emblem = new THREE.Mesh(emblemGeo, emblemMat);
      emblem.position.set(0, 0.15, 0.045);
      itemGroup.add(emblem);

    } else {
      // Default: Meme Orb / Cyber Disk
      const orbMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.3,
        metalness: 0.8,
        wireframe: false,
      });
      const orbGeo = new THREE.IcosahedronGeometry(0.75, 1);
      const orb = new THREE.Mesh(orbGeo, orbMat);
      itemGroup.add(orb);

      // Cyber Ring
      const ringGeo = new THREE.TorusGeometry(1.1, 0.03, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: secondaryColor });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 4;
      itemGroup.add(ring);
    }

    // Floating Ambient Dust/Sparks
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 3.5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 3 + 0.2;
      particlePositions[i + 2] = (Math.random() - 0.5) * 3.5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: secondaryColor,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particles);

    // Mouse / Touch Controls
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      stateRef.current.isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      stateRef.current.prevX = clientX;
      stateRef.current.prevY = clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!stateRef.current.isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - stateRef.current.prevX;
      const deltaY = clientY - stateRef.current.prevY;

      stateRef.current.rotY += deltaX * 0.008;
      stateRef.current.rotX = Math.max(-0.6, Math.min(0.8, stateRef.current.rotX + deltaY * 0.008));

      stateRef.current.prevX = clientX;
      stateRef.current.prevY = clientY;
    };

    const handlePointerUp = () => {
      stateRef.current.isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    domEl.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Bobbing floating motion
      itemGroup.position.y = Math.sin(elapsedTime * 2.2) * 0.08;

      if (autoRotate && !stateRef.current.isDragging) {
        stateRef.current.rotY += stateRef.current.autoRotateSpeed;
      }

      rootGroup.rotation.y = stateRef.current.rotY;
      rootGroup.rotation.x = stateRef.current.rotX;

      // Particle subtle rotation
      particles.rotation.y = elapsedTime * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 320;
      const newHeight = typeof height === 'number' ? height : (container.clientHeight || 360);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domEl.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      renderer.dispose();
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, [modelType, modelColor, glowColor, autoRotate, interactive, height, showPedestal]);

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={mountRef} className="w-full h-full" />
      {interactive && isHovered && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs text-slate-300 pointer-events-none border border-slate-700/50">
          Drag to 3D Inspect
        </div>
      )}
    </div>
  );
};
