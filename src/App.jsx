import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios'

function App() {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState([])
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [suggestions, setSuggestions] = useState([]);
  const [mySquad, setMySquad] = useState([]);

  const handleMouseMove = (e) => {
    setMouse({ x: e.clientX, y: e.clientY })
  }

  // ⚽ Search Functionality
  const handleSearchWithName = async (playerName) => {
    if (!playerName) return;
    setLoading(true);
    setPlayers([]);
    setSuggestions([]);

    try {
      const response = await axios.get(`https://football-scout-backend-production.up.railway.app/api/v1/scout/${playerName}`);
      if (response.data.status === "success") {
        const pData = response.data.data;

        // 🛡️ Safe conversion - default to 0 if userCount is missing
        const uCount = Number(pData.userCount) || 0;

        // Rating Calculation logic
        let dynamicRating = 75 + Math.floor((uCount / 500000) * 24);

        // 🛡️ Error handling to prevent NaN values
        if (isNaN(dynamicRating)) {
          dynamicRating = 88; // Assign a default rating if an error occurs
        }

        // Clamp rating between 75 and 99
        if (dynamicRating > 99) dynamicRating = 99;
        if (dynamicRating < 75) dynamicRating = 75;

        const playerWithRating = {
          ...pData,
          rating: dynamicRating
        };

        setPlayers([playerWithRating]);
      } else {
        alert("Player not found!");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    handleSearchWithName(search);
  };

  // 📋 Search Suggestions Logic (Debounced)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (search.length > 2) {
        try {
          const res = await axios.get(`https://football-scout-backend-production.up.railway.app/api/v1/suggestions/${search}`);
          if (Array.isArray(res.data)) {
            const namesOnly = res.data.map(p => p.name);
            setSuggestions(namesOnly);
          }
        } catch (err) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 800);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // 🖱️ Logic to close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isSearchSection = event.target.closest('.search-section');
      if (!isSearchSection) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ⚡ Background Particle Effect
  useEffect(() => {
    const canvas = document.getElementById('particles')
    const ctx = canvas.getContext('2d')
    let animationFrameId;
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    handleResize();
    let particles = []
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 1
        this.speedX = Math.random() * 1 - 0.5
        this.speedY = Math.random() * 1 - 0.5
        this.opacity = Math.random() * 0.5 + 0.2
      }
      update() {
        this.x += this.speedX
        this.y += this.speedY
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1
      }
      draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill()
      }
    }
    for (let i = 0; i < 50; i++) particles.push(new Particle())
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const removeFromSquad = (playerName) => {
    const updatedSquad = mySquad.filter(player => player.name !== playerName);
    setMySquad(updatedSquad);
  };

  return (
    <div className="container" onMouseMove={handleMouseMove}>
      <canvas id="particles"></canvas>
      <div className="mouse-glow" style={{ left: mouse.x, top: mouse.y }}></div>

      <div className="card">
        <h1>⚽ Football Scout</h1>
        <p className="subtitle">Ultimate FIFA-style UI 😎</p>

        <div className="search-section">
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search player (e.g. Ronaldo)..."
            />
            {/* ❌ Clear Button - Only visible if the search input has text */}
            {search && (
              <button
                className="clear-search-btn"
                onClick={() => {
                  setSearch('');
                  setSuggestions([]);
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            {suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((name, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      setSearch(name);
                      handleSearchWithName(name);
                    }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSearch}>Search</button>
        </div>

        {loading && <div className="loader"></div>}

        <div className="players">
          {!loading && players.map((p, i) => (
            <div className="player-card" key={i}>
              <div className="player-rating">{p.rating}</div>
              <img src={p.image_url} alt={p.name} className="player-img"  referrerPolicy='no-referrer' />
              <div className="player-info">
                <h3>{p.name}</h3>
                <div className="team-row">
                  <img src={p.team_logo_url} alt={p.team_name} className="team-logo" referrerPolicy='no-referrer' />
                  <span>{p.team_name}</span>
                </div>
                <div className="stats">
                  <span className="badge">{p.position}</span>
                  <span className="jersey">#{p.jersey_number}</span>
                  <span className="country">| {p.country}</span>
                </div>

                <button
                  className="add-squad-btn"
                  onClick={() => {
                    // 🛡️ Duplicate Check: Ensure player isn't already in the squad
                    const isExist = mySquad.some(player => player.name === p.name);

                    if (isExist) {
                      alert("This player is already in your squad!");
                    } else {
                      // ⭐ Add player object containing the newly calculated rating
                      setMySquad([...mySquad, p]);
                    }
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>+</span>
                  Add to Squad
                </button>
              </div>
            </div>
          ))}
        </div>

        {mySquad.length > 0 && (
          <div className="squad-display">
            <h3>🛡️ My Squad ({mySquad.length})</h3>
            <div className="squad-grid">
              {mySquad.map((sp, idx) => (
                <div key={idx} className="squad-item">
                  {/* 🗑️ SVG Remove Icon */}
                  <button
                    className="remove-icon-btn"
                    onClick={() => removeFromSquad(sp.name)}
                    title="Remove Player"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                  <img src={sp.image_url} alt="" referrerPolicy='no-referrer'/>
                  <p>{sp.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🛡️ Squad Comparison Table Section */}
        {mySquad.length >= 2 && (
          <div className="comparison-section">
            <h3><span style={{ marginRight: '10px' }}>📊</span> Player Comparison</h3>
            <div className="table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Stat</th>
                    {mySquad.map((sp, idx) => (
                      <th key={idx}>
                        <img src={sp.image_url} alt="" className="table-img" referrerPolicy='no-referrer' />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{sp.name.split(' ')[0]}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Overall Rating</td>
                    {mySquad.map((sp, idx) => (
                      <td key={idx}>
                        <span className="player-rating-small" style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          color: '#000',
                          fontWeight: 'bold'
                        }}>
                          {sp.rating}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Team</td>
                    {mySquad.map((sp, idx) => <td key={idx}>{sp.team_name}</td>)}
                  </tr>
                  <tr>
                    <td>Position</td>
                    {mySquad.map((sp, idx) => <td key={idx}><span className="badge">{sp.position}</span></td>)}
                  </tr>
                  <tr>
                    <td>Jersey Number</td>
                    {mySquad.map((sp, idx) => <td key={idx} style={{ color: '#00ff88', fontWeight: 'bold' }}>#{sp.jersey_number}</td>)}
                  </tr>
                  <tr>
                    <td>Country</td>
                    {mySquad.map((sp, idx) => <td key={idx}>{sp.country}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App