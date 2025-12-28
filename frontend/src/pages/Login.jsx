import React, { useState } from 'react';
import { useAuth } from '../context/Auth.jsx';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e)=>{
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try{
      await login(email, password);
      navigate('/');
    }catch(e){
      setErr("Échec de connexion, vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        minHeight:'100vh',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding:'1.5rem'
      }}
    >
      <div 
        className="card" 
        style={{ 
          width:'100%', 
          maxWidth:'420px',
          padding:'1.9rem 2rem',
          borderRadius:'26px'
        }}
      >
        <div style={{ marginBottom:'1.3rem' }}>
          <div style={{ fontSize:'0.78rem', letterSpacing:'0.18em', textTransform:'uppercase', color:'#71717a', marginBottom:'0.35rem' }}>
            Sonatrach · Hébergements
          </div>
          <div style={{ fontSize:'1.35rem', fontWeight:650, marginBottom:'0.25rem' }}>Connexion</div>
          <div className="text-muted" style={{ fontSize:'0.8rem' }}>Portail de gestion des réservations hôtelières.</div>
        </div>
        <form onSubmit={onSubmit} style={{ display:'grid', gap:'0.6rem' }}>
          <input 
            className="input" 
            placeholder="Email professionnel" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
          />
          <input 
            className="input" 
            placeholder="Mot de passe" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
          />
          {err && (
            <div style={{ color:'#f97373', fontSize:'0.8rem', marginTop:'0.1rem' }}>
              {err}
            </div>
          )}
          <button 
            className="btn" 
            style={{ width:'100%', marginTop:'0.4rem' }} 
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}