
    const canvas = document.getElementById('bg-canvas');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x100B16, 0.05);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    /* Signature: a "neural core" — noise-displaced icosphere of particles pulsing like a heartbeat */
    const coreCount = 1400;
    const coreGeo = new THREE.BufferGeometry();
    const corePositions = new Float32Array(coreCount * 3);
    const coreBase = new Float32Array(coreCount * 3);
    for (let i = 0; i < coreCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 2.6 + (Math.random() - 0.5) * 0.5;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      corePositions[i * 3] = x; corePositions[i * 3 + 1] = y; corePositions[i * 3 + 2] = z;
      coreBase[i * 3] = x; coreBase[i * 3 + 1] = y; coreBase[i * 3 + 2] = z;
    }
    coreGeo.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
    const coreMat = new THREE.PointsMaterial({ color: 0xC8F241, size: 0.045, transparent: true, opacity: 0.75 });
    const core = new THREE.Points(coreGeo, coreMat);
    scene.add(core);

    // connecting wireframe lines (a handful, not all points, for a "circuit" feel)
    const lineMat = new THREE.LineBasicMaterial({ color: 0xFF3D68, transparent: true, opacity: 0.18 });
    const lineGeo = new THREE.BufferGeometry();
    const linePts = [];
    for (let i = 0; i < 60; i++) {
      const a = Math.floor(Math.random() * coreCount);
      const b = Math.floor(Math.random() * coreCount);
      linePts.push(coreBase[a * 3], coreBase[a * 3 + 1], coreBase[a * 3 + 2]);
      linePts.push(coreBase[b * 3], coreBase[b * 3 + 1], coreBase[b * 3 + 2]);
    }
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePts), 3));
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // outer starfield
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 60;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xEDE6E0, size: 0.045, transparent: true, opacity: 0.4 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
    });

    let scrollProgress = 0;
    function updateScroll() {
      const max = document.body.scrollHeight - window.innerHeight;
      scrollProgress = max > 0 ? window.scrollY / max : 0;
      document.getElementById('progress').style.width = (scrollProgress * 100) + '%';
    }
    window.addEventListener('scroll', updateScroll, { passive: true });

    function resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', resize);

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.012;

      if (!reduced) {
        const pulse = 1 + Math.sin(t * 1.4) * 0.035;
        const posAttr = coreGeo.attributes.position;
        for (let i = 0; i < coreCount; i++) {
          const bx = coreBase[i * 3], by = coreBase[i * 3 + 1], bz = coreBase[i * 3 + 2];
          const n = Math.sin(bx * 1.5 + t) * Math.cos(by * 1.5 + t) * 0.12;
          posAttr.array[i * 3] = bx * pulse + n;
          posAttr.array[i * 3 + 1] = by * pulse + n;
          posAttr.array[i * 3 + 2] = bz * pulse + n;
        }
        posAttr.needsUpdate = true;

        core.rotation.y += 0.0022;
        lines.rotation.y += 0.0022;
        core.rotation.x += 0.0008;
        lines.rotation.x += 0.0008;
        stars.rotation.y += 0.0002;

        camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.03;
        camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
      }

      core.position.z = -1 - scrollProgress * 7;
      lines.position.z = -1 - scrollProgress * 7;

      renderer.render(scene, camera);
    }
    animate();

    const els = document.querySelectorAll('.fade-in');
    if (reduced) {
      els.forEach(el => el.classList.add('visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
      }, { threshold: 0.15 });
      els.forEach(el => io.observe(el));
    }

    const navLinks = document.querySelectorAll('nav a');
    const sections = ['hero', 'about', 'projects', 'skills', 'achievements', 'certificates', 'contact'].map(id => document.getElementById(id));
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          const active = document.querySelector(`nav a[data-tab="${entry.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => s && navObserver.observe(s));
