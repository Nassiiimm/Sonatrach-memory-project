import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import KPI from '../components/KPI.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Finance() {
  const { headers } = useAuth();

  // Onglet actif
  const [activeTab, setActiveTab] = useState('bc');

  // ============ BONS DE COMMANDE ============
  const [reservations, setReservations] = useState([]);
  const [bcStats, setBcStats] = useState({
    totalReservations: 0,
    totalAmount: 0,
    paid: { count: 0, amount: 0 },
    unpaid: { count: 0, amount: 0 }
  });
  const [bcSearch, setBcSearch] = useState('');
  const [bcPaymentFilter, setBcPaymentFilter] = useState('ALL');
  const [bcRegionFilter, setBcRegionFilter] = useState('ALL');
  const [bcPage, setBcPage] = useState(1);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // ============ FACTURES HOTELS ============
  const [factures, setFactures] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [factureStats, setFactureStats] = useState({
    enAttente: { count: 0, total: 0 },
    validees: { count: 0, total: 0 },
    payees: { count: 0, total: 0 },
    rejetees: { count: 0, total: 0 }
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hotelFilter, setHotelFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [factureForm, setFactureForm] = useState({
    hotel: '',
    numeroFacture: '',
    dateFacture: '',
    montant: '',
    devise: 'DZD',
    observations: ''
  });
  const [editingFacture, setEditingFacture] = useState(null);
  const [editStatut, setEditStatut] = useState('');
  const [editObservations, setEditObservations] = useState('');
  const [editNumeroBonPaiement, setEditNumeroBonPaiement] = useState('');

  // Chargement des reservations (BC)
  const loadReservations = () =>
    axios
      .get(API + '/api/requests?status=RESERVEE', { headers })
      .then(({ data }) => setReservations(data.data || []))
      .catch(() => setReservations([]));

  const loadBcStats = () =>
    axios
      .get(API + '/api/requests/finance/stats', { headers })
      .then(({ data }) => setBcStats(data))
      .catch(() => {});

  // Chargement des factures
  const loadFactures = () =>
    axios
      .get(API + '/api/factures', { headers })
      .then(({ data }) => setFactures(data.data || []))
      .catch(() => setFactures([]));

  const loadFactureStats = () =>
    axios
      .get(API + '/api/factures/stats', { headers })
      .then(({ data }) => setFactureStats(data))
      .catch(() => {});

  const loadHotels = () =>
    axios
      .get(API + '/api/hotels', { headers })
      .then(({ data }) => setHotels(data.data || data || []))
      .catch(() => setHotels([]));

  useEffect(() => {
    loadReservations();
    loadBcStats();
    loadFactures();
    loadFactureStats();
    loadHotels();
  }, []);

  // ============ BC FUNCTIONS ============
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const uniqueRegions = useMemo(() => {
    const set = new Set();
    reservations.forEach(r => {
      if (r.regionAcronym) set.add(r.regionAcronym);
    });
    return Array.from(set).sort();
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      const text = (
        (r.finance?.bcNumber || '') +
        ' ' +
        (r.finance?.employeeSnapshot?.name || r.employee?.name || '') +
        ' ' +
        (r.finance?.employeeSnapshot?.matricule || r.employee?.matricule || '') +
        ' ' +
        (r.relex?.hotel?.name || '') +
        ' ' +
        (r.destination || '')
      ).toLowerCase();

      if (bcSearch && !text.includes(bcSearch.toLowerCase())) return false;
      if (bcPaymentFilter !== 'ALL' && r.finance?.paymentStatus !== bcPaymentFilter) return false;
      if (bcRegionFilter !== 'ALL' && r.regionAcronym !== bcRegionFilter) return false;

      return true;
    });
  }, [reservations, bcSearch, bcPaymentFilter, bcRegionFilter]);

  const downloadBC = (requestId, bcNumber) => {
    window.open(`${API}/api/requests/${requestId}/bc`, '_blank');
  };

  const openPaymentModal = (request) => {
    setPaymentModal(request);
    setPaymentRef('');
    setPaymentNote('');
  };

  const closePaymentModal = () => {
    setPaymentModal(null);
    setPaymentRef('');
    setPaymentNote('');
  };

  const markAsPaid = async () => {
    if (!paymentModal) return;
    try {
      await axios.patch(API + '/api/requests/' + paymentModal._id + '/payment', {
        paymentStatus: 'PAYE',
        paymentReference: paymentRef,
        paymentNote: paymentNote
      }, { headers });
      closePaymentModal();
      loadReservations();
      loadBcStats();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur lors de la mise a jour');
    }
  };

  const [exporting, setExporting] = useState(false);

  const exportBcExcel = async () => {
    if (!filteredReservations.length) {
      alert('Aucun BC a exporter.');
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (bcPaymentFilter !== 'ALL') params.append('paymentStatus', bcPaymentFilter);
      if (bcRegionFilter !== 'ALL') params.append('region', bcRegionFilter);
      if (bcSearch) params.append('search', bcSearch);

      const response = await axios.get(
        `${API}/api/requests/finance/export-excel?${params.toString()}`,
        {
          headers,
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `BC_Sonatrach_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur export Excel:', err);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  const exportBcCsv = () => {
    if (!filteredReservations.length) {
      alert('Aucun BC a exporter.');
      return;
    }

    const csvHeaders = [
      'N BC',
      'Date Generation',
      'Employe',
      'Matricule',
      'Region',
      'Hotel',
      'Destination',
      'Dates Sejour',
      'Nuits',
      'Total',
      'Statut Paiement',
      'Date Paiement'
    ];

    const lines = filteredReservations.map(r => {
      const cols = [
        r.finance?.bcNumber || '',
        r.finance?.bcGeneratedAt ? formatDate(r.finance.bcGeneratedAt) : '',
        r.finance?.employeeSnapshot?.name || r.employee?.name || '',
        r.finance?.employeeSnapshot?.matricule || r.employee?.matricule || '',
        r.regionAcronym || '',
        r.relex?.hotel?.name || '',
        r.destination || '',
        `${formatDate(r.relex?.finalStartDate || r.startDate)} - ${formatDate(r.relex?.finalEndDate || r.endDate)}`,
        r.finance?.nights || '',
        r.finance?.total ? `${r.finance.total} ${r.finance?.currency || 'DZD'}` : '',
        r.finance?.paymentStatus === 'PAYE' ? 'Paye' : 'Non paye',
        r.finance?.paymentDate ? formatDate(r.finance.paymentDate) : ''
      ];
      return cols.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';');
    });

    const csvContent = ['\ufeff' + csvHeaders.join(';'), ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bons-commande.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============ FACTURES FUNCTIONS ============
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
      loadFactureStats();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur lors de la creation');
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
      loadFactureStats();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur lors de la mise a jour');
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

  const exportFacturesCsv = () => {
    if (!filteredFactures.length) {
      alert('Aucune facture a exporter.');
      return;
    }

    const csvHeaders = [
      'Numero Facture', 'Hotel', 'Date Facture', 'Montant', 'Devise',
      'Statut', 'Date Paiement', 'Observations'
    ];

    const lines = filteredFactures.map(f => {
      const cols = [
        f.numeroFacture || '',
        f.hotel?.name || '',
        f.dateFacture ? formatDate(f.dateFacture) : '',
        f.montant != null ? String(f.montant) : '',
        f.devise || 'DZD',
        f.statut || '',
        f.datePaiement ? formatDate(f.datePaiement) : '',
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
      <div className="wrapper" style={{ maxWidth: '1200px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            Module Finance
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}>
            Gestion des Bons de Commande et suivi des creances hotels
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            className={`btn ${activeTab === 'bc' ? '' : 'subtle'}`}
            onClick={() => setActiveTab('bc')}
          >
            Bons de Commande
          </button>
          <button
            className={`btn ${activeTab === 'factures' ? '' : 'subtle'}`}
            onClick={() => setActiveTab('factures')}
          >
            Factures Hotels
          </button>
        </div>

        {/* ============ TAB: BONS DE COMMANDE ============ */}
        {activeTab === 'bc' && (
          <>
            <div className="grid-kpi" style={{ marginBottom: '1rem' }}>
              <KPI
                label="Total Reservations"
                value={bcStats.totalReservations}
                hint={`${formatMoney(bcStats.totalAmount)} DZD`}
              />
              <KPI
                label="Non payees"
                value={bcStats.unpaid.count}
                hint={`${formatMoney(bcStats.unpaid.amount)} DZD`}
              />
              <KPI
                label="Payees"
                value={bcStats.paid.count}
                hint={`${formatMoney(bcStats.paid.amount)} DZD`}
              />
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  Liste des Bons de Commande
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn"
                    type="button"
                    onClick={exportBcExcel}
                    disabled={exporting}
                  >
                    {exporting ? 'Export...' : 'Exporter Excel'}
                  </button>
                  <button className="btn subtle" type="button" onClick={exportBcCsv}>
                    CSV
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(0,1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  className="input"
                  placeholder="Rechercher (N BC, employe, hotel...)"
                  value={bcSearch}
                  onChange={e => setBcSearch(e.target.value)}
                />
                <select
                  className="input"
                  value={bcPaymentFilter}
                  onChange={e => setBcPaymentFilter(e.target.value)}
                >
                  <option value="ALL">Tous les paiements</option>
                  <option value="NON_PAYE">Non paye</option>
                  <option value="PAYE">Paye</option>
                </select>
                <select
                  className="input"
                  value={bcRegionFilter}
                  onChange={e => setBcRegionFilter(e.target.value)}
                >
                  <option value="ALL">Toutes les regions</option>
                  {uniqueRegions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <Table
                columns={[
                  { key: 'finance.bcNumber', title: 'N BC', render: (v, row) => row.finance?.bcNumber || '-' },
                  { key: 'finance.bcGeneratedAt', title: 'Date', render: (v, row) => formatDate(row.finance?.bcGeneratedAt) },
                  {
                    key: 'employee',
                    title: 'Employe',
                    render: (v, row) => {
                      const name = row.finance?.employeeSnapshot?.name || row.employee?.name || '-';
                      const matricule = row.finance?.employeeSnapshot?.matricule || row.employee?.matricule || '';
                      return (
                        <div>
                          <div style={{ fontWeight: 500 }}>{name}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{matricule}</div>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'regionAcronym',
                    title: 'Region',
                    render: v => <span className="badge">{v || '-'}</span>
                  },
                  {
                    key: 'hotel',
                    title: 'Hotel',
                    render: (v, row) => row.relex?.hotel?.name || '-'
                  },
                  {
                    key: 'dates',
                    title: 'Sejour',
                    render: (v, row) => {
                      const start = row.relex?.finalStartDate || row.startDate;
                      const end = row.relex?.finalEndDate || row.endDate;
                      return `${formatDate(start)} - ${formatDate(end)}`;
                    }
                  },
                  {
                    key: 'total',
                    title: 'Total',
                    render: (v, row) => row.finance?.total
                      ? `${formatMoney(row.finance.total)} ${row.finance?.currency || 'DZD'}`
                      : '-'
                  },
                  {
                    key: 'paymentStatus',
                    title: 'Paiement',
                    render: (v, row) => (
                      <span className={`badge ${row.finance?.paymentStatus === 'PAYE' ? 'status-RESERVEE' : 'status-EN_ATTENTE_MANAGER'}`}>
                        {row.finance?.paymentStatus === 'PAYE' ? 'Paye' : 'Non paye'}
                      </span>
                    )
                  },
                  {
                    key: 'actions',
                    title: 'Actions',
                    render: (v, row) => (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          className="btn subtle"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={() => downloadBC(row._id, row.finance?.bcNumber)}
                        >
                          PDF
                        </button>
                        {row.finance?.paymentStatus !== 'PAYE' && (
                          <button
                            className="btn"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={() => openPaymentModal(row)}
                          >
                            Payer
                          </button>
                        )}
                      </div>
                    )
                  }
                ]}
                data={filteredReservations}
              />
            </div>

            {/* Modal de paiement */}
            {paymentModal && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Marquer comme paye
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <div><strong>N BC :</strong> {paymentModal.finance?.bcNumber}</div>
                  <div><strong>Employe :</strong> {paymentModal.finance?.employeeSnapshot?.name || paymentModal.employee?.name}</div>
                  <div><strong>Montant :</strong> {formatMoney(paymentModal.finance?.total)} {paymentModal.finance?.currency || 'DZD'}</div>
                </div>

                <div className="form-grid-2" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                      Reference de paiement
                    </div>
                    <input
                      className="input"
                      placeholder="Ex: VIR-2025-00123"
                      value={paymentRef}
                      onChange={e => setPaymentRef(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                      Note (optionnel)
                    </div>
                    <input
                      className="input"
                      placeholder="Note de paiement"
                      value={paymentNote}
                      onChange={e => setPaymentNote(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn" type="button" onClick={markAsPaid}>
                    Confirmer le paiement
                  </button>
                  <button className="btn subtle" type="button" onClick={closePaymentModal}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============ TAB: FACTURES HOTELS ============ */}
        {activeTab === 'factures' && (
          <>
            <div className="grid-kpi" style={{ marginBottom: '1rem' }}>
              <KPI
                label="En attente"
                value={factureStats.enAttente?.count || 0}
                hint={`${formatMoney(factureStats.enAttente?.total || 0)} DZD`}
              />
              <KPI
                label="Validees"
                value={factureStats.validees?.count || 0}
                hint={`${formatMoney(factureStats.validees?.total || 0)} DZD`}
              />
              <KPI
                label="Payees"
                value={factureStats.payees?.count || 0}
                hint={`${formatMoney(factureStats.payees?.total || 0)} DZD`}
              />
              <KPI
                label="Rejetees"
                value={factureStats.rejetees?.count || 0}
                hint={`${formatMoney(factureStats.rejetees?.total || 0)} DZD`}
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
                <button className="btn subtle" type="button" onClick={exportFacturesCsv}>
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
                  { key: 'dateFacture', title: 'Date', render: v => v ? formatDate(v) : '-' },
                  { key: 'montant', title: 'Montant', render: (v, row) => v ? `${formatMoney(v)} ${row.devise || 'DZD'}` : '-' },
                  {
                    key: 'statut',
                    title: 'Statut',
                    render: v => (
                      <span className={'badge ' + getStatutBadgeClass(v)}>
                        {getStatutLabel(v)}
                      </span>
                    )
                  },
                  { key: 'datePaiement', title: 'Paiement', render: v => v ? formatDate(v) : '-' },
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

            {/* Modal de traitement facture */}
            {editingFacture && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Traitement de la facture
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <div><strong>Numero :</strong> {editingFacture.numeroFacture}</div>
                  <div><strong>Hotel :</strong> {editingFacture.hotel?.name}</div>
                  <div><strong>Montant :</strong> {formatMoney(editingFacture.montant)} {editingFacture.devise}</div>
                  <div><strong>Date facture :</strong> {editingFacture.dateFacture ? formatDate(editingFacture.dateFacture) : '-'}</div>
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
          </>
        )}
      </div>
    </div>
  );
}
