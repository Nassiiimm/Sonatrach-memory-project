import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import KPI from '../components/KPI.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Finance() {
  const { headers } = useAuth();

  const [factures, setFactures] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [stats, setStats] = useState({
    enAttente: { count: 0, total: 0 },
    validees: { count: 0, total: 0 },
    payees: { count: 0, total: 0 },
    rejetees: { count: 0, total: 0 }
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hotelFilter, setHotelFilter] = useState('ALL');

  // Formulaire nouvelle facture
  const [showForm, setShowForm] = useState(false);
  const [factureForm, setFactureForm] = useState({
    hotel: '',
    numeroFacture: '',
    dateFacture: '',
    montant: '',
    devise: 'DZD',
    observations: ''
  });

  // Modal de traitement
  const [editingFacture, setEditingFacture] = useState(null);
  const [editStatut, setEditStatut] = useState('');
  const [editObservations, setEditObservations] = useState('');
  const [editNumeroBonPaiement, setEditNumeroBonPaiement] = useState('');

  const loadFactures = () =>
    axios
      .get(API + '/api/factures', { headers })
      .then(({ data }) => setFactures(data.data || []))
      .catch(() => setFactures([]));

  const loadStats = () =>
    axios
      .get(API + '/api/factures/stats', { headers })
      .then(({ data }) => setStats(data))
      .catch(() => {});

  const loadHotels = () =>
    axios
      .get(API + '/api/hotels', { headers })
      .then(({ data }) => setHotels(data.data || data || []))
      .catch(() => setHotels([]));

  useEffect(() => {
    loadFactures();
    loadStats();
    loadHotels();
  }, []);

  const createFacture = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API + '/api/factures', {
        ...factureForm,
        montant: Number(factureForm.montant)
      }, { headers });
      setFactureForm({
        hotel: '',
        numeroFacture: '',
        dateFacture: '',
        montant: '',
        devise: 'DZD',
        observations: ''
      });
      setShowForm(false);
      loadFactures();
      loadStats();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const openEditModal = (facture) => {
    setEditingFacture(facture);
    setEditStatut(facture.statut);
    setEditObservations(facture.observations || '');
    setEditNumeroBonPaiement(facture.numeroBonPaiement || '');
  };

  const closeEditModal = () => {
    setEditingFacture(null);
    setEditStatut('');
    setEditObservations('');
    setEditNumeroBonPaiement('');
  };

  const saveFacture = async () => {
    if (!editingFacture) return;
    try {
      await axios.patch(API + '/api/factures/' + editingFacture._id, {
        statut: editStatut,
        observations: editObservations,
        numeroBonPaiement: editNumeroBonPaiement
      }, { headers });
      closeEditModal();
      loadFactures();
      loadStats();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const uniqueHotels = useMemo(() => {
    const set = new Set();
    factures.forEach(f => {
      if (f.hotel?.name) set.add(f.hotel.name);
    });
    return Array.from(set);
  }, [factures]);

  const filteredFactures = useMemo(() => {
    return factures.filter(f => {
      const text = (
        (f.hotel?.name || '') +
        ' ' +
        (f.numeroFacture || '') +
        ' ' +
        (f.observations || '')
      ).toLowerCase();

      if (search && !text.includes(search.toLowerCase())) return false;
      if (statusFilter !== 'ALL' && f.statut !== statusFilter) return false;
      if (hotelFilter !== 'ALL' && f.hotel?.name !== hotelFilter) return false;

      return true;
    });
  }, [factures, search, statusFilter, hotelFilter]);

  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'PAYEE': return 'status-RESERVEE';
      case 'VALIDEE': return 'status-EN_ATTENTE_RELEX';
      case 'REJETEE': return 'status-REFUSEE';
      default: return '';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'VALIDEE': return 'Validee';
      case 'PAYEE': return 'Payee';
      case 'REJETEE': return 'Rejetee';
      default: return statut;
    }
  };

  const exportCsv = () => {
    if (!filteredFactures.length) {
      alert('Aucune facture a exporter.');
      return;
    }

    const csvHeaders = [
      'Numero Facture',
      'Hotel',
      'Date Facture',
      'Montant',
      'Devise',
      'Statut',
      'Date Paiement',
      'Observations'
    ];

    const lines = filteredFactures.map(f => {
      const cols = [
        f.numeroFacture || '',
        f.hotel?.name || '',
        f.dateFacture ? new Date(f.dateFacture).toLocaleDateString() : '',
        f.montant != null ? String(f.montant) : '',
        f.devise || 'DZD',
        f.statut || '',
        f.datePaiement ? new Date(f.datePaiement).toLocaleDateString() : '',
        f.observations || ''
      ];
      return cols.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';');
    });

    const csvContent = ['\ufeff' + csvHeaders.join(';'), ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'factures-hotels.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Nav />
      <div className="wrapper" style={{ maxWidth: '1100px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            Gestion des Factures Hotels
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}>
            Suivi des creances et paiements aux etablissements partenaires
          </div>
        </div>

        <div className="grid-kpi" style={{ marginBottom: '1rem' }}>
          <KPI
            label="En attente"
            value={stats.enAttente.count}
            hint={`${stats.enAttente.total.toLocaleString()} DZD`}
          />
          <KPI
            label="Validees"
            value={stats.validees.count}
            hint={`${stats.validees.total.toLocaleString()} DZD`}
          />
          <KPI
            label="Payees"
            value={stats.payees.count}
            hint={`${stats.payees.total.toLocaleString()} DZD`}
          />
          <KPI
            label="Rejetees"
            value={stats.rejetees.count}
            hint={`${stats.rejetees.total.toLocaleString()} DZD`}
          />
        </div>

        {/* Formulaire nouvelle facture */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showForm ? '0.75rem' : 0 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {showForm ? 'Nouvelle facture' : 'Ajouter une facture'}
            </div>
            <button
              className="btn subtle"
              type="button"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Annuler' : '+ Ajouter'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={createFacture} style={{ display: 'grid', gap: '0.5rem' }}>
              <div className="form-grid-2">
                <select
                  className="input"
                  value={factureForm.hotel}
                  onChange={e => setFactureForm({ ...factureForm, hotel: e.target.value })}
                  required
                >
                  <option value="">Selectionner un hotel</option>
                  {hotels.map(h => (
                    <option key={h._id} value={h._id}>{h.name} - {h.city}</option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Numero de facture"
                  value={factureForm.numeroFacture}
                  onChange={e => setFactureForm({ ...factureForm, numeroFacture: e.target.value })}
                  required
                />
              </div>
              <div className="form-grid-2">
                <input
                  className="input"
                  type="date"
                  placeholder="Date facture"
                  value={factureForm.dateFacture}
                  onChange={e => setFactureForm({ ...factureForm, dateFacture: e.target.value })}
                  required
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="input"
                    type="number"
                    placeholder="Montant"
                    value={factureForm.montant}
                    onChange={e => setFactureForm({ ...factureForm, montant: e.target.value })}
                    required
                    style={{ flex: 2 }}
                  />
                  <select
                    className="input"
                    value={factureForm.devise}
                    onChange={e => setFactureForm({ ...factureForm, devise: e.target.value })}
                    style={{ flex: 1 }}
                  >
                    <option value="DZD">DZD</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <textarea
                className="input"
                placeholder="Observations (optionnel)"
                rows={2}
                value={factureForm.observations}
                onChange={e => setFactureForm({ ...factureForm, observations: e.target.value })}
              />
              <button className="btn" type="submit">Enregistrer la facture</button>
            </form>
          )}
        </div>

        {/* Liste des factures */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Liste des factures
            </div>
            <button className="btn subtle" type="button" onClick={exportCsv}>
              Exporter CSV
            </button>
          </div>

          <div className="form-grid-2" style={{ gap: '0.5rem', marginBottom: '0.5rem', gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(0,1fr))' }}>
            <input
              className="input"
              placeholder="Rechercher (hotel, numero...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="VALIDEE">Validee</option>
              <option value="PAYEE">Payee</option>
              <option value="REJETEE">Rejetee</option>
            </select>
            <select
              className="input"
              value={hotelFilter}
              onChange={e => setHotelFilter(e.target.value)}
            >
              <option value="ALL">Tous les hotels</option>
              {uniqueHotels.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <Table
            columns={[
              { key: 'numeroFacture', title: 'N Facture' },
              { key: 'hotel', title: 'Hotel', render: (v, row) => row.hotel?.name || '-' },
              { key: 'dateFacture', title: 'Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
              { key: 'montant', title: 'Montant', render: (v, row) => v ? `${v.toLocaleString()} ${row.devise || 'DZD'}` : '-' },
              {
                key: 'statut',
                title: 'Statut',
                render: v => (
                  <span className={'badge ' + getStatutBadgeClass(v)}>
                    {getStatutLabel(v)}
                  </span>
                )
              },
              { key: 'datePaiement', title: 'Paiement', render: v => v ? new Date(v).toLocaleDateString() : '-' },
              {
                key: '_id',
                title: 'Action',
                render: (v, row) => (
                  <button className="btn" type="button" onClick={() => openEditModal(row)}>
                    Traiter
                  </button>
                )
              }
            ]}
            data={filteredFactures}
          />
        </div>

        {/* Modal de traitement */}
        {editingFacture && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Traitement de la facture
            </div>
            <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              <div><strong>Numero :</strong> {editingFacture.numeroFacture}</div>
              <div><strong>Hotel :</strong> {editingFacture.hotel?.name}</div>
              <div><strong>Montant :</strong> {editingFacture.montant?.toLocaleString()} {editingFacture.devise}</div>
              <div><strong>Date facture :</strong> {editingFacture.dateFacture ? new Date(editingFacture.dateFacture).toLocaleDateString() : '-'}</div>
            </div>

            <div className="form-grid-2" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  Statut
                </div>
                <select
                  className="input"
                  value={editStatut}
                  onChange={e => setEditStatut(e.target.value)}
                >
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="VALIDEE">Validee</option>
                  <option value="PAYEE">Payee</option>
                  <option value="REJETEE">Rejetee</option>
                </select>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  N Bon de paiement
                </div>
                <input
                  className="input"
                  placeholder="Numero bon paiement"
                  value={editNumeroBonPaiement}
                  onChange={e => setEditNumeroBonPaiement(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                Observations
              </div>
              <textarea
                className="input"
                rows={2}
                value={editObservations}
                onChange={e => setEditObservations(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn" type="button" onClick={saveFacture}>
                Enregistrer
              </button>
              <button className="btn subtle" type="button" onClick={closeEditModal}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
