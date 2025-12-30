import React, { useState } from 'react';
import { useAuth } from '../context/Auth.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, LogIn, Building2, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Connexion réussie', {
        description: 'Bienvenue sur SGRH'
      });
      navigate('/');
    } catch (e) {
      toast.error('Échec de connexion', {
        description: 'Vérifiez vos identifiants et réessayez.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        {/* Logo & Header */}
        <div className="login-header">
          <div className="login-logo">
            <Building2 size={32} strokeWidth={1.5} />
          </div>
          <div className="login-subtitle">Sonatrach · Hébergements</div>
          <h1 className="login-title">Connexion</h1>
          <p className="login-description">
            Portail de gestion des réservations hôtelières
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" size={18} />
            <input
              className="input input-with-icon"
              type="email"
              placeholder="Email professionnel"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input
              className="input input-with-icon"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-login"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <Loader2 className="btn-icon spinning" size={18} />
                Connexion en cours...
              </>
            ) : (
              <>
                <LogIn className="btn-icon" size={18} />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <span>SGRH</span>
          <span className="separator">·</span>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  );
}
