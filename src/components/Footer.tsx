import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-dashboard-bg text-gray-400 p-4 mt-8">
      <div className="container mx-auto flex justify-center items-center text-center">
        <p className="text-sm">
        Smart Analytics
          <br />
          OS Analytics Manager
          <br />
          &copy; {currentYear} iLAMI Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;