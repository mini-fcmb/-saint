"use client";

import React from "react";
import "../index.css";

export default function Home() {
  return (
    <>
      <div className="school-cater-container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">❄️</span>
              <span className="logo-text">School Cater</span>
            </div>
            <nav className="nav">
              <a href="#" className="nav-link">
                HOME
              </a>
              <div className="nav-dropdown">
                <a href="#" className="nav-link dropdown-trigger">
                  PRODUCT <span className="dropdown-arrow">▼</span>
                </a>
              </div>
              <div className="nav-dropdown">
                <a href="#" className="nav-link dropdown-trigger">
                  AFFILIATE <span className="dropdown-arrow">▼</span>
                </a>
              </div>
              <a href="#" className="nav-link">
                RESULT CHECKER
              </a>
              <a href="#" className="nav-link">
                CONTACT
              </a>
            </nav>
            <div className="header-actions">
              <a href="#" className="sign-in">
                SIGN IN
              </a>
              <button className="try-free-btn">TRY IT FREE</button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                School management at
                <br />
                <span className="highlight">your fingertips</span>
              </h1>
              <p className="hero-description">
                School Cater puts enrollment, grading, billing and parent
                <br />
                communications on autopilot—so you spend less time on paperwork
                <br />
                and more time on teaching.
              </p>
              <button className="get-started-btn">GET STARTED ➜</button>
            </div>
            <div className="hero-image">
              <div className="image-placeholder">
                <div className="laptop-screen"></div>
                <div className="person-laptop"></div>
                <div className="hand-tablet"></div>
                <div className="books-stack"></div>
                <div className="plant-left"></div>
                <div className="plant-right"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="features-header">
            <span className="features-label">| FEATURES |</span>
            <h2 className="features-title">
              All-in-One Tools Built for Every Role in Your School
            </h2>
            <p className="features-subtitle">
              Whether you run the school, lead administrative teams or just want
              a better learning
              <br />
              experience, School Cater has you covered.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
