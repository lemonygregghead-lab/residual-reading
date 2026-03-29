import React, { useEffect, useMemo, useState } from "react";

const PHRASES = [
  "sugar is not a vegetable",
  "out of kindness comes redness",
  "a blind agitation is manly and uttermost",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function splitWords(text) {
  return text.split(/(\s+)/).filter((w) => w.length > 0);
}

function isWord(token) {
  return /[A-Za-z]/.test(token);
}

function mutateTokens(tokens, intensity, phrase) {
  let result = [...tokens];
  const operations = Math.max(1, Math.floor(intensity * 4));

  for (let i = 0; i < operations; i++) {
    const wordIndexes = result
      .map((t, idx) => ({ t, idx }))
      .filter(({ t }) => isWord(t))
      .map(({ idx }) => idx);

    if (wordIndexes.length === 0) return result;

    const idx = pick(wordIndexes);
    const current = result[idx];
    const lower = current.toLowerCase().replace(/[^a-z]/g, "");

    const baseOps = ["repeat", "swap", "echo", "drift", "stutter"];
    const phraseOps = {
      "sugar is not a vegetable": ["swap", "drift", "echo", "repeat"],
      "out of kindness comes redness": ["repeat", "echo", "drift", "stutter"],
      "a blind agitation is manly and uttermost": [
        "stutter",
        "repeat",
        "swap",
        "drift",
      ],
    };

    const op = Math.random() < 0.65 ? pick(phraseOps[phrase]) : pick(baseOps);

    if (phrase === "sugar is not a vegetable" && lower === "not") {
      if (Math.random() < 0.5 && result.length > 3) {
        result.splice(idx, 1);
      } else {
        result.splice(idx, 0, "not");
      }
      continue;
    }

    if (phrase === "out of kindness comes redness" && lower === "redness") {
      result.splice(idx + 1, 0, pick(["red", "red", "stain", "flush"]));
      continue;
    }

    if (
      phrase === "a blind agitation is manly and uttermost" &&
      lower === "agitation"
    ) {
      result[idx] = pick([
        "agi-agitation",
        "agitation",
        "agitation agitation",
        "agitated motion",
      ]);
      continue;
    }

    if (op === "repeat") {
      result.splice(idx, 0, result[idx]);
    }

    if (op === "swap" && wordIndexes.length > 1) {
      const idx2 = pick(wordIndexes.filter((n) => n !== idx));
      [result[idx], result[idx2]] = [result[idx2], result[idx]];
    }

    if (op === "echo") {
      const echoes = [",", " again", " still", " perhaps"];
      result.splice(idx + 1, 0, pick(echoes));
    }

    if (op === "stutter") {
      const clean = current.replace(/[^A-Za-z]/g, "");
      if (clean.length > 2) {
        const fragment = clean.slice(0, Math.min(3, clean.length));
        result[idx] = `${fragment}-${fragment.toLowerCase()}-${current}`;
      }
    }

    if (op === "drift") {
      const drifts = {
        sugar: ["sweet", "grain", "white", "crystal"],
        vegetable: ["object", "thing", "food", "matter"],
        kindness: ["kind", "care", "gesture", "softness"],
        redness: ["red", "stain", "flush", "mark"],
        blind: ["blurred", "veiled", "shut", "sightless"],
        agitation: ["motion", "shake", "stir", "force"],
        manly: ["human", "bodily", "forceful", "strained"],
        uttermost: ["extreme", "edge", "limit", "excess"],
      };

      if (drifts[lower]) {
        result[idx] = pick(drifts[lower]);
      }
    }
  }

  return result;
}

export default function App() {
  const [activePhrase, setActivePhrase] = useState(PHRASES[0]);
  const [sourceText, setSourceText] = useState(PHRASES[0]);
  const [tokens, setTokens] = useState(splitWords(PHRASES[0]));
  const [history, setHistory] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [intensity, setIntensity] = useState(35);
  const [speed, setSpeed] = useState(1800);
  const [mode, setMode] = useState("linger");
  const [showGhost, setShowGhost] = useState(true);

  const instability = useMemo(() => {
    if (mode === "linger") return (intensity / 100) * 0.7;
    if (mode === "press") return (intensity / 100) * 1.1;
    return (intensity / 100) * 1.5;
  }, [intensity, mode]);

  const phraseTheme = useMemo(() => {
    if (activePhrase === "sugar is not a vegetable") {
      return {
        page: "#f5f2eb",
        panel: "#fffdf8",
        border: "#d8cfbe",
        text: "#4e473d",
        faint: "#d9d1c6",
      };
    }
    if (activePhrase === "out of kindness comes redness") {
      return {
        page: "#fff1f3",
        panel: "#fffafb",
        border: "#efc7cf",
        text: "#7c2436",
        faint: "#f3ccd4",
      };
    }
    return {
      page: "#eef2f5",
      panel: "#fbfcfd",
      border: "#c7d0d8",
      text: "#22303a",
      faint: "#d3dae0",
    };
  }, [activePhrase]);

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setTokens((prev) => {
        const next = mutateTokens(prev, instability, activePhrase);
        const joined = next.join("");
        setHistory((h) => [joined, ...h].slice(0, 7));
        return next;
      });
    }, speed);

    return () => clearInterval(id);
  }, [isRunning, speed, instability, activePhrase]);

  useEffect(() => {
    setTokens(splitWords(sourceText));
    setHistory([]);
  }, [sourceText]);

  function choosePhrase(phrase) {
    setActivePhrase(phrase);
    setSourceText(phrase);
    setTokens(splitWords(phrase));
    setHistory([]);
    setIsRunning(false);
  }

  function resetAll() {
    setTokens(splitWords(sourceText));
    setHistory([]);
    setIsRunning(false);
  }

  function handleTokenClick(token, index) {
    setTokens((prev) => {
      const next = [...prev];

      if (activePhrase === "sugar is not a vegetable") {
        if (index < next.length - 1) {
          [next[index], next[index + 1]] = [next[index + 1], next[index]];
        }
      }

      if (activePhrase === "out of kindness comes redness") {
        next.splice(index, 0, token);

        if (Math.random() < 0.8) {
          next.splice(index + 1, 0, pick(["red", "stain", "flush"]));
        }

        if (index > 0 && Math.random() < 0.35) {
          const leftWord = next[index - 1];
          if (/[A-Za-z]/.test(leftWord)) {
            next[index - 1] = pick(["warm", "red", leftWord]);
          }
        }

        if (index + 2 < next.length && Math.random() < 0.35) {
          const rightWord = next[index + 2];
          if (/[A-Za-z]/.test(rightWord)) {
            next[index + 2] = pick(["stained", "flushed", rightWord]);
          }
        }
      }

      if (activePhrase === "a blind agitation is manly and uttermost") {
        const clean = token.replace(/[^A-Za-z]/g, "");
        if (clean.length > 2) {
          const fragment = clean.slice(0, 3);
          next[index] = `${fragment}-${fragment}-${token}`;
        }
      }

      const joined = next.join("");
      setHistory((h) => [joined, ...h].slice(0, 7));
      return next;
    });
  }

  function handleTokenHover(index) {
    if (activePhrase !== "sugar is not a vegetable") return;

    setTokens((prev) => {
      const next = [...prev];
      if (next[index] === "not" && Math.random() < 0.5) {
        next.splice(index, 1);
      }
      return next;
    });
  }

  function tokenStyle(token, i) {
    const lower = token.toLowerCase();

    let style = {
      display: "inline-block",
      cursor: "pointer",
      margin: "0",
      transition: "all 0.3s ease",
      color: phraseTheme.text,
      opacity: Math.max(
        0.4,
        1 -
          (Math.abs(i - tokens.length / 2) / Math.max(1, tokens.length / 2)) *
            instability *
            0.5,
      ),
      transform: "none",
      filter: "none",
      letterSpacing: "0em",
    };

    if (activePhrase === "sugar is not a vegetable") {
      style.transform = `translateX(${
        (i % 2 === 0 ? -1 : 1) * instability * 4
      }px)`;
      style.letterSpacing = `${instability * 0.03}em`;
    }

    if (activePhrase === "out of kindness comes redness") {
      const redIndex = tokens.findIndex((t) => /red|stain|flush|mark/i.test(t));
      const kindnessIndex = tokens.findIndex((t) =>
        /kind|care|gesture|softness/i.test(t),
      );

      if (/red|kind/i.test(lower)) {
        style.transform = `scale(${1 + instability * 0.08})`;
      }

      if (redIndex !== -1) {
        const distanceFromRed = Math.abs(i - redIndex);

        if (distanceFromRed === 1) {
          style.filter = `blur(${instability * 0.45}px)`;
          style.opacity = Math.max(0.5, style.opacity - 0.08);
        } else if (distanceFromRed === 2) {
          style.filter = `blur(${instability * 0.25}px)`;
          style.opacity = Math.max(0.55, style.opacity - 0.04);
        } else {
          style.filter = `blur(${instability * 0.3}px)`;
        }
      } else {
        style.filter = `blur(${instability * 0.3}px)`;
      }

      if (kindnessIndex !== -1) {
        const distanceFromKindness = Math.abs(i - kindnessIndex);
        if (
          distanceFromKindness <= 1 &&
          !/kind|care|gesture|softness/i.test(lower)
        ) {
          style.transform = `scale(${1 + instability * 0.03})`;
        }
      }
    }

    if (activePhrase === "a blind agitation is manly and uttermost") {
      style.transform = `translateY(${
        (i % 3 === 0 ? -1 : 1) * instability * 6
      }px)`;
      style.filter = `blur(${instability * 1.2}px)`;
      style.letterSpacing = `${instability * 0.08}em`;
    }

    if (
      mode === "scatter" &&
      activePhrase !== "a blind agitation is manly and uttermost"
    ) {
      style.filter = `blur(${instability * 0.7}px)`;
    }

    return style;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: phraseTheme.page,
        padding: "32px",
        fontFamily: "Georgia, serif",
        color: phraseTheme.text,
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            background: phraseTheme.panel,
            border: `1px solid ${phraseTheme.border}`,
            borderRadius: "18px",
            padding: "24px",
            marginBottom: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: "2rem" }}>
            Residual Reading: Tender Buttons Under Pressure
          </h1>
          <p style={{ lineHeight: 1.6, maxWidth: "800px" }}>
            A Stein-inspired reading environment where each phrase develops its
            own pressure system, visual field, and mode of instability.
          </p>
          <div
            style={{
              maxWidth: "800px",
              marginTop: "14px",
              lineHeight: 1.6,
              fontSize: "0.95rem",
              opacity: 0.9,
            }}
          >
            <strong>About this project</strong>
            <p style={{ marginTop: "8px" }}>
              This is a reading environment for Tender Buttons in which
              attention acts on the text.
            </p>
            <p>
              Each phrase, taken from Tender Buttons, invites a different kind
              of engagement—hovering, pressing, lingering—through which words
              shift, repeat, and spread. What emerges are not interpretations
              but changing textual states, influenced by contact.
            </p>
            <p>
              The archive of “residues” records these encounters. It does not
              preserve an original version but instead traces what reading does
              over time.
            </p>
            <p>
              The project treats attention as active, embodied, and generative.
              Meaning accumulates, disperses, and returns. Try interacting with
              each phrase differently and notice how the text—and your
              reading—changes.
            </p>
          </div>
          <p style={{ fontStyle: "italic", marginTop: "10px" }}>
            {activePhrase === "sugar is not a vegetable" &&
              "hover to unsettle classification"}
            {activePhrase === "out of kindness comes redness" &&
              "click to let redness spread"}
            {activePhrase === "a blind agitation is manly and uttermost" &&
              "click to intensify agitation"}
          </p>

          <div style={{ marginTop: "20px" }}>
            <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
              Choose a phrase
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => choosePhrase(phrase)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "14px",
                    border: `1px solid ${phraseTheme.border}`,
                    background:
                      activePhrase === phrase ? phraseTheme.border : "white",
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              Phrase under pressure
            </div>
            <input
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: `1px solid ${phraseTheme.border}`,
                fontSize: "1rem",
                fontFamily: "Georgia, serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "20px",
              alignItems: "center",
            }}
          >
            <button onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? "Pause drift" : "Start drift"}
            </button>
            <button
              onClick={() => {
                setTokens((prev) => {
                  const next = mutateTokens(prev, instability, activePhrase);
                  setHistory((h) => [next.join(""), ...h].slice(0, 7));
                  return next;
                });
              }}
            >
              Interrupt
            </button>
            <button onClick={resetAll}>Return (temporarily)</button>
            <button onClick={() => setShowGhost(!showGhost)}>
              {showGhost ? "Hide original" : "Show original"}
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <div style={{ marginBottom: "6px" }}>
              Mode of attention: <strong>{mode}</strong>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["linger", "press", "scatter"].map((m) => (
                <button key={m} onClick={() => setMode(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <label>
              Intensity: {intensity}
              <br />
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <div style={{ marginTop: "12px" }}>
            <label>
              Drift speed: {speed} ms
              <br />
              <input
                type="range"
                min="400"
                max="3000"
                step="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "20px",
          }}
        >
          <div
            style={{
              position: "relative",
              minHeight: "340px",
              background: phraseTheme.panel,
              border: `1px solid ${phraseTheme.border}`,
              borderRadius: "18px",
              padding: "28px",
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            {showGhost && (
              <div
                style={{
                  position: "absolute",
                  inset: "28px",
                  color: phraseTheme.faint,
                  fontSize: "2rem",
                  lineHeight: 1.6,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {sourceText}
              </div>
            )}

            <div
              style={{
                position: "relative",
                fontSize: "2rem",
                lineHeight: 1.6,
                zIndex: 2,
              }}
            >
              {tokens.map((token, i) => (
                <span
                  key={`${token}-${i}`}
                  style={tokenStyle(token, i)}
                  onClick={() => handleTokenClick(token, i)}
                  onMouseEnter={() => handleTokenHover(i)}
                >
                  {token}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              background: phraseTheme.panel,
              border: `1px solid ${phraseTheme.border}`,
              borderRadius: "18px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                transition: "all 0.3s ease",
                color:
                  activePhrase === "out of kindness comes redness"
                    ? "#7c2436"
                    : activePhrase ===
                        "a blind agitation is manly and uttermost"
                      ? "#22303a"
                      : phraseTheme.text,
                letterSpacing:
                  activePhrase === "a blind agitation is manly and uttermost"
                    ? "0.05em"
                    : activePhrase === "sugar is not a vegetable"
                      ? "0.02em"
                      : "0em",
                opacity: activePhrase === "sugar is not a vegetable" ? 0.85 : 1,
              }}
            >
              Residues:{" "}
              {activePhrase === "sugar is not a vegetable"
                ? "Traces of failed classification"
                : activePhrase === "out of kindness comes redness"
                  ? "Stained traces"
                  : "Agitated traces"}
            </h2>

            {history.length === 0 ? (
              <p>No traces yet.</p>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    border: `1px solid ${phraseTheme.border}`,
                    borderRadius: "12px",
                    padding: "10px",
                    marginBottom: "10px",
                    background:
                      activePhrase === "sugar is not a vegetable"
                        ? /not|vegetable|object|thing|food|matter/i.test(item)
                          ? `rgba(215, 205, 185, ${Math.max(
                              0.1,
                              0.2 - idx * 0.02,
                            )})`
                          : `rgba(245, 241, 232, ${Math.max(
                              0.06,
                              0.12 - idx * 0.015,
                            )})`
                        : activePhrase === "out of kindness comes redness"
                          ? /red|stain|flush|mark/i.test(item)
                            ? `rgba(180, 40, 60, ${Math.max(
                                0.1,
                                0.22 - idx * 0.02,
                              )})`
                            : `rgba(220, 120, 140, ${Math.max(
                                0.06,
                                0.14 - idx * 0.015,
                              )})`
                          : activePhrase ===
                              "a blind agitation is manly and uttermost"
                            ? /blind|agitation|motion|shake|force|uttermost|extreme|edge|limit|excess/i.test(
                                item,
                              )
                              ? `rgba(70, 85, 100, ${Math.max(
                                  0.1,
                                  0.2 - idx * 0.02,
                                )})`
                              : `rgba(210, 218, 226, ${Math.max(
                                  0.06,
                                  0.12 - idx * 0.015,
                                )})`
                            : "rgba(255,255,255,0.65)",
                    opacity:
                      activePhrase ===
                      "a blind agitation is manly and uttermost"
                        ? Math.max(0.28, 1 - idx * 0.15)
                        : Math.max(0.35, 1 - idx * 0.12),
                    lineHeight: 1.5,
                    transition:
                      "background 0.3s ease, opacity 0.3s ease, transform 0.3s ease",
                    transform:
                      activePhrase ===
                      "a blind agitation is manly and uttermost"
                        ? `translateX(${idx % 2 === 0 ? "-1px" : "1px"})`
                        : "none",
                    letterSpacing:
                      activePhrase ===
                      "a blind agitation is manly and uttermost"
                        ? "0.02em"
                        : activePhrase === "sugar is not a vegetable"
                          ? "0.01em"
                          : "0em",
                    color:
                      activePhrase === "out of kindness comes redness" &&
                      /red|stain|flush|mark/i.test(item)
                        ? "#6f1d2a"
                        : activePhrase ===
                              "a blind agitation is manly and uttermost" &&
                            /blind|agitation|motion|shake|force|uttermost|extreme|edge|limit|excess/i.test(
                              item,
                            )
                          ? "#1f2a33"
                          : phraseTheme.text,
                  }}
                >
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
