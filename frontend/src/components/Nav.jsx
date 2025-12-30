import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Building,
  Wallet,
  Settings,
  LogOut,
  User
} from 'lucide-react';

const iconMap = {
  '/': LayoutDashboard,
  '/requests': FileText,
  '/approvals': CheckSquare,
  '/relex': Building,
  '/finance': Wallet,
  '/admin': Settings
};

export default function Nav() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.success('Deconnexion reussie', {
      description: 'A bientot sur SGRH'
    });
  };

  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/requests', label: 'Demandes', roles: ['EMPLOYE'] },
    { to: '/approvals', label: 'Validation', roles: ['MANAGER'] },
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
            <span>SGRH</span>
          </div>
          <div className="nav-links">
            {links
              .filter(l => !l.roles || l.roles.includes(user.role))
              .map(l => {
                const Icon = iconMap[l.to];
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={
                      "nav-link " +
                      (loc.pathname === l.to ? "nav-link-active" : "")
                    }
                  >
                    {Icon && <Icon size={15} />}
                    {l.label}
                  </Link>
                );
              })}
          </div>
        </div>
        <div className="nav-right">
          <div className="nav-user">
            <div className="nav-user-name">
              <User size={14} style={{ marginRight: '0.35rem', opacity: 0.7 }} />
              {user.name}
            </div>
            <div className="nav-user-role">{user.role}</div>
          </div>
          <button className="btn subtle" onClick={handleLogout}>
            <LogOut size={14} />
            Quitter
          </button>
        </div>
      </div>
    </nav>
  );
}
