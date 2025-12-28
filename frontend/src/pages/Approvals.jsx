import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Approvals() {
  const { headers, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('EN_ATTENTE_MANAGER');
  const [q, setQ] = useState('');

  const load = () => axios.get(API + '/api/requests', { headers, params: { status, q } }).then(({ data }) => setRows(data.data));
  useEffect(() => { load(); }, [status, q]);

  const act = async (id, approved) => {
    const confirmMsg = approved ? 'Valider cette demande (liberer) ?' : 'Refuser cette demande ?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await axios.patch(API + '/api/requests/' + id + '/manager', { approved }, { headers });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const getStatusLabel = (s) => {
    switch (s) {
      case 'EN_ATTENTE_MANAGER': return 'Attente Manager';
      case 'EN_ATTENTE_RELEX': return 'Attente Relex';
      case 'RESERVEE': return 'Reservee';
      case 'REFUSEE': return 'Refusee';
      default: return s;
    }
  };

  return (
    <div>
      <Nav />
      <div className="wrapper" style={{ maxWidth: '1000px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            Validation des demandes
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}>
            Demandes de votre region a valider ou refuser
            {user?.regionAcronym && (
              <span style={{ marginLeft: '0.5rem', fontWeight: 500, color: 'var(--accent)' }}>
                ({user.regionAcronym})
              </span>
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '0.5rem', alignItems: 'end', marginBottom: '1rem' }}>
          <div>
            <div className="text-muted" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>Filtre statut</div>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">(tous)</option>
              <option value="EN_ATTENTE_MANAGER">En attente</option>
              <option value="EN_ATTENTE_RELEX">Transmises a Relex</option>
              <option value="RESERVEE">Reservees</option>
              <option value="REFUSEE">Rejetees</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 3 / span 3' }}>
            <div className="text-muted" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>Recherche</div>
            <input className="input" placeholder="destination, ville, motif..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>Demandes a valider</div>
          <Table columns={[
            { key: 'employee', title: 'Employe', render: (v, row) => row.employee?.name },
            { key: 'regionAcronym', title: 'Region', render: (v, row) => row.regionAcronym || '-' },
            { key: 'destination', title: 'Destination' },
            { key: 'city', title: 'Ville' },
            { key: 'startDate', title: 'Debut', render: v => new Date(v).toLocaleDateString() },
            { key: 'endDate', title: 'Fin', render: v => new Date(v).toLocaleDateString() },
            { key: 'status', title: 'Statut', render: v => <span className={`badge status-${v}`}>{getStatusLabel(v)}</span> },
            {
              key: '_id', title: 'Actions', render: (v, row) => (
                row.status === 'EN_ATTENTE_MANAGER' ? (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button className="btn" onClick={() => act(v, true)}>Valider</button>
                    <button className="btn subtle" onClick={() => act(v, false)}>Refuser</button>
                  </div>
                ) : (
                  <span className="text-muted">-</span>
                )
              )
            }
          ]} data={rows} />
        </div>
      </div>
    </div>
  );
}
