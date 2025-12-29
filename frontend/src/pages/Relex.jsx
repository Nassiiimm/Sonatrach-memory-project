import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';
import { toast } from 'sonner';
import {
  Building,
  Hotel,
  Calendar,
  Settings2,
  CheckCircle,
  X,
  Loader2,
  BedDouble,
  UtensilsCrossed
} from 'lucide-react';

import { API_URL } from '../config.js';
const API = API_URL;

export default function Relex() {
  const { headers } = useAuth();
  const [rows, setRows] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    hotelId: '',
    formula: 'SEJOUR_SIMPLE',
    finalStartDate: '',
    finalEndDate: '',
    comment: '',
    roomType: '',
    allowCancellation: false,
    allowHotelChange: false,
    isLateReservation: false,
    isPostStayEntry: false
  });

  const load = () => {
    setLoading(true);
    axios
      .get(API + '/api/requests', {
        headers,
        params: { status: 'EN_ATTENTE_RELEX' }
      })
      .then(({ data }) => {
        setRows(data.data || data);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    axios
      .get(API + '/api/hotels', { headers })
      .then(({ data }) => setHotels(data.data || data))
      .catch(() => {});
  }, []);

  const resetForm = () =>
    setForm({
      hotelId: '',
      formula: 'SEJOUR_SIMPLE',
      finalStartDate: '',
      finalEndDate: '',
      comment: '',
      roomType: '',
      allowCancellation: false,
      allowHotelChange: false,
      isLateReservation: false,
      isPostStayEntry: false
    });

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch(API + '/api/requests/' + editId + '/relex', form, {
        headers
      });
      toast.success('Reservation confirmee', {
        description: 'Le bon de commande a ete genere'
      });
      setEditId(null);
      resetForm();
      load();
    } catch (e) {
      toast.error('Erreur', {
        description:
          e?.response?.data?.message || 'Erreur lors de la reservation'
      });
    } finally {
      setSaving(false);
    }
  };

  const onConfigure = (row) => {
    setEditId(row._id);
    setForm({
      hotelId: row.relex?.hotel?._id || '',
      formula: row.relex?.formula || 'SEJOUR_SIMPLE',
      finalStartDate:
        (row.relex?.finalStartDate || row.startDate || '')?.slice(0, 10) || '',
      finalEndDate:
        (row.relex?.finalEndDate || row.endDate || '')?.slice(0, 10) || '',
      comment: row.relex?.comment || '',
      roomType: row.relex?.roomType || '',
      allowCancellation: row.relex?.options?.allowCancellation || false,
      allowHotelChange: row.relex?.options?.allowHotelChange || false,
      isLateReservation: row.relex?.options?.isLateReservation || false,
      isPostStayEntry: row.relex?.options?.isPostStayEntry || false
    });
  };

  return (
    <div>
      <Nav />
      <div className="wrapper" style={{ maxWidth: '1100px' }}>
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            <Building size={24} style={{ color: 'var(--accent)' }} />
            Gestion Relex
          </h1>
          <p className="page-subtitle">
            Selection des hotels et generation des bons de commande
          </p>
        </div>

        {/* Configuration Form */}
        {editId && (
          <div className="card relex-form-card">
            <div className="relex-form-header">
              <div className="form-icon">
                <Hotel size={18} />
              </div>
              <div>
                <h3 className="admin-card-title">Selection hotel & prise en charge</h3>
                <p className="admin-card-subtitle">
                  Choix de l'etablissement, formule, type de chambre et options
                </p>
              </div>
            </div>

            <div className="relex-form-content">
              {/* Hotel & Formula */}
              <div className="form-group">
                <label className="form-label">Hotel</label>
                <select
                  className="input"
                  value={form.hotelId}
                  onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
                >
                  <option value="">— choisir hotel —</option>
                  {hotels.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} · {h.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relex-form-row">
                <div className="form-group">
                  <label className="form-label">
                    <UtensilsCrossed size={12} /> Formule
                  </label>
                  <select
                    className="input"
                    value={form.formula}
                    onChange={(e) => setForm({ ...form, formula: e.target.value })}
                  >
                    <option value="SEJOUR_SIMPLE">Sejour simple</option>
                    <option value="FORMULE_REPAS">Formule repas</option>
                    <option value="DEMI_PENSION">Demi-pension</option>
                    <option value="PENSION_COMPLETE">Pension complete</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <BedDouble size={12} /> Type chambre
                  </label>
                  <select
                    className="input"
                    value={form.roomType}
                    onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                  >
                    <option value="">— type de chambre —</option>
                    <option value="SINGLE">Single</option>
                    <option value="DOUBLE">Double</option>
                    <option value="SUITE">Suite</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="relex-form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={12} /> Date debut
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={form.finalStartDate}
                    onChange={(e) =>
                      setForm({ ...form, finalStartDate: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={12} /> Date fin
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={form.finalEndDate}
                    onChange={(e) =>
                      setForm({ ...form, finalEndDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Comment */}
              <div className="form-group">
                <label className="form-label">Commentaire</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Commentaire pour l'hotel / contexte operationnel"
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                />
              </div>

              {/* Options */}
              <div className="relex-options">
                <label className="form-label">
                  <Settings2 size={12} /> Options
                </label>
                <div className="relex-options-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!form.allowCancellation}
                      onChange={(e) =>
                        setForm({ ...form, allowCancellation: e.target.checked })
                      }
                    />
                    Annulation possible
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!form.allowHotelChange}
                      onChange={(e) =>
                        setForm({ ...form, allowHotelChange: e.target.checked })
                      }
                    />
                    Changement hotel autorise
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!form.isLateReservation}
                      onChange={(e) =>
                        setForm({ ...form, isLateReservation: e.target.checked })
                      }
                    />
                    Reservation tardive
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!form.isPostStayEntry}
                      onChange={(e) =>
                        setForm({ ...form, isPostStayEntry: e.target.checked })
                      }
                    />
                    Saisie post-hebergement
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="relex-form-actions">
                <button className="btn" onClick={save} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="spinning" size={16} />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirmer la reservation
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn subtle"
                  onClick={() => {
                    setEditId(null);
                    resetForm();
                  }}
                >
                  <X size={16} />
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Demandes a traiter</h2>
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
                  render: (v, row) => row.employee?.name || '-'
                },
                { key: 'destination', title: 'Destination' },
                { key: 'city', title: 'Ville' },
                {
                  key: 'relex',
                  title: 'Hotel selectionne',
                  render: (v, row) => row.relex?.hotel?.name || '-'
                },
                {
                  key: 'status',
                  title: 'Statut',
                  render: (v) => <span className={`badge status-${v}`}>{v}</span>
                },
                {
                  key: '_id',
                  title: 'Action',
                  render: (v, row) => (
                    <button
                      className="btn"
                      onClick={() => onConfigure(row)}
                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                    >
                      <Settings2 size={14} />
                      Configurer
                    </button>
                  )
                }
              ]}
              data={rows}
            />
          )}
        </div>
      </div>
    </div>
  );
}
