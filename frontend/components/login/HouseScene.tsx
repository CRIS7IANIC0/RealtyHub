"use client";

/* ─────────────────────────────────────────────────────────────
   HouseScene — casa en 3D real (three.js) para la pantalla de login.
   Casa estilizada con luz cálida en puerta y ventanas, plataforma, árboles
   y partículas flotantes. Gira lentamente y se inclina siguiendo al puntero.
   Se pausa fuera de pantalla; si no hay WebGL, no pinta nada (el panel
   queda con su degradado). Respeta prefers-reduced-motion (escena fija).
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HouseScene({ variant = "login" }: { variant?: "login" | "hero" }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // sin WebGL
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 2.9, 9.2);
    camera.lookAt(0, 0.5, 0);

    /* ── Luces ── */
    scene.add(new THREE.HemisphereLight(0xfff1e0, 0x1a2030, 0.9));
    const sun = new THREE.DirectionalLight(0xffe3c4, 2.4);
    sun.position.set(4.5, 6, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    sun.shadow.bias = -0.0006;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xd98a7e, 1.8);
    rim.position.set(-5, 3, -4);
    scene.add(rim);
    const doorLight = new THREE.PointLight(0xffb26b, 8, 6, 2);
    doorLight.position.set(0, 0.4, 2.1);
    scene.add(doorLight);

    /* ── Materiales ── */
    const mat = (color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.04, flatShading: true, ...extra });
    const wallM = mat(0xece6dc);
    const roofM = mat(0xb04e42, { roughness: 0.5 });
    const baseM = mat(0x2c3445, { roughness: 0.4, metalness: 0.25 });
    const trimM = mat(0xfaf8f4);
    const doorM = mat(0x151922);
    const glowM = new THREE.MeshStandardMaterial({
      color: 0xffd9a0,
      emissive: 0xffb26b,
      emissiveIntensity: 1.6,
      roughness: 0.3,
    });
    const leafM = mat(0x5f8a6e);
    const trunkM = mat(0x6b4a3a);

    const house = new THREE.Group();
    scene.add(house);

    const add = (geo: THREE.BufferGeometry, m: THREE.Material, pos: [number, number, number], shadow = true) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(...pos);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      house.add(mesh);
      return mesh;
    };

    // Plataforma
    add(new THREE.CylinderGeometry(3.3, 3.5, 0.3, 64), baseM, [0, -0.15, 0]);
    add(new THREE.CylinderGeometry(3.0, 3.0, 0.06, 64), mat(0x39445a), [0, 0.03, 0], false);

    // Cuerpo
    add(new THREE.BoxGeometry(2.6, 1.7, 2.1), wallM, [0, 0.95, 0]);
    add(new THREE.BoxGeometry(2.75, 0.12, 2.25), trimM, [0, 0.12, 0]);
    // Techo (pirámide de 4 caras ajustada al rectángulo)
    const roof = add(new THREE.ConeGeometry(1, 1.35, 4), roofM, [0, 2.35, 0]);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.95, 1, 1.6);
    // Chimenea
    add(new THREE.BoxGeometry(0.34, 0.9, 0.34), mat(0x8a6a5e), [0.75, 2.55, -0.3]);
    // Puerta + marco + luz
    add(new THREE.BoxGeometry(0.66, 1.1, 0.06), doorM, [0, 0.62, 1.06]);
    add(new THREE.BoxGeometry(0.78, 1.22, 0.04), trimM, [0, 0.66, 1.05], false);
    add(new THREE.BoxGeometry(0.5, 0.06, 0.5), trimM, [0, 0.1, 1.3], false);
    // Ventanas
    for (const x of [-0.85, 0.85]) {
      add(new THREE.BoxGeometry(0.62, 0.62, 0.06), glowM, [x, 1.15, 1.06], false);
      add(new THREE.BoxGeometry(0.76, 0.76, 0.04), trimM, [x, 1.15, 1.04], false);
    }
    // Ventana lateral
    const side = add(new THREE.BoxGeometry(0.06, 0.62, 0.62), glowM, [1.31, 1.15, 0.1], false);
    side.rotation.y = 0;

    // Árboles
    const trees: THREE.Group[] = [];
    const tree = (x: number, z: number, s: number) => {
      const g = new THREE.Group();
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.5, 6), trunkM);
      t.position.y = 0.25;
      t.castShadow = true;
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 7), leafM);
      c1.position.y = 0.85;
      c1.castShadow = true;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.7, 7), leafM);
      c2.position.y = 1.35;
      c2.castShadow = true;
      g.add(t, c1, c2);
      g.position.set(x, 0, z);
      g.scale.setScalar(s);
      house.add(g);
      trees.push(g);
    };
    tree(-2.2, 0.9, 1);
    tree(2.3, 1.2, 0.8);
    tree(-1.9, -1.3, 0.7);
    tree(2.0, -1.2, 0.95);

    // Camino
    const path = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 1.5), mat(0xd8d1c6));
    path.position.set(0, 0.08, 2.05);
    path.receiveShadow = true;
    house.add(path);

    /* ── Partículas ── */
    const N = 260;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 3 + Math.random() * 4.5;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 5 - 0.5;
      pos[i * 3 + 2] = Math.sin(a) * r - 1;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const points = new THREE.Points(
      pg,
      new THREE.PointsMaterial({ color: 0xe7b4a8, size: 0.05, transparent: true, opacity: 0.8, depthWrite: false })
    );
    scene.add(points);

    let homeX = 0;

    /* ── Tamaño ── */
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      // Encuadre más amplio en paneles estrechos
      // Encuadra el ancho de la casa aunque el panel sea estrecho (el borde de la plataforma puede recortarse)
      if (variant === "hero") {
        // Encuadre ancho: la casa vive a la derecha; en pantallas verticales, centrada y arriba
        const wide = camera.aspect > 1.15;
        camera.position.z = wide ? 9.6 : Math.max(11, 3.2 / (camera.aspect * 0.3057));
        camera.position.y = 2.6;
        camera.lookAt(0, wide ? 1.2 : 0.4, 0);
        homeX = wide ? Math.min(3.1, camera.aspect * 1.55) : 0;
      } else {
        camera.position.z = Math.max(9.2, 3.0 / (camera.aspect * 0.3057));
        camera.position.y = 2.9 + (camera.position.z - 9.2) * 0.12;
        camera.lookAt(0, 1.7, 0);
      }
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    /* ── Puntero ── */
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    /* ── Bucle ── */
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const clock = new THREE.Clock();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = clock.getElapsedTime();
      const intro = reduced ? 1 : easeOut(Math.min(1, t / 2.2));

      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;

      house.rotation.y = (reduced ? 0.5 : -0.9 + intro * 1.4 + t * 0.12) + cx * 0.5;
      house.rotation.x = cy * 0.1;
      house.position.x = homeX * intro;
      house.position.y = Math.sin(t * 0.9) * 0.06 - (1 - intro) * 1.2;
      house.scale.setScalar(0.6 + intro * 0.4);
      trees.forEach((tr, i) => {
        const pop = easeOut(Math.min(1, Math.max(0, (t - 0.8 - i * 0.18) / 0.9)));
        tr.scale.y = (reduced ? 1 : pop) * (0.7 + (i % 3) * 0.15);
      });
      glowM.emissiveIntensity = 1.4 + Math.sin(t * 2.3) * 0.15;
      doorLight.intensity = 7 + Math.sin(t * 2.3) * 0.8;

      points.rotation.y = t * 0.03;
      points.position.y = Math.sin(t * 0.4) * 0.15;

      renderer.render(scene, camera);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mm = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose());
        else mm?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="absolute inset-0" aria-hidden="true" />;
}
