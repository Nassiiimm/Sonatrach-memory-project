import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';

export default function Nav() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  if (!user) return null;

  const links = [
    { to: '/', label: 'Tableau de bord' },
    { to: '/requests', label: 'Demandes', roles: ['EMPLOYE'] },
    { to: '/approvals', label: 'Validation manager', roles: ['MANAGER'] },
    { to: '/relex', label: 'Relex', roles: ['RELEX'] },
    { to: '/finance', label: 'Finance', roles: ['FINANCE'] },
    { to: '/admin', label: 'Admin', roles: ['ADMIN'] }
  ];

  return (
    <nav className="nav-shell">
      <div className="nav-inner">
        <div className="nav-left">
          <div className="nav-logo">
            <span className="nav-dot" />
            <span>Sonatrach · Hébergements</span>
          </div>
          <div className="nav-links">
            {links
              .filter(l => !l.roles || l.roles.includes(user.role))
              .map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={
                  "nav-link " +
                  (loc.pathname === l.to ? "nav-link-active" : "")
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="nav-right">
          <div className="nav-user">
            <div className="nav-user-name">{user.name}</div>
            <div className="nav-user-role">{user.role}</div>
          </div>
          <button className="btn subtle" onClick={logout}>Déconnexion</button>
        </div>
      </div>
    </nav>
  );
}