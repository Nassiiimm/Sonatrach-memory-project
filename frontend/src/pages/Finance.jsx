import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import KPI from '../components/KPI.jsx';
import DateRangeFilter from '../components/DateRangeFilter.jsx';
import { useAuth } from '../context/Auth.jsx';
import { toast } from 'sonner';
import {
  Wallet,
  FileText,
  Receipt,
  Download,
  CreditCard,
  Search,
  Filter,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Clock,
  Ban,
  FileSpreadsheet
} from 'lucide-react';

import { API_URL } from '../config.js';
const API = API_URL;

export default function Finance() {
  const { headers } = useAuth();

  const [activeTab, setActiveTab] = useState('bc');

  // BC State
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
  const [bcStartDate, setBcStartDate] = useState('');
  const [bcEndDate, setBcEndDate] = useState('');
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Factures State
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
  const [factureStartDate, setFactureStartDate] = useState('');
  const [factureEndDate, setFactureEndDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [factureForm, setFactureForm] = useState({
    hotel: '',
    numeroFacture: '',
    dateFacture: '',
    montant: '',
    devise: 'DZD',
    observations: ''
  });
  const [factureLoading, setFactureLoading] = useState(false);
  const [editingFacture, setEditingFacture] = useState(null);
  const [editStatut, setEditStatut] = useState('');
  const [editObservations, setEditObservations] = useState('');
  const [editNumeroBonPaiement, setEditNumeroBonPaiement] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Load Functions
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
    setLoading(true);
    Promise.all([
      loadReservations(),
      loadBcStats(),
      loadFactures(),
      loadFactureStats(),
      loadHotels()
    ]).finally(() => setLoading(false));
  }, []);

  // Helpers
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  // BC Functions
  const uniqueRegions = useMemo(() => {
    const set = new Set();
    reservations.forEach((r) => {
      if (r.regionAcronym) set.add(r.regionAcronym);
    });
    return Array.from(set).sort();
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
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
      if (bcPaymentFilter !== 'ALL' && r.finance?.paymentStatus !== bcPaymentFilter)
        return false;
      if (bcRegionFilter !== 'ALL' && r.regionAcronym !== bcRegionFilter) return false;

      // Date filter on BC generation date
      if (bcStartDate && r.finance?.bcGeneratedAt) {
        if (new Date(r.finance.bcGeneratedAt) < new Date(bcStartDate)) return false;
      }
      if (bcEndDate && r.finance?.bcGeneratedAt) {
        if (new Date(r.finance.bcGeneratedAt) > new Date(bcEndDate + 'T23:59:59')) return false;
      }

      return true;
    });
  }, [reservations, bcSearch, bcPaymentFilter, bcRegionFilter, bcStartDate, bcEndDate]);

  const downloadBC = (requestId) => {
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
    setPaymentLoading(true);
    try {
      await axios.patch(
        API + '/api/requests/' + paymentModal._id + '/payment',
        {
          paymentStatus: 'PAYE',
          paymentReference: paymentRef,
          paymentNote: paymentNote
        },
        { headers }
      );
      toast.success('Paiement enregistre', {
        description: `BC ${paymentModal.finance?.bcNumber} marque comme paye`
      });
      closePaymentModal();
      loadReservations();
      loadBcStats();
    } catch (err) {
      toast.error('Erreur', {
        description: err?.response?.data?.message || 'Erreur lors de la mise a jour'
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const exportBcExcel = async () => {
    if (!filteredReservations.length) {
      toast.error('Aucun BC a exporter');
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
        { headers, responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `BC_Sonatrach_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Export reussi', { description: 'Fichier Excel telecharge' });
    } catch (err) {
      toast.error('Erreur export Excel');
    } finally {
      setExporting(false);
    }
  };

  // Factures Functions
  const createFacture = async (e) => {
    e.preventDefault();
    setFactureLoading(true);
    try {
      await axios.post(
        API + '/api/factures',
        { ...factureForm, montant: Number(factureForm.montant) },
        { headers }
      );
      toast.success('Facture creee', {
        description: `Facture ${factureForm.numeroFacture} enregistree`
      });
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
      toast.error('Erreur', {
        description: err?.response?.data?.message || 'Erreur lors de la creation'
      });
    } finally {
      setFactureLoading(false);
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
    setEditLoading(true);
    try {
      await axios.patch(
        API + '/api/factures/' + editingFacture._id,
        {
          statut: editStatut,
          observations: editObservations,
          numeroBonPaiement: editNumeroBonPaiement
        },
        { headers }
      );
      toast.success('Facture mise a jour');
      closeEditModal();
      loadFactures();
      loadFactureStats();
    } catch (err) {
      toast.error('Erreur', {
        description: err?.response?.data?.message || 'Erreur lors de la mise a jour'
      });
    } finally {
      setEditLoading(false);
    }
  };

  const uniqueHotels = useMemo(() => {
    const set = new Set();
    factures.forEach((f) => {
      if (f.hotel?.name) set.add(f.hotel.name);
    });
    return Array.from(set);
  }, [factures]);

  const filteredFactures = useMemo(() => {
    return factures.filter((f) => {
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

      // Date filter on invoice date
      if (factureStartDate && f.dateFacture) {
        if (new Date(f.dateFacture) < new Date(factureStartDate)) return false;
      }
      if (factureEndDate && f.dateFacture) {
        if (new Date(f.dateFacture) > new Date(factureEndDate + 'T23:59:59')) return false;
      }

      return true;
    });
  }, [factures, search, statusFilter, hotelFilter, factureStartDate, factureEndDate]);

  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'PAYEE':
        return 'status-RESERVEE';
      case 'VALIDEE':
        return 'status-EN_ATTENTE_RELEX';
      case 'REJETEE':
        return 'status-REFUSEE';
      default:
        return '';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'VALIDEE':
        return 'Validee';
      case 'PAYEE':
        return 'Payee';
      case 'REJETEE':
        return 'Rejetee';
      default:
        return statut;
    }
  };

  return (
    <div>
      <Nav />
      <div className="wrapper" style={{ maxWidth: '1200px' }}>
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            <Wallet size={24} style={{ color: 'var(--accent)' }} />
            Module Finance
          </h1>
          <p className="page-subtitle">
            Gestion des Bons de Commande et suivi des creances hotels
          </p>
        </div>

        {/* Tabs */}
        <div className="finance-tabs">
          <button
            className={`tab-btn ${activeTab === 'bc' ? 'active' : ''}`}
            onClick={() => setActiveTab('bc')}
          >
            <FileText size={16} />
            Bons de Commande
          </button>
          <button
            className={`tab-btn ${activeTab === 'factures' ? 'active' : ''}`}
            onClick={() => setActiveTab('factures')}
          >
            <Receipt size={16} />
            Factures Hotels
          </button>
        </div>

        {/* TAB: BONS DE COMMANDE */}
        {activeTab === 'bc' && (
          <>
            <div className="grid-kpi" style={{ marginBottom: '1rem' }}>
              <KPI
                label="Total Reservations"
                value={bcStats.totalReservations}
                hint={`${formatMoney(bcStats.totalAmount)} DZD`}
                variant="total"
                icon={FileText}
              />
              <KPI
                label="Non payees"
                value={bcStats.unpaid.count}
                hint={`${formatMoney(bcStats.unpaid.amount)} DZD`}
                variant="pending"
                icon={Clock}
              />
              <KPI
                label="Payees"
                value={bcStats.paid.count}
                hint={`${formatMoney(bcStats.paid.amount)} DZD`}
                variant="success"
                icon={CheckCircle}
              />
            </div>

            <div className="card">
              <div className="section-header">
                <h2 className="section-title">Liste des Bons de Commande</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn"
                    type="button"
                    onClick={exportBcExcel}
                    disabled={exporting}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    {exporting ? (
                      <Loader2 className="spinning" size={14} />
                    ) : (
                      <FileSpreadsheet size={14} />
                    )}
                    Excel
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="finance-filters">
                <div className="form-group" style={{ flex: 2 }}>
                  <div className="input-group">
                    <Search className="input-icon" size={16} />
                    <input
                      className="input input-with-icon"
                      placeholder="Rechercher (N BC, employe, hotel...)"
                      value={bcSearch}
                      onChange={(e) => setBcSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <select
                    className="input"
                    value={bcPaymentFilter}
                    onChange={(e) => setBcPaymentFilter(e.target.value)}
                  >
                    <option value="ALL">Tous les paiements</option>
                    <option value="NON_PAYE">Non paye</option>
                    <option value="PAYE">Paye</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <select
                    className="input"
                    value={bcRegionFilter}
                    onChange={(e) => setBcRegionFilter(e.target.value)}
                  >
                    <option value="ALL">Toutes les regions</option>
                    {uniqueRegions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="finance-filters" style={{ marginTop: '0.5rem' }}>
                <DateRangeFilter
                  startDate={bcStartDate}
                  endDate={bcEndDate}
                  onStartDateChange={setBcStartDate}
                  onEndDateChange={setBcEndDate}
                  onClear={() => { setBcStartDate(''); setBcEndDate(''); }}
                  label="Date du BC"
                />
              </div>

              {loading ? (
                <div className="loading-container">
                  <Loader2
                    className="spinning"
                    size={28}
                    style={{ color: 'var(--accent)' }}
                  />
                  <span className="text-muted">Chargement...</span>
                </div>
              ) : (
                <Table
                  columns={[
                    {
                      key: 'finance.bcNumber',
                      title: 'N BC',
                      sortable: true,
                      sortValue: (v, row) => row.finance?.bcNumber || '',
                      render: (v, row) => row.finance?.bcNumber || '-'
                    },
                    {
                      key: 'finance.bcGeneratedAt',
                      title: 'Date',
                      sortable: true,
                      sortValue: (v, row) => row.finance?.bcGeneratedAt || '',
                      render: (v, row) => formatDate(row.finance?.bcGeneratedAt)
                    },
                    {
                      key: 'employee',
                      title: 'Employe',
                      sortable: true,
                      sortValue: (v, row) => row.finance?.employeeSnapshot?.name || row.employee?.name || '',
                      render: (v, row) => {
                        const name =
                          row.finance?.employeeSnapshot?.name ||
                          row.employee?.name ||
                          '-';
                        const matricule =
                          row.finance?.employeeSnapshot?.matricule ||
                          row.employee?.matricule ||
                          '';
                        return (
                          <div>
                            <div style={{ fontWeight: 500 }}>{name}</div>
                            <div
                              className="text-muted"
                              style={{ fontSize: '0.7rem' }}
                            >
                              {matricule}
                            </div>
                          </div>
                        );
                      }
                    },
                    {
                      key: 'regionAcronym',
                      title: 'Region',
                      sortable: true,
                      render: (v) => <span className="badge">{v || '-'}</span>
                    },
                    {
                      key: 'hotel',
                      title: 'Hotel',
                      sortable: true,
                      sortValue: (v, row) => row.relex?.hotel?.name || '',
                      render: (v, row) => row.relex?.hotel?.name || '-'
                    },
                    {
                      key: 'total',
                      title: 'Total',
                      sortable: true,
                      sortValue: (v, row) => row.finance?.total || 0,
                      render: (v, row) =>
                        row.finance?.total
                          ? `${formatMoney(row.finance.total)} ${
                              row.finance?.currency || 'DZD'
                            }`
                          : '-'
                    },
                    {
                      key: 'paymentStatus',
                      title: 'Paiement',
                      sortable: true,
                      sortValue: (v, row) => row.finance?.paymentStatus || '',
                      render: (v, row) => (
                        <span
                          className={`badge ${
                            row.finance?.paymentStatus === 'PAYE'
                              ? 'status-RESERVEE'
                              : 'status-EN_ATTENTE_MANAGER'
                          }`}
                        >
                          {row.finance?.paymentStatus === 'PAYE'
                            ? 'Paye'
                            : 'Non paye'}
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
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.7rem'
                            }}
                            onClick={() => downloadBC(row._id)}
                          >
                            <Download size={12} />
                            PDF
                          </button>
                          {row.finance?.paymentStatus !== 'PAYE' && (
                            <button
                              className="btn"
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.7rem'
                              }}
                              onClick={() => openPaymentModal(row)}
                            >
                              <CreditCard size={12} />
                              Payer
                            </button>
                          )}
                        </div>
                      )
                    }
                  ]}
                  data={filteredReservations}
                />
              )}
            </div>

            {/* Payment Modal */}
            {paymentModal && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="section-header">
                  <h2 className="section-title">
                    <CreditCard size={18} />
                    Marquer comme paye
                  </h2>
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <div>
                    <strong>N BC :</strong> {paymentModal.finance?.bcNumber}
                  </div>
                  <div>
                    <strong>Employe :</strong>{' '}
                    {paymentModal.finance?.employeeSnapshot?.name ||
                      paymentModal.employee?.name}
                  </div>
                  <div>
                    <strong>Montant :</strong>{' '}
                    {formatMoney(paymentModal.finance?.total)}{' '}
                    {paymentModal.finance?.currency || 'DZD'}
                  </div>
                </div>

                <div className="finance-filters" style={{ marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Reference de paiement</label>
                    <input
                      className="input"
                      placeholder="Ex: VIR-2025-00123"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Note (optionnel)</label>
                    <input
                      className="input"
                      placeholder="Note de paiement"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end'
                  }}
                >
                  <button
                    className="btn"
                    type="button"
                    onClick={markAsPaid}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <Loader2 className="spinning" size={16} />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Confirmer
                  </button>
                  <button
                    className="btn subtle"
                    type="button"
                    onClick={closePaymentModal}
                  >
                    <X size={16} />
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB: FACTURES HOTELS */}
        {activeTab === 'factures' && (
          <>
            <div className="grid-kpi" style={{ marginBottom: '1rem' }}>
              <KPI
                label="En attente"
                value={factureStats.enAttente?.count || 0}
                hint={`${formatMoney(factureStats.enAttente?.total || 0)} DZD`}
                variant="pending"
                icon={Clock}
              />
              <KPI
                label="Validees"
                value={factureStats.validees?.count || 0}
                hint={`${formatMoney(factureStats.validees?.total || 0)} DZD`}
                variant="total"
                icon={CheckCircle}
              />
              <KPI
                label="Payees"
                value={factureStats.payees?.count || 0}
                hint={`${formatMoney(factureStats.payees?.total || 0)} DZD`}
                variant="success"
                icon={CreditCard}
              />
              <KPI
                label="Rejetees"
                value={factureStats.rejetees?.count || 0}
                hint={`${formatMoney(factureStats.rejetees?.total || 0)} DZD`}
                variant="error"
                icon={Ban}
              />
            </div>

            {/* Add Facture Form */}
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div
                className="section-header"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowForm(!showForm)}
              >
                <h2 className="section-title">
                  {showForm ? (
                    <>
                      <Receipt size={18} />
                      Nouvelle facture
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Ajouter une facture
                    </>
                  )}
                </h2>
                <button className="btn subtle" type="button">
                  {showForm ? <X size={16} /> : <Plus size={16} />}
                </button>
              </div>

              {showForm && (
                <form
                  onSubmit={createFacture}
                  style={{ marginTop: '1rem' }}
                  className="facture-form"
                >
                  <div className="finance-filters">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Hotel</label>
                      <select
                        className="input"
                        value={factureForm.hotel}
                        onChange={(e) =>
                          setFactureForm({ ...factureForm, hotel: e.target.value })
                        }
                        required
                      >
                        <option value="">Selectionner un hotel</option>
                        {hotels.map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.name} - {h.city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Numero de facture</label>
                      <input
                        className="input"
                        placeholder="FAC-2025-001"
                        value={factureForm.numeroFacture}
                        onChange={(e) =>
                          setFactureForm({
                            ...factureForm,
                            numeroFacture: e.target.value
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="finance-filters">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Date facture</label>
                      <input
                        className="input"
                        type="date"
                        value={factureForm.dateFacture}
                        onChange={(e) =>
                          setFactureForm({
                            ...factureForm,
                            dateFacture: e.target.value
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Montant</label>
                      <input
                        className="input"
                        type="number"
                        placeholder="0"
                        value={factureForm.montant}
                        onChange={(e) =>
                          setFactureForm({ ...factureForm, montant: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 0.5 }}>
                      <label className="form-label">Devise</label>
                      <select
                        className="input"
                        value={factureForm.devise}
                        onChange={(e) =>
                          setFactureForm({ ...factureForm, devise: e.target.value })
                        }
                      >
                        <option value="DZD">DZD</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Observations</label>
                    <textarea
                      className="input"
                      placeholder="Observations (optionnel)"
                      rows={2}
                      value={factureForm.observations}
                      onChange={(e) =>
                        setFactureForm({
                          ...factureForm,
                          observations: e.target.value
                        })
                      }
                    />
                  </div>
                  <button
                    className="btn"
                    type="submit"
                    disabled={factureLoading}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    {factureLoading ? (
                      <Loader2 className="spinning" size={16} />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Enregistrer
                  </button>
                </form>
              )}
            </div>

            {/* Factures List */}
            <div className="card">
              <div className="section-header">
                <h2 className="section-title">Liste des factures</h2>
              </div>

              <div className="finance-filters" style={{ marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <div className="input-group">
                    <Search className="input-icon" size={16} />
                    <input
                      className="input input-with-icon"
                      placeholder="Rechercher (hotel, numero...)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <select
                    className="input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="VALIDEE">Validee</option>
                    <option value="PAYEE">Payee</option>
                    <option value="REJETEE">Rejetee</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <select
                    className="input"
                    value={hotelFilter}
                    onChange={(e) => setHotelFilter(e.target.value)}
                  >
                    <option value="ALL">Tous les hotels</option>
                    {uniqueHotels.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="finance-filters" style={{ marginBottom: '0.75rem' }}>
                <DateRangeFilter
                  startDate={factureStartDate}
                  endDate={factureEndDate}
                  onStartDateChange={setFactureStartDate}
                  onEndDateChange={setFactureEndDate}
                  onClear={() => { setFactureStartDate(''); setFactureEndDate(''); }}
                  label="Date facture"
                />
              </div>

              {loading ? (
                <div className="loading-container">
                  <Loader2
                    className="spinning"
                    size={28}
                    style={{ color: 'var(--accent)' }}
                  />
                  <span className="text-muted">Chargement...</span>
                </div>
              ) : (
                <Table
                  columns={[
                    { key: 'numeroFacture', title: 'N Facture', sortable: true },
                    {
                      key: 'hotel',
                      title: 'Hotel',
                      sortable: true,
                      sortValue: (v, row) => row.hotel?.name || '',
                      render: (v, row) => row.hotel?.name || '-'
                    },
                    {
                      key: 'dateFacture',
                      title: 'Date',
                      sortable: true,
                      render: (v) => (v ? formatDate(v) : '-')
                    },
                    {
                      key: 'montant',
                      title: 'Montant',
                      sortable: true,
                      render: (v, row) =>
                        v ? `${formatMoney(v)} ${row.devise || 'DZD'}` : '-'
                    },
                    {
                      key: 'statut',
                      title: 'Statut',
                      sortable: true,
                      render: (v) => (
                        <span className={'badge ' + getStatutBadgeClass(v)}>
                          {getStatutLabel(v)}
                        </span>
                      )
                    },
                    {
                      key: '_id',
                      title: 'Action',
                      render: (v, row) => (
                        <button
                          className="btn"
                          type="button"
                          onClick={() => openEditModal(row)}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          Traiter
                        </button>
                      )
                    }
                  ]}
                  data={filteredFactures}
                />
              )}
            </div>

            {/* Edit Facture Modal */}
            {editingFacture && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="section-header">
                  <h2 className="section-title">
                    <Receipt size={18} />
                    Traitement facture
                  </h2>
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <div>
                    <strong>Numero :</strong> {editingFacture.numeroFacture}
                  </div>
                  <div>
                    <strong>Hotel :</strong> {editingFacture.hotel?.name}
                  </div>
                  <div>
                    <strong>Montant :</strong> {formatMoney(editingFacture.montant)}{' '}
                    {editingFacture.devise}
                  </div>
                </div>

                <div className="finance-filters" style={{ marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Statut</label>
                    <select
                      className="input"
                      value={editStatut}
                      onChange={(e) => setEditStatut(e.target.value)}
                    >
                      <option value="EN_ATTENTE">En attente</option>
                      <option value="VALIDEE">Validee</option>
                      <option value="PAYEE">Payee</option>
                      <option value="REJETEE">Rejetee</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">N Bon de paiement</label>
                    <input
                      className="input"
                      placeholder="Numero bon paiement"
                      value={editNumeroBonPaiement}
                      onChange={(e) => setEditNumeroBonPaiement(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Observations</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={editObservations}
                    onChange={(e) => setEditObservations(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end'
                  }}
                >
                  <button
                    className="btn"
                    type="button"
                    onClick={saveFacture}
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <Loader2 className="spinning" size={16} />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Enregistrer
                  </button>
                  <button
                    className="btn subtle"
                    type="button"
                    onClick={closeEditModal}
                  >
                    <X size={16} />
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
