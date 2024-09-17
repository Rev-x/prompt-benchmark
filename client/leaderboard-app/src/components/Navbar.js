import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Navbar.css';
import logo from '../assets/logo.png'; 

const Navbar = () => {
  const [showAdmin, setShowAdmin] = useState(false); 
  const location = useLocation();

  useEffect(() => {
    const showAdminFromLocalStorage = localStorage.getItem('ShowAdmin');
    setShowAdmin(showAdminFromLocalStorage === 'true');
  }, []); 
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
      <Link className="navbar-brand" to="/" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <img src={logo} alt="Logo" style={{ height: '30px', width: 'auto', marginRight: '10px' }} />
        <span style={{ fontSize: '25px', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>Agent Arena</span>
      </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`} to="/leaderboard">Leaderboard</Link>
            </li>
            {showAdmin && (
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} to="/admin">Admin Panel</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
