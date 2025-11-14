import React, { useState, useEffect } from "react";
import "../index.css";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const images = {
  hero: "https://picsum.photos/seed/sxaint-hero/1200/600",
  proctoring: "https://picsum.photos/seed/sxaint-proctor/800/500",
  grading: "https://picsum.photos/seed/sxaint-grade/800/500",
  questionBank: "https://picsum.photos/seed/sxaint-bank/800/500",
  mobileTest: "https://picsum.photos/seed/sxaint-mobile/800/500",
  analytics: "https://picsum.photos/seed/sxaint-analytics/800/500",
};

const directions = [
  "top",
  "left",
  "bottom",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const GetStartedDashboard: React.FC = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [progress, setProgress] = useState(0);

  const scenes = [
    {
      id: 0,
      title: "Welcome to SXaint",
      subtitle: "The future of secure testing.",
      image: images.hero,
      description:
        "Empower educators with AI proctoring, instant analytics, and mobile exams. Trusted by 50,000+ institutions worldwide.",
    },
    {
      id: 1,
      title: "Create Exams in Minutes",
      subtitle: "No coding. Just results.",
      image: images.questionBank,
      description:
        "50,000+ questions. Drag & drop. MCQ, essay, math, multimedia. Real-time preview. Launch in under 5 minutes.",
    },
    {
      id: 2,
      title: "AI-Powered Proctoring",
      subtitle: "Catch cheating instantly.",
      image: images.proctoring,
      description:
        "Webcam + eye tracking. Tab switch alerts. Full session recording. GDPR & FERPA compliant. Exportable reports.",
    },
    {
      id: 3,
      title: "Instant Grading & Insights",
      subtitle: "Results in seconds.",
      image: images.grading,
      description:
        "Auto-grade MCQs. AI essay scoring. Interactive dashboards. Track trends. Identify weak topics.",
    },
    {
      id: 4,
      title: "Test Anywhere",
      subtitle: "Mobile, tablet, desktop.",
      image: images.mobileTest,
      description:
        "Offline mode. Auto-sync. Push alerts. Low-data mode. Start, pause, resume anytime.",
    },
    {
      id: 5,
      title: "Scale Without Limits",
      subtitle: "From 10 to 100,000+ users.",
      image: images.analytics,
      description:
        "LMS integration. White-label. 99.99% uptime. Admin, teacher, proctor roles.",
    },
  ];

  const getRandomDirection = () =>
    directions[Math.floor(Math.random() * directions.length)];

  useEffect(() => {
    const duration = currentScene === scenes.length - 1 ? 8000 : 4000; // CTA stays longer
    const timer = setTimeout(() => {
      const next = (currentScene + 1) % scenes.length;
      setCurrentScene(next);
      setProgress(((next + 1) / scenes.length) * 100);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentScene]);

  const progressDots = scenes.map((_, i) => (
    <div key={i} className={`dot ${i === currentScene ? "active" : ""}`} />
  ));

  return (
    <div className="dashboard-container">
      {/* Fixed Header */}
      <header className="fixed-header">
        <div className="header-content">
          <div className="logo-section">
            {/* ← DROP YOUR LOGO HERE */}
            <div className="logo-placeholder">
              <img
                src={logo}
                style={{
                  width: "36px",
                  height: "36px",
                  objectFit: "contain",
                  borderRadius: "50%",
                  display: "block",
                }}
              />
            </div>
            <h1 className="site-name">SXaint</h1>
          </div>
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-dots">{progressDots}</div>
            <button className="restart-btn">
              {" "}
              <Link to={"/login"}>Login</Link>{" "}
            </button>
            <button className="getstarted-btn">
              <Link to={"/signup"}> Get Started</Link>
            </button>
          </div>
        </div>
      </header>

      {/* Main Animated Content */}
      <main className="main-content">
        <div className="scene-wrapper">
          {scenes.map((scene, index) => {
            const direction = getRandomDirection();
            const isActive = index === currentScene;

            return (
              <section
                key={scene.id}
                className={`scene ${isActive ? "active" : ""}`}
                data-direction={direction}
              >
                <div className="scene-container">
                  <div className="scene-inner">
                    <div className="scene-image">
                      <img src={scene.image} alt={scene.title} />
                    </div>
                    <div className="scene-text">
                      <h2 className="scene-title">{scene.title}</h2>
                      <p className="scene-subtitle">{scene.subtitle}</p>
                      <div className="scene-description">
                        {scene.description.split(" ").map((word, i) => (
                          <span key={i} className="word">
                            {word}{" "}
                          </span>
                        ))}
                      </div>
                      <ul className="feature-bullets">
                        <li>Lightning-fast setup</li>
                        <li>Secure & compliant</li>
                        <li>24/7 support</li>
                        <li>Free trial</li>
                      </ul>
                    </div>
                  </div>
                  {index === scenes.length - 1 && (
                    <div className="cta-section">
                      <button className="cta-btn">
                        {/*<Link to="/signup"> Get Started Now</Link>*/}
                      </button>
                      <p className="cta-subtext">
                        Join 50,000+ users transforming education
                      </p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <footer className="footer">
        <p>
          © 2025 SXaint. All rights reserved. | <a href="#">Privacy</a> |{" "}
          <a href="#">Terms</a>
        </p>
      </footer>
    </div>
  );
};

export default GetStartedDashboard;
