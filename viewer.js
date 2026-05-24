const { useRef, useEffect, useState, useCallback } = React;

function mergeBufferGeometries(geometries) {
  const positions = [];
  for (const g of geometries) {
    const pos = g.attributes.position;
    const index = g.index;
    if (index) {
      for (let i = 0; i < index.count; i++) {
        const idx = index.getX(i);
        positions.push(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      }
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return out;
}

function buildPlaceholderBone() {
  const geos = [];
  for (let i = 0; i < 6; i++) {
    const box = new THREE.BoxGeometry(0.55, 0.18, 0.45);
    box.translate(0, (i - 2.5) * 0.28, 0);
    geos.push(box);
  }
  const merged = mergeBufferGeometries(geos);
  merged.computeVertexNormals();
  return merged;
}

function fitGeometryToView(geometry, targetSize = 2) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(scale, scale, scale);
  geometry.computeVertexNormals();
  return geometry;
}

function initThreeScene(mount, meshColor) {
  const w = mount.clientWidth || 400;
  const h = mount.clientHeight || 400;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#11161d');

  const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  camera.position.set(2.4, 1.6, 3.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6cdfe8, 0.45);
  rim.position.set(-3, 2, -2);
  scene.add(rim);

  const grid = new THREE.GridHelper(8, 16, 0x1e2731, 0x161d26);
  grid.position.y = -1.2;
  scene.add(grid);

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(meshColor),
    roughness: 0.55,
    metalness: 0.05,
  });
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(meshColor),
    wireframe: true,
    transparent: true,
    opacity: 0.7,
  });

  let geometry = fitGeometryToView(buildPlaceholderBone());
  let mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;

  const api = {
    scene,
    camera,
    renderer,
    controls,
    material,
    wireMaterial,
    get mesh() { return mesh; },
    get geometry() { return geometry; },
    setMeshColor(hex) {
      material.color.set(hex);
      wireMaterial.color.set(hex);
    },
    replaceGeometry(newGeo, name) {
      scene.remove(mesh);
      geometry.dispose();
      geometry = newGeo;
      mesh = new THREE.Mesh(newGeo, material);
      scene.add(mesh);
      return {
        tris: Math.floor(newGeo.attributes.position.count / 3),
        verts: newGeo.attributes.position.count,
        name,
      };
    },
    resetCamera() {
      camera.position.set(2.4, 1.6, 3.2);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    setWireframe(on) {
      mesh.material = on ? wireMaterial : material;
    },
    setAutoRotate(on) {
      controls.autoRotate = on;
    },
    resize() {
      const rw = mount.clientWidth;
      const rh = mount.clientHeight;
      if (!rw || !rh) return;
      renderer.setSize(rw, rh);
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
    },
    dispose() {
      controls.dispose();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      wireMaterial.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    },
  };

  let raf;
  const tick = () => {
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  const ro = new ResizeObserver(() => api.resize());
  ro.observe(mount);

  api._cleanup = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    api.dispose();
  };

  return api;
}

async function loadStlInto(api, url, color) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  const buf = await res.arrayBuffer();
  const loader = new THREE.STLLoader();
  const geo = fitGeometryToView(loader.parse(buf), 2);
  if (color) api.setMeshColor(color);
  return api.replaceGeometry(geo, url.split('/').pop());
}

function ViewerBtn({ children, onClick, active, accent, as = 'button' }) {
  const Tag = as;
  return (
    <Tag
      onClick={onClick}
      style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 11,
        padding: '6px 10px',
        background: accent ? '#0e2225' : active ? '#1a2630' : 'rgba(17, 22, 29, 0.85)',
        border: `1px solid ${accent ? '#2a6066' : active ? '#2a3543' : '#1e2731'}`,
        color: accent ? '#6cdfe8' : active ? '#6cdfe8' : '#b3bdc8',
        borderRadius: 2,
        cursor: 'pointer',
        letterSpacing: '0.04em',
        backdropFilter: 'blur(6px)',
        userSelect: 'none',
        display: 'inline-block',
      }}
    >
      {children}
    </Tag>
  );
}

function ViewerControls({
  wireframe,
  setWireframe,
  autoRotate,
  setAutoRotate,
  onReset,
  onFullscreen,
  loading,
  fullscreenLabel = 'fullscreen',
}) {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12, right: 12,
      display: 'flex', gap: 6, justifyContent: 'space-between', flexWrap: 'wrap',
      zIndex: 2,
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <ViewerBtn active={autoRotate} onClick={() => setAutoRotate(!autoRotate)}>
          {autoRotate ? '⏸ rotate' : '▶ rotate'}
        </ViewerBtn>
        <ViewerBtn active={wireframe} onClick={() => setWireframe(!wireframe)}>wireframe</ViewerBtn>
        <ViewerBtn onClick={onReset}>reset view</ViewerBtn>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {loading && (
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#6cdfe8' }}>
            loading…
          </span>
        )}
        <ViewerBtn accent onClick={onFullscreen}>{fullscreenLabel}</ViewerBtn>
      </div>
    </div>
  );
}

/** Mounts only when visible — ensures Three.js init runs after ref is in DOM */
function ModelViewport({
  modelUrl,
  meshColor,
  accentLabel,
  wireframe,
  autoRotate,
  onStats,
  onReady,
  controlsProps = {},
}) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const api = initThreeScene(mount, meshColor);
    apiRef.current = api;
    onReady?.(api);

    let cancelled = false;
    (async () => {
      if (!modelUrl) return;
      try {
        const info = await loadStlInto(api, modelUrl, meshColor);
        if (!cancelled) onStats?.(info);
      } catch (e) {
        console.warn('STL load failed:', modelUrl, e);
      }
    })();

    return () => {
      cancelled = true;
      api._cleanup();
      apiRef.current = null;
    };
  }, [modelUrl, meshColor]);

  useEffect(() => {
    apiRef.current?.setWireframe(wireframe);
  }, [wireframe]);

  useEffect(() => {
    apiRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  return (
    <div className="viewer" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} className="viewer-canvas-host" />
      <div style={{
        position: 'absolute', top: 14, left: 16, zIndex: 2,
        fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#7c8794', pointerEvents: 'none',
      }}>
        <div><span style={{ color: meshColor }}>●</span> {accentLabel}</div>
      </div>
      <ViewerControls
        wireframe={wireframe}
        setWireframe={controlsProps.setWireframe}
        autoRotate={autoRotate}
        setAutoRotate={controlsProps.setAutoRotate}
        onReset={() => apiRef.current?.resetCamera()}
        onFullscreen={controlsProps.onFullscreen}
        loading={controlsProps.loading}
        fullscreenLabel={controlsProps.fullscreenLabel}
      />
    </div>
  );
}

function FullscreenOverlay({
  model,
  allModels,
  onModelChange,
  onClose,
  wireframe,
  setWireframe,
  autoRotate,
  setAutoRotate,
}) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ name: '…' });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fs-overlay" role="dialog" aria-label="3D viewer fullscreen">
      <div className="fs-header">
        <span style={{ color: '#6cdfe8' }}>
          ● {stats.name || model.label}
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {allModels.length > 0 && (
            <select
              value={model.id}
              onChange={(e) => {
                setLoading(true);
                onModelChange(e.target.value);
              }}
            >
              {allModels.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          )}
          <ViewerBtn onClick={onClose}>esc · close</ViewerBtn>
        </div>
      </div>
      <div className="fs-body">
        <ModelViewport
          key={model.id}
          modelUrl={model.url}
          meshColor={model.color}
          accentLabel={model.label}
          wireframe={wireframe}
          autoRotate={autoRotate}
          onStats={(info) => {
            setStats(info);
            setLoading(false);
          }}
          controlsProps={{
            setWireframe,
            setAutoRotate,
            onFullscreen: onClose,
            loading,
            fullscreenLabel: 'close',
          }}
        />
      </div>
    </div>
  );
}

function STLViewer({
  modelUrl,
  meshColor,
  accentLabel,
  allModels = [],
  defaultModelId,
}) {
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [stats, setStats] = useState({ tris: 0, name: 'loading…' });
  const [fullscreen, setFullscreen] = useState(false);
  const [fsModelId, setFsModelId] = useState(defaultModelId || allModels[0]?.id);

  const fsModel =
    allModels.find((m) => m.id === fsModelId) ||
    allModels.find((m) => m.url === modelUrl) ||
    { id: 'current', url: modelUrl, label: accentLabel, color: meshColor };

  return (
    <div className="stl-viewer-root" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ModelViewport
        modelUrl={modelUrl}
        meshColor={meshColor}
        accentLabel={accentLabel}
        wireframe={wireframe}
        autoRotate={autoRotate}
        onStats={setStats}
        controlsProps={{
          setWireframe,
          setAutoRotate,
          onFullscreen: () => {
            setFsModelId(defaultModelId || allModels[0]?.id);
            setFullscreen(true);
          },
          loading: stats.name === 'loading…',
        }}
      />
      <div style={{
        position: 'absolute', top: 14, right: 16, zIndex: 2,
        fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#7c8794',
        textAlign: 'right', pointerEvents: 'none',
      }}>
        <div>{stats.tris?.toLocaleString?.() || '—'} tris</div>
      </div>

      {fullscreen && (
        <FullscreenOverlay
          model={fsModel}
          allModels={allModels}
          onModelChange={setFsModelId}
          onClose={() => setFullscreen(false)}
          wireframe={wireframe}
          setWireframe={setWireframe}
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
        />
      )}
    </div>
  );
}

window.STLViewer = STLViewer;
