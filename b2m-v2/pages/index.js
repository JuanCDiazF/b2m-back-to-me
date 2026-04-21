import { useState, useEffect } from "react";

// Star field data
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  top: ((Math.sin(i * 127.1) + 1) / 2) * 100,
  left: ((Math.cos(i * 97.3) + 1) / 2) * 100,
  size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1,
  st: `${2.5 + (i % 6)}s`,
  sd: `${(i * 0.29) % 8}s`,
  so: 0.3 + (i % 5) * 0.14,
}));

function StarField() {
  return (
    <div className="star-field">
      {STARS.map(s => (
        <div key={s.id} className="star" style={{
          top: `${s.top}%`, left: `${s.left}%`,
          width: s.size, height: s.size,
          "--st": s.st, "--sd": s.sd, "--so": s.so,
        }} />
      ))}
      <div className="orb" style={{
        width: 320, height: 320, background: "#C9A96E",
        top: -120, left: -100, opacity: .09,
        "--ot": "15s", "--ox": "30px", "--oy": "25px"
      }} />
      <div className="orb" style={{
        width: 240, height: 240, background: "#6B4E9E",
        bottom: 80, right: -80, opacity: .08,
        "--ot": "11s", "--ox": "-25px", "--oy": "-30px"
      }} />
    </div>
  );
}

// Helpers
function getDays(dob) {
  return Math.floor((Date.now() - new Date(dob + "T12:00:00").getTime()) / 86400000);
}
function getAge(dob) {
  const b = new Date(dob + "T12:00:00"), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
  return a;
}
function fmtDate(dob) {
  return new Date(dob + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

const CHAPTERS = [
  { num: "I",   name: "The Day You Arrived",     desc: "World context · Your origin", active: true  },
  { num: "II",  name: "The Era That Shaped You",  desc: "Generational identity · Why you are how you are", locked: true },
  { num: "III", name: "Your Footprint",           desc: "What changed while you were here", locked: true },
  { num: "IV",  name: "Your Future Self",         desc: "Probabilistic simulation · Next chapter", locked: true },
  { num: "V",   name: "Your Letter to the World", desc: "The most personal thing you'll ever read", locked: true },
];

export default function B2M() {
  const [screen, setScreen] = useState("welcome");
  const [dob, setDob] = useState("");
  const [err, setErr] = useState("");

  // Progressive layer state
  const [currentLayer, setCurrentLayer] = useState(0);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generation, setGeneration] = useState("");

  // User context — accumulates with each answer
  const [city, setCity] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [motherAge, setMotherAge] = useState("");
  const [fatherAge, setFatherAge] = useState("");
  const [noParents, setNoParents] = useState(false);
  const [openQuestion, setOpenQuestion] = useState("");
  const [openInput, setOpenInput] = useState("");

  const today = new Date().toISOString().split("T")[0];

  async function fetchLayer(layerNum, extraContext = {}) {
    setLoading(true);
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dob,
          city: extraContext.city || city,
          timeOfDay: extraContext.timeOfDay || timeOfDay,
          motherAge: extraContext.motherAge || motherAge,
          fatherAge: extraContext.fatherAge || fatherAge,
          noParents: extraContext.noParents || noParents,
          openQuestion: extraContext.openQuestion || openQuestion,
          layer: layerNum,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error");
      setLayers(prev => [...prev, { num: layerNum, text: data.story }]);
      if (data.generation) setGeneration(data.generation);
      setCurrentLayer(layerNum);
    } catch (e) {
      setErr("Could not load this part of your story. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startStory() {
    if (!dob) { setErr("Please enter your date of birth."); return; }
    setErr("");
    setScreen("story");
    setLayers([]);
    setCurrentLayer(0);
    fetchLayer(1);
  }

  function answerCity() {
    const c = cityInput.trim() || "unknown";
    setCity(c);
    fetchLayer(2, { city: c });
  }

  function answerTime(t) {
    setTimeOfDay(t);
    fetchLayer(3, { timeOfDay: t });
  }

  function answerParents(noP) {
    setNoParents(noP);
    fetchLayer(4, { noParents: noP, motherAge, fatherAge });
  }

  function answerQuestion() {
    if (!openInput.trim()) return;
    setOpenQuestion(openInput);
    fetchLayer(5, { openQuestion: openInput });
  }

  const days = dob ? getDays(dob) : 0;
  const age  = dob ? getAge(dob)  : 0;
  const fdate = dob ? fmtDate(dob) : "";

  const layerMap = {};
  layers.forEach(l => { layerMap[l.num] = l.text; });

  return (
    <>
      <StarField />

      {screen !== "welcome" && (
        <button className="back-btn" onClick={() => {
          setScreen("welcome"); setLayers([]); setErr("");
          setCurrentLayer(0); setCity(""); setTimeOfDay("");
          setMotherAge(""); setFatherAge(""); setNoParents(false);
          setOpenQuestion(""); setOpenInput(""); setCityInput("");
        }}>← BACK</button>
      )}

      {/* ══ WELCOME ══ */}
      {screen === "welcome" && (
        <div className="page fade-in">
          <div className="logo">B2M · BACK TO ME</div>
          <p className="eyebrow">YOUR STORY IN THE WORLD</p>
          <h1 className="headline">
            Do you want to see your<br /><em>story</em> in the world?
          </h1>
          <p className="subtext">
            Every life has a timeline the world remembers. Yours is no exception.
          </p>
          <button className="btn-outline" onClick={() => setScreen("input")}>
            <span>BEGIN YOUR STORY</span>
          </button>
        </div>
      )}

      {/* ══ INPUT ══ */}
      {screen === "input" && (
        <div className="page">
          <div className="logo rise d1">B2M · BACK TO ME</div>
          <p className="eyebrow rise d1">CHAPTER I · YOUR ORIGIN</p>
          <h2 className="headline rise d2">When did your<br />story begin?</h2>
          <p className="subtext rise d2">The exact moment the world made room for you.</p>
          <div className="input-wrap rise d3">
            <label className="input-label">DATE OF BIRTH</label>
            <input type="date" className="input-field" value={dob} max={today}
              onChange={e => { setDob(e.target.value); setErr(""); }} />
          </div>
          {err && <p className="err">{err}</p>}
          <button className="btn-outline rise d4" onClick={startStory} style={{ marginTop: 8 }}>
            <span>RECONSTRUCT MY TIMELINE</span>
          </button>
        </div>
      )}

      {/* ══ STORY ══ */}
      {screen === "story" && (
        <div className="fade-in" style={{ paddingBottom: 60 }}>

          {/* Chapter progress */}
          <div className="chapter-bar">
            <span className="chapter-label">CHAPTER I · THE DAY YOU ARRIVED</span>
            <div className="chapter-dots">
              {[1,2,3,4,5].map(n => (
                <div key={n} className={`cdot ${n === currentLayer ? "active" : n < currentLayer ? "done" : ""}`} />
              ))}
            </div>
          </div>

          {/* Hero */}
          <div className="story-hero">
            <div className="hero-glow" />
            <p className="hero-tag">B2M · BACK TO ME · {fdate.toUpperCase()}</p>
            <h1 className="hero-title">Your day,<br />in the world.</h1>
            <p className="hero-sub">A story {age} years in the making</p>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat">
              <span className="stat-n">{days.toLocaleString()}</span>
              <span className="stat-l">DAYS LIVED</span>
            </div>
            <div className="stat">
              <span className="stat-n">{age}</span>
              <span className="stat-l">YEARS</span>
            </div>
            <div className="stat">
              <span className="stat-n" style={{ fontSize: "clamp(13px,3.5vw,17px)", paddingTop: 6 }}>
                {generation || "—"}
              </span>
              <span className="stat-l">YOUR ERA</span>
            </div>
          </div>

          {/* LAYER 1 — World that day */}
          {layerMap[1] && (
            <div className="layer-wrap fade-in">
              <p className="layer-tag">THE WORLD THAT DAY</p>
              <p className="narrative">{layerMap[1]}</p>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div style={{ padding: "48px 28px", textAlign: "center" }}>
              <div className="orbit-ring" style={{ margin: "0 auto 20px" }} />
              <p className="load-sub">RECONSTRUCTING…</p>
            </div>
          )}

          {/* Q1 — City */}
          {layerMap[1] && !layerMap[2] && !loading && (
            <div className="question-wrap fade-in">
              <p className="question-text">Do you know which city you were born in?</p>
              <div className="input-wrap" style={{ margin: "0 auto 20px" }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="City, Country"
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  style={{ fontSize: 18 }}
                />
              </div>
              <button className="btn-gold" onClick={answerCity} style={{ marginBottom: 12 }}>
                CONTINUE MY STORY
              </button>
              <br />
              <button className="btn-ghost" onClick={() => { setCityInput(""); answerCity(); }}>
                I don't know
              </button>
            </div>
          )}

          {/* LAYER 2 — Your place */}
          {layerMap[2] && (
            <div className="layer-wrap fade-in">
              <p className="layer-tag">YOUR PLACE IN TIME</p>
              <p className="narrative">{layerMap[2]}</p>
            </div>
          )}

          {/* Q2 — Time of day */}
          {layerMap[2] && !layerMap[3] && !loading && (
            <div className="question-wrap fade-in">
              <p className="question-text">Do you know what time of day you arrived?</p>
              <div className="option-grid">
                {["Morning", "Afternoon", "Evening", "Night"].map(t => (
                  <button key={t} className="option-btn" onClick={() => answerTime(t.toLowerCase())}>{t}</button>
                ))}
                <button className="option-btn full" onClick={() => answerTime("unknown")}>I don't know</button>
              </div>
            </div>
          )}

          {/* LAYER 3 — The moment */}
          {layerMap[3] && (
            <div className="layer-wrap fade-in">
              <p className="layer-tag">THE MOMENT</p>
              <p className="narrative">{layerMap[3]}</p>
            </div>
          )}

          {/* Q3 — Parents */}
          {layerMap[3] && !layerMap[4] && !loading && (
            <div className="question-wrap fade-in">
              <p className="question-text">Do you know how old your parents were when you arrived?</p>
              <div style={{ display: "flex", gap: 12, marginBottom: 20, maxWidth: 320, margin: "0 auto 20px" }}>
                <div className="input-wrap" style={{ marginBottom: 0 }}>
                  <label className="input-label">MOTHER</label>
                  <input type="number" className="input-field" placeholder="Age"
                    value={motherAge} onChange={e => setMotherAge(e.target.value)}
                    style={{ fontSize: 18 }} min="10" max="80" />
                </div>
                <div className="input-wrap" style={{ marginBottom: 0 }}>
                  <label className="input-label">FATHER</label>
                  <input type="number" className="input-field" placeholder="Age"
                    value={fatherAge} onChange={e => setFatherAge(e.target.value)}
                    style={{ fontSize: 18 }} min="10" max="80" />
                </div>
              </div>
              <button className="btn-gold" onClick={() => answerParents(false)} style={{ marginBottom: 12 }}>
                CONTINUE MY STORY
              </button>
              <br />
              <button className="btn-ghost" onClick={() => answerParents(true)}>
                I didn't know them
              </button>
            </div>
          )}

          {/* LAYER 4 — Origins */}
          {layerMap[4] && (
            <div className="layer-wrap fade-in">
              <p className="layer-tag">YOUR ORIGINS</p>
              <p className="narrative">{layerMap[4]}</p>
            </div>
          )}

          {/* Q4 — Open question */}
          {layerMap[4] && !layerMap[5] && !loading && (
            <div className="question-wrap fade-in">
              <p className="question-text">
                Is there something you always wanted to know about the day you arrived?
              </p>
              <div className="input-wrap" style={{ margin: "0 auto 20px" }}>
                <textarea
                  className="input-field"
                  placeholder="Ask anything…"
                  value={openInput}
                  onChange={e => setOpenInput(e.target.value)}
                  rows={3}
                  style={{ fontSize: 16, resize: "none", textAlign: "left", padding: "14px 16px" }}
                />
              </div>
              <button className="btn-gold" onClick={answerQuestion}>
                ASK EL CRONISTA
              </button>
            </div>
          )}

          {/* LAYER 5 — Personal answer */}
          {layerMap[5] && (
            <div className="layer-wrap fade-in">
              <p className="layer-tag">YOUR ANSWER</p>
              <p className="narrative">{layerMap[5]}</p>
            </div>
          )}

          {/* FREEMIUM GATE — only after layer 4 or 5 */}
          {(layerMap[4] || layerMap[5]) && !loading && (
            <div className="gate fade-in">
              <p className="gate-headline">
                "There is more of that day<br />we have reconstructed…"
              </p>
              <p className="gate-body">
                Chapter II is waiting. The era that shaped you, why you are the way you are, and where your story leads next.
              </p>
              <button className="btn-gold">CONTINUE MY STORY</button>
              <p className="gate-price">$9.99 / month · Cancel anytime</p>
            </div>
          )}

          {/* Chapters map */}
          {layerMap[1] && (
            <div className="chapters-wrap">
              <p className="chapters-title">YOUR STORY · ALL CHAPTERS</p>
              {CHAPTERS.map((c, i) => (
                <div key={i} className={`chapter-card ${c.active ? "active" : ""} ${c.locked ? "locked" : ""}`}>
                  <span className="ch-num">{c.num}</span>
                  <div className="ch-info">
                    <p className="ch-name">{c.name}</p>
                    <p className="ch-desc">{c.desc}</p>
                  </div>
                  {c.locked && <span className="ch-lock">◈</span>}
                </div>
              ))}
            </div>
          )}

          {/* Share */}
          {layerMap[1] && (
            <div className="share-wrap">
              <div className="share-card">
                <p className="share-logo">B2M · BACK TO ME</p>
                <p className="share-text">
                  "I've lived {days.toLocaleString()} days.<br />
                  I arrived as a {generation}.<br />
                  The world has never been the same."
                </p>
              </div>
              <button className="btn-ghost">SHARE MY TIMELINE</button>
            </div>
          )}

        </div>
      )}
    </>
  );
}
