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

  // Labels et hints personnalisés selon le rôle
  const getRoleLabels = () => {
    switch (user?.role) {
      case 'EMPLOYE':
        return {
          totalLabel: 'Mes demandes',
          totalHint: 'Total de vos demandes',
          pendingManagerLabel: 'En attente',
          pendingManagerHint: 'Validation manager',
          pendingRelexLabel: 'Validées',
          pendingRelexHint: 'En cours de réservation',
          subtitle: 'Suivi de vos demandes d\'hébergement'
        };
      case 'MANAGER':
        return {
          totalLabel: 'Demandes région',
          totalHint: `Région ${user?.regionAcronym || ''}`,
          pendingManagerLabel: 'À valider',
          pendingManagerHint: 'En attente de votre décision',
          pendingRelexLabel: 'Transmises Relex',
          pendingRelexHint: 'Validées par vos soins',
          subtitle: `Validation des demandes - Région ${user?.regionAcronym || ''}`
        };
      case 'RELEX':
        return {
          totalLabel: 'Total demandes',
          totalHint: 'Toutes régions',
          pendingManagerLabel: 'Attente Manager',
          pendingManagerHint: 'Pas encore validées',
          pendingRelexLabel: 'À réserver',
          pendingRelexHint: 'En attente de votre traitement',
          subtitle: 'Gestion des réservations hôtelières'
        };
      case 'FINANCE':
        return {
          totalLabel: 'Réservations',
          totalHint: 'À facturer',
          pendingManagerLabel: 'En traitement',
          pendingManagerHint: 'Workflow en cours',
          pendingRelexLabel: 'Attente Relex',
          pendingRelexHint: 'Réservation en cours',
          subtitle: 'Suivi des bons de commande et paiements'
        };
      default: // ADMIN
        return {
          totalLabel: 'Demandes totales',
          totalHint: 'Toutes régions confondues',
          pendingManagerLabel: 'Attente Manager',
          pendingManagerHint: 'Validation hiérarchique',
          pendingRelexLabel: 'Attente Relex',
          pendingRelexHint: 'Réservation hôtel',
          subtitle: 'Vue d\'ensemble du système'
        };
    }
  };

  const labels = getRoleLabels();

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
            {labels.subtitle}
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid-kpi" style={{ marginBottom: '1.5rem' }}>
          <KPI
            label={labels.totalLabel}
            value={loading ? '-' : total}
            hint={labels.totalHint}
            variant="total"
            icon={FileText}
          />
          <KPI
            label={labels.pendingManagerLabel}
            value={loading ? '-' : pendingManager}
            hint={labels.pendingManagerHint}
            variant="pending"
            icon={Clock}
          />
          <KPI
            label={labels.pendingRelexLabel}
            value={loading ? '-' : pendingRelex}
            hint={labels.pendingRelexHint}
            variant="pending"
            icon={Building2}
          />
          <KPI
            label="Réservées"
            value={loading ? '-' : reservees}
            hint="Hébergement confirmé"
            variant="success"
            icon={CheckCircle}
          />
          <KPI
            label="Refusées"
            value={loading ? '-' : refusees}
            hint="Non approuvées"
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
