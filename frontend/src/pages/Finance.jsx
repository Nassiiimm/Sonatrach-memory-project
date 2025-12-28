import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import KPI from '../components/KPI.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Finance() {
  const { headers } = useAuth();

  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentRow, setCurrentRow] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('NON_PAYE');
  const [paymentDate, setPaymentDate] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hotelFilter, setHotelFilter] = useState('ALL');

  const load = () =>
    axios
      .get(API + '/api/requests', { headers, params: { status: 'EFFECTUEE' } })
      .then(({ data }) => setRows(data.data))
      .catch(() => setRows([]));

  useEffect(() => {
    load();
  }, []);

  const openModal = r => {
    setEditingId(r._id);
    setCurrentRow(r);
    setPaymentStatus(r.finance?.paymentStatus || 'NON_PAYE');
    setPaymentDate(
      r.finance?.paymentDate
        ? new Date(r.finance.paymentDate).toISOString().slice(0, 10)
        : ''
    );
  };

  const closeModal = () => {
    setEditingId(null);
    setCurrentRow(null);
    setPaymentStatus('NON_PAYE');
    setPaymentDate('');
  };

  const savePayment = async () => {
    if (!editingId) return;
    try {
      await axios.patch(
        API + '/api/finance/' + editingId + '/validate',
        {
          paymentStatus,
          paymentDate: paymentDate || null
        },
        { headers }
      );
      alert('Informations de paiement mises à jour.');
      closeModal();
      load();
    } catch (e) {
      alert(
        e.response?.data?.message ||
          'Erreur lors de la mise à jour du paiement'
      );
    }
  };

  // 🔹 Télécharger le BC en PDF
  const downloadBC = async (id, poNumber) => {
    try {
      const response = await axios.get(`${API}/api/requests/${id}/bc`, {
        headers,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (poNumber ? poNumber : `BC-${id.slice(-8)}`) + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(
        e?.response?.data?.message ||
          'Erreur lors du téléchargement du BC PDF'
      );
    }
  };

  const uniqueHotels = useMemo(() => {
    const set = new Set();
    rows.forEach(r => {
      if (r.relex?.hotel?.name) set.add(r.relex.hotel.name);
    });
    return Array.from(set);
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const text = (
        (r.employee?.name || '') +
        ' ' +
        (r.destination || '') +
        ' ' +
        (r.city || '') +
        ' ' +
        (r.relex?.hotel?.name || '')
      )
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

      const q = search
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

      if (q && !text.includes(q)) return false;

      if (statusFilter !== 'ALL') {
        const st = r.finance?.paymentStatus || 'NON_PAYE';
        if (st !== statusFilter) return false;
      }

      if (hotelFilter !== 'ALL') {
        if (r.relex?.hotel?.name !== hotelFilter) return false;
      }

      return true;
    });
  }, [rows, search, statusFilter, hotelFilter]);

  const kpis = useMemo(() => {
    const totalBc = rows.length;
    const paid = rows.filter(r => r.finance?.paymentStatus === 'PAYE').length;
    const unpaid = rows.filter(r => r.finance?.paymentStatus !== 'PAYE')
      .length;
    const totalAmount = rows.reduce(
      (acc, r) => acc + (r.finance?.total || 0),
      0
    );

    return {
      totalBc,
      paid,
      unpaid,
      totalAmount
    };
  }, [rows]);

  const exportCsv = () => {
    if (!filteredRows.length) {
      alert('Aucune ligne à exporter avec les filtres actuels.');
      return;
    }

    const headers = [
      'Employé',
      'Destination',
      'Ville',
      'Hôtel',
      'BC',
      'Montant',
      'Devise',
      'Statut paiement',
      'Date paiement'
    ];

    const lines = filteredRows.map(r => {
      const cols = [
        r.employee?.name || '',
        r.destination || '',
        r.city || '',
        r.relex?.hotel?.name || '',
        r.finance?.poNumber || '',
        r.finance?.total != null ? String(r.finance.total) : '',
        r.finance?.currency || 'DZD',
        r.finance?.paymentStatus === 'PAYE' ? 'PAYE' : 'NON_PAYE',
        r.finance?.paymentDate
          ? new Date(r.finance.paymentDate).toLocaleDateString()
          : ''
      ];
      return cols
        .map(v => '"' + String(v).replace(/"/g, '""') + '"')
        .join(';');
    });

    const csvContent = ['\ufeff' + headers.join(';'), ...lines].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bc-finance.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Nav />
      <div className="wrapper" style={{ maxWidth: '1100px' }}>
        <div className="grid-kpi" style={{ marginBottom: '1rem' }}>
          <KPI
            label="Bons de commande"
            value={kpis.totalBc}
            hint="Réservations passées par Relex"
          />
          <KPI
            label="BC payés"
            value={kpis.paid}
            hint="Marqués comme PAYE par Finance"
          />
          <KPI
            label="BC en attente"
            value={kpis.unpaid}
            hint="Suivi des créances hébergement"
          />
          <KPI
            label="Montant cumulé"
            value={
              kpis.totalAmount
                ? kpis.totalAmount.toLocaleString('fr-DZ', {
                    maximumFractionDigits: 2
                  }) + ' DZD'
                : '—'
            }
            hint="Somme des montants engagés"
          />
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Base des bons de commande (en temps réel)
            </div>
            <button className="btn subtle" type="button" onClick={exportCsv}>
              Exporter en CSV
            </button>
          </div>
          <div
            className="form-grid-2"
            style={{
              gap: '0.5rem',
              marginBottom: '0.5rem',
              gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(0,1fr))'
            }}
          >
            <input
              className="input"
              placeholder="Rechercher (employé, destination, ville, hôtel)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="NON_PAYE">Non payé</option>
              <option value="PAYE">Payé</option>
            </select>
            <select
              className="input"
              value={hotelFilter}
              onChange={e => setHotelFilter(e.target.value)}
            >
              <option value="ALL">Tous les hôtels</option>
              {uniqueHotels.map(h => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <Table
            columns={[
              {
                key: 'employee',
                title: 'Employé',
                render: (v, row) => row.employee?.name
              },
              { key: 'destination', title: 'Destination' },
              { key: 'city', title: 'Ville' },
              {
                key: 'relex.hotel',
                title: 'Hôtel',
                render: (v, row) => row.relex?.hotel?.name
              },
              {
                key: 'finance.poNumber',
                title: 'BC',
                render: (v, row) => row.finance?.poNumber || '—'
              },
              {
                key: 'finance.total',
                title: 'Montant',
                render: (v, row) =>
                  row.finance?.total
                    ? row.finance.total +
                      ' ' +
                      (row.finance.currency || 'DZD')
                    : '—'
              },
              {
                key: 'finance.paymentStatus',
                title: 'Paiement',
                render: (v, row) => (
                  <span
                    className={
                      'badge ' +
                      (row.finance?.paymentStatus === 'PAYE'
                        ? 'status-EFFECTUEE'
                        : '')
                    }
                  >
                    {row.finance?.paymentStatus === 'PAYE'
                      ? 'Payé'
                      : 'Non payé'}
                  </span>
                )
              },
              // 🔹 Nouvelle colonne : BC PDF
              {
                key: 'bcPdf',
                title: 'BC PDF',
                render: (v, row) =>
                  row.finance ? (
                    <button
                      className="btn subtle"
                      type="button"
                      onClick={() =>
                        downloadBC(row._id, row.finance?.poNumber)
                      }
                    >
                      PDF
                    </button>
                  ) : (
                    '—'
                  )
              },
              {
                key: '_id',
                title: 'Action',
                render: (v, row) => (
                  <button
                    className="btn"
                    type="button"
                    onClick={() => openModal(row)}
                  >
                    Paiement
                  </button>
                )
              }
            ]}
            data={filteredRows}
          />
        </div>

        {editingId && currentRow && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                marginBottom: '0.3rem'
              }}
            >
              Suivi du paiement
            </div>
            <div
              className="text-muted"
              style={{ fontSize: '0.78rem', marginBottom: '0.5rem' }}
            >
              Bon de commande généré automatiquement après la réservation par
              Relex.
            </div>
            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <div>
                <strong>Employé :</strong> {currentRow.employee?.name}
              </div>
              <div>
                <strong>Hôtel :</strong> {currentRow.relex?.hotel?.name}
              </div>
              <div>
                <strong>Ville :</strong> {currentRow.city}
              </div>
              <div>
                <strong>Dates :</strong>{' '}
                {currentRow.relex?.finalStartDate
                  ? new Date(
                      currentRow.relex.finalStartDate
                    ).toLocaleDateString()
                  : ''}
                {' → '}
                {currentRow.relex?.finalEndDate
                  ? new Date(
                      currentRow.relex.finalEndDate
                    ).toLocaleDateString()
                  : ''}
              </div>
              <div>
                <strong>BC :</strong> {currentRow.finance?.poNumber || '—'}
              </div>
              <div>
                <strong>Montant :</strong>{' '}
                {currentRow.finance?.total
                  ? currentRow.finance.total +
                    ' ' +
                    (currentRow.finance.currency || 'DZD')
                  : '—'}
              </div>
            </div>
            <div className="form-grid-2">
              <div>
                <div
                  className="text-muted"
                  style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}
                >
                  Statut de paiement
                </div>
                <select
                  className="input"
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                >
                  <option value="NON_PAYE">Non payé</option>
                  <option value="PAYE">Payé</option>
                </select>
              </div>
              <div>
                <div
                  className="text-muted"
                  style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}
                >
                  Date de paiement
                </div>
                <input
                  className="input"
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                className="btn subtle"
                type="button"
                onClick={() =>
                  downloadBC(
                    currentRow._id,
                    currentRow.finance?.poNumber
                  )
                }
              >
                Télécharger le BC PDF
              </button>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'flex-end',
                  flex: 1
                }}
              >
                <button
                  className="btn"
                  type="button"
                  onClick={savePayment}
                >
                  Enregistrer
                </button>
                <button
                  className="btn subtle"
                  type="button"
                  onClick={closeModal}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}