import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import KPI from '../components/KPI.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  Building2,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  User,
  Loader2
} from 'lucide-react';

import { API_URL } from '../config.js';
const API = API_URL;

export default function Dashboard() {
  const { headers, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(API + '/api/requests', { headers })
      .then(({ data }) => {
        setRows(data.data);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
        toast.error('Erreur de chargement', {
          description: 'Impossible de charger les demandes'
        });
      });
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
      case 'CLOTUREE': return 'Cloturee';
      case 'EFFECTUEE': return 'Effectuee';
      default: return status;
    }
  };

  return (
    <div>
      <Nav />
      <div className="wrapper">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-title-row">
            <h1 className="page-title">
              <Building2 size={24} style={{ color: 'var(--accent)' }} />
              Tableau de bord
            </h1>
            {user?.regionAcronym && (
              <span className="region-badge">
                <MapPin size={14} />
                {user.regionAcronym}
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Suivi des demandes d'hebergement - validation manager et reservation Relex
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid-kpi" style={{ marginBottom: '1.5rem' }}>
          <KPI
            label="Demandes totales"
            value={loading ? '-' : total}
            hint="Periode courante"
            variant="total"
            icon={FileText}
          />
          <KPI
            label="Attente Manager"
            value={loading ? '-' : pendingManager}
            hint="Validation hierarchique"
            variant="pending"
            icon={Clock}
          />
          <KPI
            label="Attente Relex"
            value={loading ? '-' : pendingRelex}
            hint="Reservation hotel"
            variant="pending"
            icon={Building2}
          />
          <KPI
            label="Reservees"
            value={loading ? '-' : reservees}
            hint="Hebergement confirme"
            variant="success"
            icon={CheckCircle}
          />
          <KPI
            label="Refusees"
            value={loading ? '-' : refusees}
            hint="Non approuvees"
            variant="error"
            icon={XCircle}
          />
        </div>

        {/* Table Card */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">
              <Calendar size={18} />
              Dernieres demandes
            </h2>
          </div>

          {loading ? (
            <div className="loading-container">
              <Loader2 className="spinning" size={32} style={{ color: 'var(--accent)' }} />
              <span className="text-muted">Chargement des demandes...</span>
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: 'employee',
                  title: 'Employe',
                  render: (v, row) => (
                    <span className="cell-employee">
                      <User size={14} />
                      {row.employee?.name || '-'}
                    </span>
                  )
                },
                { key: 'regionAcronym', title: 'Region', render: (v, row) => row.regionAcronym || row.employee?.regionAcronym || '-' },
                { key: 'destination', title: 'Destination' },
                { key: 'city', title: 'Ville' },
                {
                  key: 'startDate',
                  title: 'Debut',
                  render: v => (v ? new Date(v).toLocaleDateString('fr-FR') : '-')
                },
                {
                  key: 'endDate',
                  title: 'Fin',
                  render: v => (v ? new Date(v).toLocaleDateString('fr-FR') : '-')
                },
                {
                  key: 'status',
                  title: 'Statut',
                  render: v => <span className={`badge status-${v}`}>{getStatusLabel(v)}</span>
                }
              ]}
              data={rows.slice(0, 15)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
