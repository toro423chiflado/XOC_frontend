import { useEffect, useRef } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";

export default function GlobeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const bounds = container.getBoundingClientRect();
    const width = Math.max(1, container.clientWidth || bounds.width || window.innerWidth);
    const height = Math.max(1, container.clientHeight || bounds.height || window.innerHeight);

    // Scene
    const scene = new THREE.Scene();

    const globeScale = 8.5;
    const horizonOffsetY = -145;
    const cameraTargetY = 0;

    // Camera
    const camera = new THREE.PerspectiveCamera(11, width / height, 0.1, 2000);
    camera.position.set(0, 110, 140);
    camera.fov = 11;
    camera.updateProjectionMatrix();
    camera.lookAt(0, cameraTargetY, 0);

    // Renderer
    let renderer: any;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (error) {
      console.warn("[LANDING] Globe renderer could not initialize", error);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.left = '50%';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.transform = 'translateX(-50%)';
    if (!container.contains(renderer.domElement)) {
      container.appendChild(renderer.domElement);
    }

    // Globe
    const tubePoints = [...Array(700).keys()].map(() => ({
      kind: 'tube',
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      size: 0.04 + Math.random() * 0.02
    }));

    const cityLights = [...Array(1200).keys()].map(() => ({
      kind: 'city',
      lat: (Math.random() - 0.5) * 140,
      lng: (Math.random() - 0.5) * 360,
      size: 0.01
    }));

    const globeTextureUrl = `${import.meta.env.BASE_URL}2k_earth_daymap.jpg`;

    const globe = new ThreeGlobe()
      .globeImageUrl(globeTextureUrl)
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .pointsData([...tubePoints, ...cityLights])
      .pointAltitude('size')
      .pointRadius((d: any) => (d?.kind === 'city' ? 0.02 : 0.035))
      .pointColor((d: any) => {
        if (d?.kind === 'city') {
          const intensity = 0.6 + Math.random() * 0.4;
          return `rgba(255,255,200,${intensity})`;
        }
        const intensity = 0.8 + Math.random() * 0.2;
        return `rgba(200,255,240,${intensity})`;
      })
      .atmosphereColor("#00ffcc")
      .atmosphereAltitude(0.12)
      .arcsData([...Array(150).keys()].map(() => {
        const lat = (Math.random() - 0.5) * 180;
        const lng = (Math.random() - 0.5) * 360;
        return {
          startLat: lat,
          startLng: lng,
          endLat: lat + (Math.random() - 0.5) * 20,
          endLng: lng + (Math.random() - 0.5) * 20,
          color: ["#00ffd0", "#66f7ff"]
        };
      }))
      .arcColor(() => "rgba(0,255,204,0.5)")
      .arcStroke(() => 0.2)
      .arcAltitude(0.08)
      .arcDashLength(0.15)
      .arcDashGap(0.6)
      .arcDashInitialGap(() => Math.random() * 2)
      .arcDashAnimateTime(4000);

    const textureImage = new Image();
    textureImage.crossOrigin = 'anonymous';
    textureImage.src = globeTextureUrl;
    textureImage.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = textureImage.width;
      canvas.height = textureImage.height;
      ctx.drawImage(textureImage, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const value = gray > 100 ? 90 : 0;

        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }

      ctx.putImageData(imageData, 0, 0);
      globe.globeImageUrl(canvas.toDataURL('image/png'));
    };

    const globeObject = globe as any;
    globeObject.scale.set(globeScale, globeScale, globeScale);
    globeObject.position.set(0, horizonOffsetY, 0);

    // Keep the globe centered on the horizontal axis.
    const recenterX = () => {
      const boundsBox = new THREE.Box3().setFromObject(globeObject);
      const center = boundsBox.getCenter(new THREE.Vector3());
      globeObject.position.x = -center.x;
    };
    recenterX();

    // Re-run once textures settle to avoid drift to one side.
    const recenterTimer = window.setTimeout(recenterX, 250);

    scene.add(globeObject);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const glowLight = new THREE.PointLight(0x3dfff2, 1.6, 15000);
    glowLight.position.set(0, 350, 1800);
    scene.add(glowLight);

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 4000;
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 6000;
    }

    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, transparent: true, opacity: 0.45 });
    const starField = new THREE.Points(starsGeometry, starsMaterial);

    scene.add(starField);

    // Scroll tracking
    let lastScroll = window.scrollY;
    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const delta = window.scrollY - lastScroll;
      globeObject.rotation.y += 0.00015;
      globeObject.rotation.y += delta * 0.0004;
      lastScroll = window.scrollY;

      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const nextBounds = containerRef.current.getBoundingClientRect();
      const w = Math.max(1, containerRef.current.clientWidth || nextBounds.width || window.innerWidth);
      const h = Math.max(1, containerRef.current.clientHeight || nextBounds.height || window.innerHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = 11;
      camera.updateProjectionMatrix();
      camera.lookAt(0, cameraTargetY, 0);
      recenterX();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(recenterTimer);
      window.removeEventListener("resize", handleResize);
      starsGeometry.dispose();
      starsMaterial.dispose();
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 inset-y-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center"
    />
  );
}
