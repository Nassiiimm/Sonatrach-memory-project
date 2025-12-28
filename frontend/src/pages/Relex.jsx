import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Relex() {
  const { headers } = useAuth();
  const [rows, setRows] = useState([]);
  const [hotels, setHotels] = useState([]);
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

  const load = () =>
    axios
      .get(API + '/api/requests', {
        headers,
        params: { status: 'EN_ATTENTE_RELEX' }
      })
      .then(({ data }) => setRows(data.data || data))
      .catch(() => {});

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
    try {
      await axios.patch(
        API + '/api/requests/' + editId + '/relex',
        form,
        { headers }
      );
      setEditId(null);
      resetForm();
      load();
    } catch (e) {
      alert(
        e?.response?.data?.message ||
          'Erreur lors de la réservation / génération du BC'
      );
    }
  };

  const onConfigure = row => {
    setEditId(row._id);
    setForm({
      hotelId: row.relex?.hotel?._id || '',
      formula: row.relex?.formula || 'SEJOUR_SIMPLE',
      finalStartDate:
        (row.relex?.finalStartDate || row.startDate || '')
          ?.slice(0, 10) || '',
      finalEndDate:
        (row.relex?.finalEndDate || row.endDate || '')
          ?.slice(0, 10) || '',
      comment: row.relex?.comment || '',
      roomType: row.relex?.roomType || '',
      allowCancellation:
        row.relex?.options?.allowCancellation || false,
      allowHotelChange:
        row.relex?.options?.allowHotelChange || false,
      isLateReservation:
        row.relex?.options?.isLateReservation || false,
      isPostStayEntry:
        row.relex?.options?.isPostStayEntry || false
    });
  };

  return (
    <div>
      <Nav />
      <div className="wrapper" style={{ maxWidth: '1100px' }}>
        {/* FORMULAIRE RELEX / BC */}
        {editId && (
          <div
            className="card"
            style={{
              marginBottom: '1rem',
              display: 'grid',
              gap: '0.5rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                Sélection hôtel & prise en charge
              </div>
              <div
                className="text-muted"
                style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}
              >
                Choix de l'établissement, de la formule, du type de
                chambre et des options (annulation, changement, tardif,
                post-hébergement). Ces informations servent de base au
                bon de commande Finance.
              </div>
            </div>

            <select
              className="input"
              value={form.hotelId}
              onChange={e =>
                setForm({ ...form, hotelId: e.target.value })
              }
            >
              <option value="">— choisir hôtel —</option>
              {hotels.map(h => (
                <option key={h._id} value={h._id}>
                  {h.name} · {h.city}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={form.formula}
              onChange={e =>
                setForm({ ...form, formula: e.target.value })
              }
            >
              <option value="SEJOUR_SIMPLE">Séjour simple</option>
              <option value="FORMULE_REPAS">Formule repas</option>
              <option value="DEMI_PENSION">Demi-pension</option>
              <option value="PENSION_COMPLETE">Pension complète</option>
            </select>

            {/* TYPE DE CHAMBRE */}
            <select
              className="input"
              value={form.roomType}
              onChange={e =>
                setForm({ ...form, roomType: e.target.value })
              }
            >
              <option value="">— type de chambre —</option>
              <option value="SINGLE">Single</option>
              <option value="DOUBLE">Double</option>
              <option value="SUITE">Suite</option>
            </select>

            <div className="form-grid-2">
              <input
                className="input"
                type="date"
                value={form.finalStartDate}
                onChange={e =>
                  setForm({
                    ...form,
                    finalStartDate: e.target.value
                  })
                }
              />
              <input
                className="input"
                type="date"
                value={form.finalEndDate}
                onChange={e =>
                  setForm({
                    ...form,
                    finalEndDate: e.target.value
                  })
                }
              />
            </div>

            <textarea
              className="input"
              rows={2}
              placeholder="Commentaire pour l'hôtel / contexte opérationnel"
              value={form.comment}
              onChange={e =>
                setForm({ ...form, comment: e.target.value })
              }
            />

            {/* OPTIONS RELEX */}
            <div className="form-grid-2">
              <label style={{ fontSize: '0.8rem' }}>
                <input
                  type="checkbox"
                  checked={!!form.allowCancellation}
                  onChange={e =>
                    setForm({
                      ...form,
                      allowCancellation: e.target.checked
                    })
                  }
                />{' '}
                Annulation possible
              </label>
              <label style={{ fontSize: '0.8rem' }}>
                <input
                  type="checkbox"
                  checked={!!form.allowHotelChange}
                  onChange={e =>
                    setForm({
                      ...form,
                      allowHotelChange: e.target.checked
                    })
                  }
                />{' '}
                Changement d'hôtel autorisé
              </label>
            </div>
            <div className="form-grid-2">
              <label style={{ fontSize: '0.8rem' }}>
                <input
                  type="checkbox"
                  checked={!!form.isLateReservation}
                  onChange={e =>
                    setForm({
                      ...form,
                      isLateReservation: e.target.checked
                    })
                  }
                />{' '}
                Réservation tardive
              </label>
              <label style={{ fontSize: '0.8rem' }}>
                <input
                  type="checkbox"
                  checked={!!form.isPostStayEntry}
                  onChange={e =>
                    setForm({
                      ...form,
                      isPostStayEntry: e.target.checked
                    })
                  }
                />{' '}
                Saisie post-hébergement
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'flex-end'
              }}
            >
              <button className="btn" onClick={save}>
                Valider & transmettre à Finance
              </button>
              <button
                type="button"
                className="btn subtle"
                onClick={() => {
                  setEditId(null);
                  resetForm();
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* TABLEAU DES DEMANDES A TRAITER PAR RELEX */}
        <div className="card">
          <div
            style={{
              fontSize: '0.95rem',
              marginBottom: '0.5rem',
              fontWeight: 600
            }}
          >
            Demandes à traiter (Relex)
          </div>
          <Table
            columns={[
              {
                key: 'employee',
                title: 'Employé',
                render: (v, row) => row.employee?.name || '—'
              },
              { key: 'destination', title: 'Destination' },
              { key: 'city', title: 'Ville' },
              {
                key: 'relex',
                title: 'Hôtel sélectionné',
                render: (v, row) =>
                  row.relex?.hotel?.name || '—'
              },
              {
                key: 'status',
                title: 'Statut',
                render: v => (
                  <span className={`badge status-${v}`}>{v}</span>
                )
              },
              {
                key: '_id',
                title: 'Action',
                render: (v, row) => (
                  <button
                    className="btn"
                    onClick={() => onConfigure(row)}
                  >
                    Configurer
                  </button>
                )
              }
            ]}
            data={rows}
          />
        </div>
      </div>
    </div>
  );
}