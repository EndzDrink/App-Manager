import React from 'react';

// This is the Footer component. It provides a simple, styled footer for the application.
// It uses Tailwind CSS for a clean, modern look that matches the dashboard.
const Footer = () => {
  return (
    // The footer is a fixed-bottom element with a dark background.
    // We use padding, flexbox for centering, and light text.
    <footer className="w-full bg-dashboard-bg text-gray-400 p-4 mt-8">
      <div className="container mx-auto flex justify-center items-center text-center">
        <p className="text-sm">
          AppManager - Smart Application & Subscription Analytics
          <br />
          Optimize your digital life and save money
          <br />
          &copy; 2025 AppManager. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
