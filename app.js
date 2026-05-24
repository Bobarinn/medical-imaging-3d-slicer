const SKILLS = [
  '3D Slicer', 'Segment Editor', 'Intensity thresholding',
  'Morphological operations', 'Islands / connected components',
  'Volumetric quantification', 'STL export', 'Volume rendering',
  'CT · Hounsfield Units', 'MRI', 'Grow from Seeds',
];

const ALL_MODELS = [
  { id: 'bone', url: 'models/bone.stl', label: 'bone.stl', color: '#e8d9b8' },
  { id: 'lungs', url: 'models/lungs.stl', label: 'lungs.stl', color: '#5fd97a' },
  { id: 'tumor', url: 'models/tumor.stl', label: 'tumor.stl', color: '#ff8585' },
  { id: 'brain', url: 'models/brain-with-tumor.stl', label: 'brain-with-tumor.stl', color: '#4ecdc4' },
];

function Hero() {
  return (
    <section className="hero">
      <div>
        <h1>Medical image<br />segmentation, in <em>3D</em>.</h1>
        <p className="lede">
          Segmentation and volumetric analysis in{' '}
          <a href="https://www.slicer.org/" target="_blank" rel="noreferrer">3D&nbsp;Slicer</a>
          {' '}— part of a broader 3D printing &amp; robotics practice. Two pipelines
          (CT chest, MR brain tumor) from sample DICOM to quantified STL meshes.
        </p>
      </div>
      <div className="meta">
        <div className="row"><span>Portfolio</span><span>Kolade</span></div>
        <div className="row"><span>Software</span><span>3D Slicer · STL</span></div>
        <div className="row"><span>Artifacts</span><span>02</span></div>
        <div className="row"><span>Site</span><span>index.html</span></div>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section className="skills">
      <div className="section-label">Capabilities</div>
      <div className="skill-tags">
        {SKILLS.map((s) => <span key={s} className="skill-tag">{s}</span>)}
      </div>
    </section>
  );
}

function TechniqueTable({ rows }) {
  return (
    <div className="technique">
      {rows.map((r, i) => (
        <div key={i} className="technique-row">
          <div className="step">{r.step}</div>
          <div className="tool">
            <span className="name">{r.tool}</span>
            <span className="detail">{r.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScreenshotGrid({ shots, columns = 2 }) {
  return (
    <div className="screenshots">
      <div className="section-label">Screenshots · 3D Slicer</div>
      <div className={`shot-grid${columns === 1 ? ' single' : ''}`}>
        {shots.map((s) => (
          <figure key={s.src} className="shot">
            <img src={s.src} alt={s.caption} loading="lazy" />
            <figcaption>{s.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function ArtifactCT() {
  const rows = [
    { step: '01 · Bone', tool: 'Threshold (~200 HU)', detail: 'Isolated dense bone from soft tissue on the same CTChest volume.' },
    { step: '02 · Lungs', tool: 'Threshold + Islands', detail: 'Air-filled lung regions; kept largest connected components.' },
    { step: '03 · Clean', tool: 'Islands · Smoothing', detail: 'Removed speckle and smoothed surfaces for both segments.' },
    { step: '04 · Export', tool: 'Segmentations → STL', detail: 'bone.stl and lungs.stl — printable meshes.' },
  ];

  const shots = [
    { src: 'images/ct-bone-segment-editor.png', caption: 'Segment Editor — bone threshold' },
    { src: 'images/bone-axial-segmentation.png', caption: 'Bone — axial / coronal / sagittal + 3D' },
    { src: 'images/bone-3d.png', caption: 'Rib cage surface model' },
    { src: 'images/lungs-bone-quad-view.png', caption: 'Bone + lungs — multi-planar view' },
    { src: 'images/lungs-3d.png', caption: 'Lungs — 3D mesh' },
    { src: 'images/bone-lungs-3d.png', caption: 'Combined bone + lungs' },
  ];

  return (
    <section className="artifact" id="artifact-ct">
      <div className="artifact-head">
        <div className="num">Artifact / 01</div>
        <h2>CT Chest — Bone &amp; Lungs</h2>
        <div className="modality">MODALITY · CT</div>
      </div>

      <div className="artifact-body">
        <div className="artifact-text">
          <h3>Brief</h3>
          <p>
            From one <strong style={{ color: 'var(--text)' }}>CTChest</strong> sample volume,
            segmented bone and lungs using intensity thresholding and cleanup tools
            (Islands, smoothing). Exported separate STL meshes.
          </p>
          <div className="dataset">
            <span>dataset:</span> CTChest · 3D Slicer sample data<br />
            <span>outputs:</span> bone.stl · lungs.stl
          </div>
          <TechniqueTable rows={rows} />
        </div>

        <div className="viewer-dual">
          <div className="viewer-wrap">
            <STLViewer
              modelUrl="models/bone.stl"
              meshColor="#e8d9b8"
              accentLabel="bone.stl"
              allModels={ALL_MODELS}
              defaultModelId="bone"
            />
          </div>
          <div className="viewer-wrap">
            <STLViewer
              modelUrl="models/lungs.stl"
              meshColor="#5fd97a"
              accentLabel="lungs.stl"
              allModels={ALL_MODELS}
              defaultModelId="lungs"
            />
          </div>
        </div>
      </div>

      <ScreenshotGrid shots={shots} />

      <div className="learnings">
        <div className="learning">
          <div className="marker">// CT · HU</div>
          <p>CT Hounsfield Units are standardized — thresholding separates bone from soft tissue reliably.</p>
        </div>
        <div className="learning">
          <div className="marker">// → 3D print</div>
          <p>Segmentation → surface model → STL bridges medical imaging and physical fabrication.</p>
        </div>
      </div>
    </section>
  );
}

function ArtifactMR() {
  const rows = [
    { step: '01 · Segment', tool: 'Grow from Seeds · Threshold + Opening', detail: 'Two methods on MRBrainTumor1; opening (6 mm) + Islands for cleanup.' },
    { step: '02 · Quantify', tool: 'Segment Statistics', detail: 'Tumor volume in cm³, mm³, voxels.' },
    { step: '03 · Export', tool: 'NRRD + STL', detail: 'Labelmap and surface mesh.' },
    { step: '04 · Visualize', tool: 'Volume Rendering + Crop ROI', detail: 'VTK GPU ray casting; cropped ROI to show tumor in context.' },
  ];

  const shots = [
    { src: 'images/tumor-segmentation.png', caption: 'Tumor — 3 planes + 3D' },
    { src: 'images/tumor-volume-stats.png', caption: 'Segment Statistics — 16.28 cm³' },
    { src: 'images/tumor-volume-rendering.png', caption: 'Volume rendering — cropped ROI' },
    { src: 'images/tumor-segment-editor-smoothing.png', caption: 'Morphological opening — Segment Editor' },
    { src: 'images/tumor-brain-volume-rendering.png', caption: 'Brain segmentation + volume render' },
  ];

  return (
    <section className="artifact" id="artifact-mr">
      <div className="artifact-head">
        <div className="num">Artifact / 02</div>
        <h2>MR Brain Tumor — Segmentation &amp; Volumetry</h2>
        <div className="modality">MODALITY · MR</div>
      </div>

      <div className="artifact-body">
        <div className="viewer-wrap">
          <STLViewer
            modelUrl="models/tumor.stl"
            meshColor="#ff8585"
            accentLabel="tumor.stl"
            allModels={ALL_MODELS}
            defaultModelId="tumor"
          />
        </div>

        <div className="artifact-text">
          <h3>Brief</h3>
          <p>
            Segment contrast-enhancing tumor, measure volume, export STL, visualize
            in situ with direct volume rendering.
          </p>
          <div className="dataset">
            <span>dataset:</span> MRBrainTumor1<br />
            <span>output:</span> tumor.stl · 16.28 cm³
          </div>
          <TechniqueTable rows={rows} />
        </div>
      </div>

      <div className="callout">
        <div>
          <div className="label">Tumor volume</div>
          <div className="big">16.28<sup>cm³</sup></div>
          <div className="sub">16,279 mm³ · 13,230 voxels</div>
        </div>
      </div>

      <ScreenshotGrid shots={shots} columns={2} />

      <div className="learnings">
        <div className="learning">
          <div className="marker">// MR</div>
          <p>MR has no fixed HU scale — seeded region growing and morphology replace a single threshold.</p>
        </div>
        <div className="learning">
          <div className="marker">// Rendering</div>
          <p>Surface rendering meshes a segment; volume rendering ray-casts raw voxels.</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site" id="contact">
      <div className="col">
        <h4>Contact</h4>
        <a href="https://victorkolade.dev" target="_blank" rel="noreferrer">victorkolade.dev</a>
        <a href="mailto:koladeabobarin@gmail.com">koladeabobarin@gmail.com</a>
      </div>
      <div className="col">
        <h4>Data</h4>
        <p>3D Slicer public sample datasets only. No patient data.</p>
      </div>
      <div className="col">
        <h4>Run locally</h4>
        <p><code style={{ color: 'var(--accent)' }}>npm run serve</code> → localhost:3456</p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <div className="page">
      <header className="site">
        <div className="id"><span className="dot" />KOLADE · MEDICAL IMAGING</div>
        <nav>
          <a href="#artifact-ct">01 / CT</a>
          <a href="#artifact-mr">02 / MR</a>
          <a href="#contact">contact</a>
        </nav>
      </header>
      <Hero />
      <Skills />
      <ArtifactCT />
      <ArtifactMR />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
