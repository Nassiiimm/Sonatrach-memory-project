import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import KPI from '../components/KPI.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Dashboard() {
  const { headers, user } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios
      .get(API + '/api/requests', { headers })
      .then(({ data }) => setRows(data.data))
      .catch(() => setRows([]));
  }, []);

  const total = rows.length;
  const pendingManager = rows.filter(r => r.status === 'EN_ATTENTE_MANAGER').length;
  const pendingRelex = rows.filter(r => r.status === 'EN_ATTENTE_RELEX').length;
  const reservees = rows.filter(r => r.status === 'RESERVEE').length;
  const refusees = rows.filter(r => r.status === 'REFUSEE').length;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'EN_ATTENTE_MANAGER': return 'Attente Manager';
      case 'EN_ATTENTE_RELEX': return 'Attente Relex';
      case 'RESERVEE': return 'Reservee';
      case 'REFUSEE': return 'Refusee';
      default: return status;
    }
  };

  return (
    <div>
      <Nav />
      <div className="wrapper">
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            Tableau de bord - Gestion des hebergements
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            Suivi des demandes : validation manager, reservation Relex.
            {user?.regionAcronym && (
              <span style={{ marginLeft: '0.5rem', fontWeight: 500 }}>
                Region : {user.regionAcronym}
              </span>
            )}
          </div>
        </div>

        <div className="grid-kpi" style={{ marginBottom: '1rem' }}>
          <KPI label="Demandes totales" value={total} hint="Sur la periode courante" />
          <KPI label="Attente Manager" value={pendingManager} hint="Validation hierarchique" />
          <KPI label="Attente Relex" value={pendingRelex} hint="Reservation hotel" />
          <KPI label="Reservees" value={reservees} hint="Hebergement confirme" />
          <KPI label="Refusees" value={refusees} hint="Demandes non approuvees" />
        </div>

        <div className="card">
          <div style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            Dernieres demandes
          </div>
          <Table
            columns={[
              { key: 'employee', title: 'Employe', render: (v, row) => row.employee?.name || '-' },
              { key: 'regionAcronym', title: 'Region', render: (v, row) => row.regionAcronym || row.employee?.regionAcronym || '-' },
              { key: 'destination', title: 'Destination' },
              { key: 'city', title: 'Ville' },
              {
                key: 'startDate',
                title: 'Debut',
                render: v => (v ? new Date(v).toLocaleDateString() : '')
              },
              {
                key: 'endDate',
                title: 'Fin',
                render: v => (v ? new Date(v).toLocaleDateString() : '')
              },
              {
                key: 'status',
                title: 'Statut',
                render: v => <span className={`badge status-${v}`}>{getStatusLabel(v)}</span>
              }
            ]}
            data={rows.slice(0, 15)}
          />
        </div>
      </div>
    </div>
  );
}
