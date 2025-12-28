import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import KPI from '../components/KPI.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Dashboard() {
  const { headers } = useAuth();
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
  const pendingFinance = rows.filter(r => r.status === 'EN_ATTENTE_FINANCE').length;
  const closed = rows.filter(r => r.status === 'CLOTUREE' || r.status === 'EFFECTUEE').length;

  return (
    <div>
      <Nav />
      <div className="wrapper">
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            Contrôle des flux hébergement
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            Suivi bout-en-bout : demandes collaborateurs, validations hiérarchiques,
            réservations Relex et bons de commande Finance.
          </div>
        </div>

        <div className="grid-kpi" style={{ marginBottom: '1rem' }}>
          <KPI label="Demandes totales" value={total} hint="Enregistrées sur la période courante" />
          <KPI label="En attente manager" value={pendingManager} hint="Libération ou refus en cours" />
          <KPI label="En traitement Relex" value={pendingRelex} hint="Configuration hôtels & formules" />
          <KPI label="En traitement Finance" value={pendingFinance} hint="Saisie tarif / nuit & BC" />
          <KPI label="Dossiers clôturés" value={closed} hint="Flux complet jusqu'au bon de commande" />
        </div>

        <div className="card">
          <div style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            Dernières demandes
          </div>
          <Table
            columns={[
              { key: 'employee', title: 'Employé', render: (v, row) => row.employee?.name || '—' },
              { key: 'destination', title: 'Destination' },
              { key: 'city', title: 'Ville' },
              {
                key: 'startDate',
                title: 'Début',
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
                render: v => <span className={`badge status-${v}`}>{v}</span>
              }
            ]}
            data={rows.slice(0, 12)}
          />
        </div>
      </div>
    </div>
  );
}