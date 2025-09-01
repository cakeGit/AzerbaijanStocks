import React, { useState, useEffect, useRef } from 'react';

const SecretaryJob = () => {
  const [emails, setEmails] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [gameActive, setGameActive] = useState(false);
  const [message, setMessage] = useState('');
  const [draggedEmail, setDraggedEmail] = useState(null); // { id, offsetX, offsetY }
  const [dragPos, setDragPos] = useState(null); // { x, y }
  const [hoveredFolder, setHoveredFolder] = useState(null);
  const [shakingFolder, setShakingFolder] = useState(null);
  const gameAreaRef = useRef(null);
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const dotsRef = useRef([]);
  const animRef = useRef(null);
  const wavesRef = useRef([]);
  const lastSpawnRef = useRef(0);

  const emailTemplates = [
    // Important emails (20)
    { content: 'Urgent meeting request from CEO', category: 'Important' },
    { content: 'Project deadline reminder', category: 'Important' },
    { content: 'Board meeting scheduled for tomorrow', category: 'Important' },
    { content: 'Client presentation needs revision', category: 'Important' },
    { content: 'Financial report due by end of day', category: 'Important' },
    { content: 'Executive team strategy session', category: 'Important' },
    { content: 'Contract negotiation update', category: 'Important' },
    { content: 'Quarterly performance review', category: 'Important' },
    { content: 'Investor call preparation needed', category: 'Important' },
    { content: 'Budget approval required', category: 'Important' },
    { content: 'Security system maintenance alert', category: 'Important' },
    { content: 'Legal document review needed', category: 'Important' },
    { content: 'Employee performance review', category: 'Important' },
    { content: 'IT infrastructure outage', category: 'Important' },
    { content: 'Compliance training mandatory', category: 'Important' },
    { content: 'Vendor payment processing', category: 'Important' },
    { content: 'Customer complaint escalation', category: 'Important' },
    { content: 'Product launch coordination', category: 'Important' },

    // Not Important emails (20)
    { content: 'Weekly newsletter subscription', category: 'Not Important' },
    { content: 'Social media update', category: 'Not Important' },
    { content: 'Team lunch planning', category: 'Not Important' },
    { content: 'Office supplies reorder', category: 'Not Important' },
    { content: 'Birthday celebration reminder', category: 'Not Important' },
    { content: 'Parking permit renewal', category: 'Not Important' },
    { content: 'Coffee machine maintenance', category: 'Not Important' },
    { content: 'Printer toner replacement', category: 'Not Important' },
    { content: 'Vacation schedule update', category: 'Not Important' },
    { content: 'Office cleaning schedule', category: 'Not Important' },
    { content: 'Company photo day reminder', category: 'Not Important' },
    { content: 'Water cooler refill notice', category: 'Not Important' },
    { content: 'Elevator maintenance today', category: 'Not Important' },
    { content: 'New employee welcome', category: 'Not Important' },
    { content: 'Facility maintenance update', category: 'Not Important' },
    { content: 'Company swag distribution', category: 'Not Important' },
    { content: 'Holiday party planning', category: 'Not Important' },
    { content: 'Office plant watering', category: 'Not Important' },
    { content: 'Newsletter content submission', category: 'Not Important' },
    { content: 'Team building activity', category: 'Not Important' },

    // Spam emails (20)
    { content: 'Win a free iPhone! Click here', category: 'Spam' },
    { content: 'Congratulations! You won the lottery', category: 'Spam' },
    { content: 'Get rich quick scheme', category: 'Spam' },
    { content: 'Free vacation giveaway', category: 'Spam' },
    { content: 'Investment opportunity', category: 'Spam' },
    { content: 'Weight loss miracle pill', category: 'Spam' },
    { content: 'Cheap prescription drugs', category: 'Spam' },
    { content: 'Work from home and get rich', category: 'Spam' },
    { content: 'Prince needs your help', category: 'Spam' },
    { content: 'Your account has been compromised', category: 'Spam' },
    { content: 'Free gift card offer', category: 'Spam' },
    { content: 'Survey for cash reward', category: 'Spam' },
    { content: 'Extend your warranty now', category: 'Spam' },
    { content: 'Debt consolidation offer', category: 'Spam' },
    { content: 'Timeshare presentation', category: 'Spam' },
    { content: 'Free credit score check', category: 'Spam' },
    { content: 'Online shopping deal', category: 'Spam' },
    { content: 'Charity donation request', category: 'Spam' },
    { content: 'Political campaign email', category: 'Spam' },
    { content: 'FREE your chakra energy today', category: 'Spam' },
  ];

  const generateEmail = () => {
    const template = emailTemplates[Math.floor(Math.random() * emailTemplates.length)];
    const id = Date.now() + Math.random();
    return {
      id,
      ...template,
  // start emails further offscreen to the left so they enter smoothly
  position: -30 + Math.random() * 8, // -30% .. -22%
      top: Math.random() * 0.7 * 300 + 0.15 * 300, // Spawn in middle 70% of 300px spacer
      speed: 0.25 + Math.random() * 0.25,
    };
  };

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(120);
    setEmails([generateEmail()]);
    setMessage('');
  };

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameActive(false);
      setMessage(`Time's up! Final score: ${score}`);
    }
  }, [gameActive, timeLeft, score]);

  useEffect(() => {
    if (gameActive) {
      const moveEmails = setInterval(() => {
        setEmails(prev => prev.map(email => ({
          ...email,
          // don't auto-move the one currently being pointer-dragged
          position: draggedEmail && draggedEmail.id === email.id ? email.position : +(email.position + email.speed).toFixed(3),
        })));
      }, 80);
      return () => clearInterval(moveEmails);
    }
  }, [gameActive, draggedEmail]);

  useEffect(() => {
    if (gameActive) {
      const addEmail = setInterval(() => {
        setEmails(prev => [...prev, generateEmail()]);
      }, 4000);
      return () => clearInterval(addEmail);
    }
  }, [gameActive]);

  // Check for missed emails
  useEffect(() => {
    if (gameActive) {
      const checkMissed = setInterval(() => {
        setEmails(prev => {
          const filtered = prev.filter(email => {
            if (email.position > 90) {
              setScore(currentScore => currentScore - 5);
              return false;
            }
            return true;
          });
          return filtered;
        });
      }, 100);
      return () => clearInterval(checkMissed);
    }
  }, [gameActive]);

  // Spawn extra emails when player is 'on top' (dragging near left spawn area)
  const trySpawnWhenOnTop = (clientX) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const localX = clientX - rect.left;
    const threshold = Math.min(220, rect.width * 0.14); // larger threshold
    const now = Date.now();
    if (localX < threshold && now - lastSpawnRef.current > 700) {
      setEmails(prev => [...prev, generateEmail(), ...(Math.random() > 0.6 ? [generateEmail()] : [])]);
      lastSpawnRef.current = now;
    }
  };

  // Folder hover helpers
  const handleFolderEnter = (folderType) => {
    setHoveredFolder(folderType);
  };

  const handleFolderLeave = () => {
    setHoveredFolder(null);
  };

  // Custom pointer drag (replaces native drag) so the actual element follows pointer
  const onEmailPointerDown = (e, email) => {
    // left button only
    if (e.button && e.button !== 0) return;
    e.preventDefault();
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDraggedEmail({ id: email.id, offsetX, offsetY });
    // set initial drag pos relative to game area
    // prefer the game area for drag coordinates so elements are positioned relative to the clipped container
    const containerRect = gameAreaRef.current?.getBoundingClientRect();
    if (containerRect) {
      setDragPos({ x: e.clientX - containerRect.left - offsetX, y: e.clientY - containerRect.top - offsetY });
    } else {
      const gameRect = gameAreaRef.current?.getBoundingClientRect();
      if (gameRect) setDragPos({ x: e.clientX - gameRect.left - offsetX, y: e.clientY - gameRect.top - offsetY });
      else setDragPos({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    }
    // mark pointer for canvas interaction
    pointerRef.current.x = e.clientX;
    pointerRef.current.y = e.clientY;
    pointerRef.current.active = true;

    // attach global listeners
    const onMove = (ev) => {
      ev.preventDefault();
      const cRect = gameAreaRef.current?.getBoundingClientRect();
      const areaRect = cRect || gameAreaRef.current?.getBoundingClientRect();
      const localX = areaRect ? ev.clientX - areaRect.left - offsetX : ev.clientX - offsetX;
      const localY = areaRect ? ev.clientY - areaRect.top - offsetY : ev.clientY - offsetY;
      setDragPos({ x: localX, y: localY });
      pointerRef.current.x = ev.clientX;
      pointerRef.current.y = ev.clientY;
      pointerRef.current.active = true;
      trySpawnWhenOnTop(ev.clientX);
    };

    const onUp = (ev) => {
      ev.preventDefault();
      // detect drop target under pointer
      const elems = document.elementsFromPoint(ev.clientX, ev.clientY);
      const folderEl = elems.find(el => el.dataset && el.dataset.category);
      if (folderEl) {
        const category = folderEl.dataset.category;
        // find email object
        const emp = emails.find(x => x.id === email.id);
        if (emp) {
          const isCorrect = emp.category === category;
          setScore(prev => prev + (isCorrect ? 10 : -5));
          setEmails(prev => prev.filter(e2 => e2.id !== email.id));
          if (isCorrect && canvasRef.current) {
            try {
              const rect = canvasRef.current.getBoundingClientRect();
              const waveX = ev.clientX - rect.left;
              const waveY = ev.clientY - rect.top;
              wavesRef.current.push({ x: waveX, y: waveY, r: 1, life: 0 });
            } catch (err) {}
          } else {
            // Wrong category - trigger shake animation
            setShakingFolder(category);
            setTimeout(() => setShakingFolder(null), 500);
          }
        }
      } else {
        // snap back: convert dragPos x -> percent position relative to the game area (so clipping math stays consistent)
        if (dragPos) {
          const areaRect = gameAreaRef.current?.getBoundingClientRect();
          if (areaRect) {
            const percent = Math.max(0, Math.min(98, ((dragPos.x) / areaRect.width) * 100));
            setEmails(prev => prev.map(em => em.id === email.id ? { ...em, position: percent, top: Math.max(8, Math.min(areaRect.height - 60, dragPos.y)) } : em));
          }
        }
      }

      setDraggedEmail(null);
      setDragPos(null);
      pointerRef.current.active = false;
      pointerRef.current.x = -9999;
      pointerRef.current.y = -9999;

      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { passive: false });
  };

  // For accessibility, allow Escape to cancel drag
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && draggedEmail) {
        setDraggedEmail(null);
        setDragPos(null);
        pointerRef.current.active = false;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draggedEmail]);

  // Canvas dot matrix + waves (tuned to be less jumpy)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // rebuild dots grid based on size
      const spacing = 20; // slightly larger spacing
      const cols = Math.ceil(rect.width / spacing) + 1;
      const rows = Math.ceil(rect.height / spacing) + 1;
      const dots = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          dots.push({
            bx: x * spacing,
            by: y * spacing,
            x: x * spacing,
            y: y * spacing,
            vx: 0,
            vy: 0,
          });
        }
      }
      dotsRef.current = dots;
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const dots = dotsRef.current;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // update waves
      for (let i = wavesRef.current.length - 1; i >= 0; i--) {
        const w = wavesRef.current[i];
        w.r += 3; // slower growth
        w.life += 0.015;
        if (w.life > 1 || w.r > Math.max(rect.width, rect.height) * 1.5) wavesRef.current.splice(i, 1);
      }

      const pointer = pointerRef.current;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // spring back to base
        const k = 0.04; // softer spring
        const dx = d.bx - d.x;
        const dy = d.by - d.y;
        d.vx += dx * k;
        d.vy += dy * k;

        // pointer interaction (drag) — push away more gently
        if (pointer.active) {
          const gRect = canvas.getBoundingClientRect();
          const px = pointer.x - gRect.left;
          const py = pointer.y - gRect.top;
          const distX = d.x - px;
          const distY = d.y - py;
          const dist = Math.max(1, Math.hypot(distX, distY));
          const influence = Math.max(0, 1 - dist / 100); // smaller radius
          const force = 8 * influence; // much smaller force
          d.vx += (distX / dist) * force;
          d.vy += (distY / dist) * force;
        }

        // waves interaction
        for (let w of wavesRef.current) {
          const distX = d.x - w.x;
          const distY = d.y - w.y;
          const dist = Math.hypot(distX, distY);
          const diff = Math.abs(dist - w.r);
          if (diff < 24) {
            const push = (24 - diff) * 0.35; // lighter push
            d.vx += (distX / (dist || 1)) * push;
            d.vy += (distY / (dist || 1)) * push;
          }
        }

        // damping (higher -> less jumpy)
        d.vx *= 0.95;
        d.vy *= 0.95;

  d.x += d.vx;
  d.y += d.vy;

  // draw dot (use a much lighter alpha so the dotted background doesn't obscure content)
  const alpha = 0.12;
  ctx.fillStyle = `rgba(40,48,64,${alpha})`;
  ctx.beginPath();
  ctx.arc(d.x + 8, d.y + 8, 2.2, 0, Math.PI * 2);
  ctx.fill();
      }

      // optionally draw subtle waves
      for (let w of wavesRef.current) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(60,130,200,${1 - w.life})`;
        ctx.lineWidth = 1.2;
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [canvasRef.current]);

  return (
    // If game is active, show a fullscreen overlay so the game truly fills the viewport
    <div>
      {!gameActive && (
        <div className="secretary-job p-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center text-card-foreground">📧 Secretary Job</h1>
          <p className="text-lg mb-2 text-center">Score: {score} | Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
          <div className="text-center mt-6">
            <button onClick={startGame} className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">Start Day</button>
          </div>
        </div>
      )}

      {gameActive && (
        <div className="secretary-game-container w-full h-full min-h-0 flex-1 flex flex-col items-stretch justify-stretch" style={{ color: '#1f2937' }}>
          <div className="w-full h-full min-h-0 flex-1 flex flex-col items-stretch justify-stretch">
            <div className="bg-white w-full h-full min-h-0 flex-1 flex flex-col" style={{margin: 0, padding: 0}}>
              <div className="flex items-center justify-between py-4 px-8">
                <h2 className="text-xl font-bold" style={{ color: '#1f2937', position: 'relative', zIndex: 121 }}>📧 Secretary Job</h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm">Score: {score}</div>
                  <div className="text-sm">Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                </div>
              </div>

              <div className="text-center mb-3 w-full px-8">
                <p
                  className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200"
                  style={{ position: 'relative', zIndex: 120, color: '#1f2937' }}
                >
                  📧 <strong>How to play:</strong> Drag emails to the correct folders before they reach the right side!
                </p>
              </div>

              <div ref={gameAreaRef} className="flex flex-col flex-1 h-full justify-between px-8 pb-8 relative overflow-hidden">
                {/* canvas moved here so it covers the entire secretary window (emails + folders) */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full z-0"
                  style={{ pointerEvents: 'none', zIndex: 0 }}
                />

                {/* render emails as absolute children of the game area so they are clipped by overflow-hidden */}
                {emails.map(email => {
                  const isDragging = draggedEmail && draggedEmail.id === email.id;
                  const leftStyle = isDragging && dragPos ? `${dragPos.x}px` : `${email.position}%`;
                  const topStyle = isDragging && dragPos ? `${dragPos.y}px` : `${email.top}px`;
                  return (
                    <div
                      key={email.id}
                      onPointerDown={(e) => onEmailPointerDown(e, email)}
                      className={`email absolute bg-white border-2 p-4 rounded-lg shadow-lg cursor-grab transition-all duration-150 ${isDragging ? 'opacity-90 scale-105 shadow-2xl border-blue-500' : 'border-gray-400 hover:shadow-xl'}`}
                      style={{
                        left: leftStyle,
                        top: topStyle,
                        minWidth: '280px',
                        maxWidth: '350px',
                        transform: 'translate3d(0,0,0)',
                        transition: isDragging ? 'none' : 'left 0.1s linear, top 0.1s linear',
                        zIndex: isDragging ? 999 : 20,
                        position: 'absolute',
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-extrabold text-gray-600 bg-gray-100 px-2 py-1 rounded">📧 Email</span>
                        <span className="text-2xl text-gray-400 select-none" aria-hidden="true">⠿</span>
                      </div>
                      <p className="text-base font-medium leading-relaxed text-gray-800 mb-3" style={{ color: '#111827' }}>{email.content}</p>
                    </div>
                  );
                })}

                {/* Spacer element to make the game taller */}
                <div className="flex-1 min-h-[300px]"></div>

                <div className="folders flex flex-wrap justify-center gap-6 w-full pt-6 bg-transparent" style={{ position: 'relative', zIndex: 10 }}>
                  <div
                    data-category="Important"
                    className={`folder border-3 border-red-500 p-6 rounded-xl transition-all duration-200 min-h-40 min-w-56 flex flex-col items-center justify-center shadow-md hover:shadow-lg ${hoveredFolder === 'Important' ? 'bg-red-200 border-red-700 scale-105' : 'bg-red-50 hover:bg-red-100 hover:border-red-600'} ${shakingFolder === 'Important' ? 'shake' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); handleFolderEnter('Important'); }}
                    onDragEnter={() => handleFolderEnter('Important')}
                    onDragLeave={handleFolderLeave}
                    onMouseEnter={() => handleFolderEnter('Important')}
                    onMouseLeave={handleFolderLeave}
                  >
                    <h3 className="text-red-600 font-extrabold text-xl mb-2">📋 Important</h3>
                    <p className="text-sm text-gray-700 text-center font-medium">Urgent meetings, deadlines, CEO messages</p>
                  </div>

                  <div
                    data-category="Not Important"
                    className={`folder border-3 border-yellow-500 p-6 rounded-xl transition-all duration-200 min-h-40 min-w-56 flex flex-col items-center justify-center shadow-md hover:shadow-lg ${hoveredFolder === 'Not Important' ? 'bg-yellow-200 border-yellow-700 scale-105' : 'bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-600'} ${shakingFolder === 'Not Important' ? 'shake' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); handleFolderEnter('Not Important'); }}
                    onDragEnter={() => handleFolderEnter('Not Important')}
                    onDragLeave={handleFolderLeave}
                    onMouseEnter={() => handleFolderEnter('Not Important')}
                    onMouseLeave={handleFolderLeave}
                  >
                    <h3 className="text-yellow-600 font-extrabold text-xl mb-2">📄 Not Important</h3>
                    <p className="text-sm text-gray-700 text-center font-medium">Newsletters, updates, routine communications</p>
                  </div>

                  <div
                    data-category="Spam"
                    className={`folder border-3 border-gray-500 p-6 rounded-xl transition-all duration-200 min-h-40 min-w-56 flex flex-col items-center justify-center shadow-md hover:shadow-lg ${hoveredFolder === 'Spam' ? 'bg-gray-200 border-gray-700 scale-105' : 'bg-gray-50 hover:bg-gray-100 hover:border-gray-600'} ${shakingFolder === 'Spam' ? 'shake' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); handleFolderEnter('Spam'); }}
                    onDragEnter={() => handleFolderEnter('Spam')}
                    onDragLeave={handleFolderLeave}
                    onMouseEnter={() => handleFolderEnter('Spam')}
                    onMouseLeave={handleFolderLeave}
                  >
                    <h3 className="text-gray-600 font-extrabold text-xl mb-2">🗑️ Spam</h3>
                    <p className="text-sm text-gray-700 text-center font-medium">Advertisements, scams, unwanted messages</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretaryJob;
