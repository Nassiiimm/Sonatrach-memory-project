import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import DateRangeFilter from '../components/DateRangeFilter.jsx';
import { useAuth } from '../context/Auth.jsx';
import { toast } from 'sonner';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MapPin,
  Loader2
} from 'lucide-react';

const API = '';

export default function Approvals() {
  const { headers, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('EN_ATTENTE_MANAGER');
  const [q, setQ] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, approved: null, row: null });

  const load = () => {
    setLoading(true);
    const params = { status, q };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    axios
      .get(API + '/api/requests', { headers, params })
      .then(({ data }) => {
        setRows(data.data);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [status, q, startDate, endDate]);

  const openConfirm = (id, approved, row) => {
    setConfirmModal({ isOpen: true, id, approved, row });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, id: null, approved: null, row: null });
  };

  const handleConfirm = async () => {
    const { id, approved } = confirmModal;
    setActionLoading(id);
    try {
      await axios.patch(
        API + '/api/requests/' + id + '/manager',
        { approved },
        { headers }
      );
      toast.success(approved ? 'Demande validee' : 'Demande refusee', {
        description: approved
          ? 'La demande a ete transmise au service Relex'
          : 'La demande a ete rejetee'
      });
      closeConfirm();
      load();
    } catch (err) {
      toast.error('Erreur', {
        description: err?.response?.data?.message || 'Erreur lors de la validation'
      });
    } finally {
      setActionLoading(null);
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
      <div className="wrapper" style={{ maxWidth: '1100px' }}>
        {/* Page Header */}
        <div className="page-header">
          <div className="page-title-row">
            <h1 className="page-title">
              <CheckSquare size={24} style={{ color: 'var(--accent)' }} />
              Validation des demandes
            </h1>
            {user?.regionAcronym && (
              <span className="region-badge">
                <MapPin size={14} />
                {user.regionAcronym}
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Demandes de votre region a valider ou refuser
          </p>
        </div>

        {/* Filters */}
        <div className="card filter-card">
          <div className="filter-grid">
            <div className="form-group">
              <label className="form-label">
                <Filter size={12} /> Statut
              </label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">(tous)</option>
                <option value="EN_ATTENTE_MANAGER">En attente</option>
                <option value="EN_ATTENTE_RELEX">Transmises a Relex</option>
                <option value="RESERVEE">Reservees</option>
                <option value="REFUSEE">Rejetees</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                <Search size={12} /> Recherche
              </label>
              <input
                className="input"
                placeholder="destination, ville, motif..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={() => { setStartDate(''); setEndDate(''); }}
              label="Periode de sejour"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Demandes a valider</h2>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {rows.length} demande(s)
            </span>
          </div>

          {loading ? (
            <div className="loading-container">
              <Loader2 className="spinning" size={28} style={{ color: 'var(--accent)' }} />
              <span className="text-muted">Chargement...</span>
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: 'employee',
                  title: 'Employe',
                  sortable: true,
                  sortValue: (v, row) => row.employee?.name || '',
                  render: (v, row) => row.employee?.name || '-'
                },
                {
                  key: 'regionAcronym',
                  title: 'Region',
                  sortable: true,
                  render: (v, row) => row.regionAcronym || '-'
                },
                { key: 'destination', title: 'Destination', sortable: true },
                { key: 'city', title: 'Ville', sortable: true },
                {
                  key: 'startDate',
                  title: 'Debut',
                  sortable: true,
                  render: (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '-')
                },
                {
                  key: 'endDate',
                  title: 'Fin',
                  sortable: true,
                  render: (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '-')
                },
                {
                  key: 'status',
                  title: 'Statut',
                  sortable: true,
                  render: (v) => (
                    <span className={`badge status-${v}`}>{getStatusLabel(v)}</span>
                  )
                },
                {
                  key: '_id',
                  title: 'Actions',
                  render: (v, row) =>
                    row.status === 'EN_ATTENTE_MANAGER' ? (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          className="btn"
                          onClick={() => openConfirm(v, true, row)}
                          disabled={actionLoading === v}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          {actionLoading === v ? (
                            <Loader2 className="spinning" size={14} />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Valider
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => openConfirm(v, false, row)}
                          disabled={actionLoading === v}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <XCircle size={14} />
                          Refuser
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )
                }
              ]}
              data={rows}
            />
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        title={confirmModal.approved ? 'Valider la demande' : 'Refuser la demande'}
        message={confirmModal.row ? (
          `${confirmModal.approved ? 'Valider' : 'Refuser'} la demande de ${confirmModal.row.employee?.name || 'l\'employe'} pour ${confirmModal.row.destination} (${confirmModal.row.city}) du ${new Date(confirmModal.row.startDate).toLocaleDateString('fr-FR')} au ${new Date(confirmModal.row.endDate).toLocaleDateString('fr-FR')} ?`
        ) : ''}
        confirmText={confirmModal.approved ? 'Valider' : 'Refuser'}
        variant={confirmModal.approved ? 'success' : 'danger'}
        loading={actionLoading !== null}
      />
    </div>
  );
}
