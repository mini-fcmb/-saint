"use client";

import React from "react";
import "../styles/signin.css";

export default function SignIn() {
  return (
    <div className="signin-container">
      {/* Background Decorative Shapes */}
      <div className="bg-shape bg-shape-1"></div>
      <div className="bg-shape bg-shape-2"></div>
      <div className="bg-shape bg-shape-3"></div>

      {/* Logo */}
      <div className="logo">
        <span className="logo-icon">Snowflake</span>
      </div>

      {/* Sign In Card */}
      <div className="signin-card">
        <h1 className="signin-title">Sign In</h1>

        <form className="signin-form">
          <input
            type="text"
            placeholder="fka/2022/183"
            className="signin-input"
            defaultValue="fka/2022/183"
          />
          <div className="password-wrapper">
            <input
              type="password"
              placeholder="••••••••"
              className="signin-input password-input"
              defaultValue="••••••••"
            />
            <span className="eye-icon">Eye</span>
          </div>

          <a href="#" className="forgot-password">
            Forgot Password?
          </a>

          <button type="submit" className="signin-btn">
            SIGN IN
          </button>
        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <a href="#" className="register-link">
            Register Now
          </a>
        </p>

        <footer className="signin-footer">© 2015 Listacc Ltd</footer>
      </div>
    </div>
  );
}
