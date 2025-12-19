import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>🎓 Student Hub &copy; {new Date().getFullYear()}</p>
        <p>Your academic companion for success</p>
        <div className="footer-links">
          <a href="/about">About</a> | 
          <a href="/contact"> Contact</a> | 
          <a href="/privacy"> Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;