import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Requests() {
  const { headers } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    destination: '',
    city: '',
    country: 'Algérie',
    startDate: '',
    endDate: '',
    motif: '',
    extraRequests: '',
    suggestedHotelName: '',
    suggestedHotelCity: '',
    suggestedHotelNotes: '',
    participants: '' 
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () =>
    axios
      .get(API + '/api/requests', { headers })
      .then(({ data }) => setRows(data.data || data))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
    for (const f of files) fd.append('attachments', f);

    try {
      await axios.post(API + '/api/requests', fd, {
        headers,
        maxBodyLength: Infinity
      });
      setForm({
        destination: '',
        city: '',
        country: 'Algérie',
        startDate: '',
        endDate: '',
        motif: '',
        extraRequests: '',
        suggestedHotelName: '',
        suggestedHotelCity: '',
        suggestedHotelNotes: '',
        participants: ''
      });
      setFiles([]);
      load();
    } catch (e2) {
      alert(
        e2?.response?.data?.message ||
          "Erreur lors de la création de la demande d'hébergement"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Nav />
      <div className="wrapper" style={{ maxWidth: '900px' }}>
        <form
          onSubmit={submit}
          className="card"
          style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Nouvelle demande d'hébergement
            </div>
            <div
              className="text-muted"
              style={{ fontSize: '0.78rem', marginTop: '0.1rem' }}
            >
              Motif, localisation, période, suggestion d'hôtel et éventuelle
              réservation groupée.
            </div>
          </div>

          <input
            className="input"
            placeholder="Destination / motif court"
            value={form.destination}
            onChange={e =>
              setForm({ ...form, destination: e.target.value })
            }
          />

          <div className="form-grid-2">
            <input
              className="input"
              placeholder="Ville"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
            />
            <input
              className="input"
              placeholder="Pays"
              value={form.country}
              onChange={e => setForm({ ...form, country: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <input
              className="input"
              type="date"
              value={form.startDate}
              onChange={e =>
                setForm({ ...form, startDate: e.target.value })
              }
            />
            <input
              className="input"
              type="date"
              value={form.endDate}
              onChange={e =>
                setForm({ ...form, endDate: e.target.value })
              }
            />
          </div>

          <textarea
            className="input"
            rows={3}
            placeholder="Motif détaillé / contraintes opérationnelles"
            value={form.motif}
            onChange={e => setForm({ ...form, motif: e.target.value })}
          />

          <textarea
            className="input"
            rows={2}
            placeholder="Demandes complémentaires (horaires, remarques, etc.)"
            value={form.extraRequests}
            onChange={e =>
              setForm({ ...form, extraRequests: e.target.value })
            }
          />

         
          <div
            style={{
              marginTop: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            Suggestion d'hôtel (optionnel)
          </div>
          <div className="form-grid-2">
            <input
              className="input"
              placeholder="Hôtel souhaité (nom)"
              value={form.suggestedHotelName}
              onChange={e =>
                setForm({ ...form, suggestedHotelName: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Ville de l'hôtel souhaité"
              value={form.suggestedHotelCity}
              onChange={e =>
                setForm({ ...form, suggestedHotelCity: e.target.value })
              }
            />
          </div>
          <textarea
            className="input"
            rows={2}
            placeholder="Remarques sur l'hôtel souhaité (proximité, préférence, etc.)"
            value={form.suggestedHotelNotes}
            onChange={e =>
              setForm({ ...form, suggestedHotelNotes: e.target.value })
            }
          />

          
          <div
            style={{
              marginTop: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            Réservation groupée (optionnel)
          </div>
          <input
            className="input"
            placeholder="Matricules des autres agents (séparés par des virgules)"
            value={form.participants}
            onChange={e =>
              setForm({ ...form, participants: e.target.value })
            }
          />

          {/* FICHIERS */}
          <input
            className="input"
            type="file"
            multiple
            onChange={e => setFiles([...e.target.files])}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '0.2rem'
            }}
          >
            <button className="btn" disabled={loading}>
              {loading ? 'Envoi...' : 'Soumettre la demande'}
            </button>
          </div>
        </form>

        
        <div className="card">
          <div
            style={{
              fontSize: '0.95rem',
              marginBottom: '0.5rem',
              fontWeight: 600
            }}
          >
            Mes demandes
          </div>
          <Table
            columns={[
              { key: 'destination', title: 'Destination' },
              { key: 'city', title: 'Ville' },
              {
                key: 'startDate',
                title: 'Début',
                render: v =>
                  v ? new Date(v).toLocaleDateString() : ''
              },
              {
                key: 'endDate',
                title: 'Fin',
                render: v =>
                  v ? new Date(v).toLocaleDateString() : ''
              },
              {
                key: 'status',
                title: 'Statut',
                render: v => (
                  <span className={`badge status-${v}`}>{v}</span>
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