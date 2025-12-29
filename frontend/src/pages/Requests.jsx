import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';
import { toast } from 'sonner';
import {
  FileText,
  MapPin,
  Calendar,
  Building,
  Users,
  Upload,
  Send,
  Loader2,
  FileCheck,
  Globe,
  MessageSquare,
  Hotel
} from 'lucide-react';

const API = '';

export default function Requests() {
  const { headers } = useAuth();
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [form, setForm] = useState({
    destination: '',
    city: '',
    country: 'Algerie',
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

  const load = () => {
    setLoadingData(true);
    axios
      .get(API + '/api/requests', { headers })
      .then(({ data }) => {
        setRows(data.data || data);
        setLoadingData(false);
      })
      .catch(() => {
        setLoadingData(false);
      });
  };

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
      toast.success('Demande soumise', {
        description: 'Votre demande a ete envoyee pour validation manager'
      });
      setForm({
        destination: '',
        city: '',
        country: 'Algerie',
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
      toast.error('Erreur', {
        description: e2?.response?.data?.message || "Erreur lors de la creation de la demande"
      });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="wrapper" style={{ maxWidth: '900px' }}>
        {/* Form Card */}
        <form onSubmit={submit} className="card request-form">
          <div className="form-header">
            <div className="form-icon">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="form-title">Nouvelle demande d'hebergement</h2>
              <p className="form-subtitle">
                Motif, localisation, periode, suggestion d'hotel et reservation groupee
              </p>
            </div>
          </div>

          {/* Destination */}
          <div className="form-section">
            <div className="input-group">
              <MapPin className="input-icon" size={16} />
              <input
                className="input input-with-icon"
                placeholder="Destination / motif court"
                value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Ville</label>
                <input
                  className="input"
                  placeholder="Ville de destination"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pays</label>
                <input
                  className="input"
                  placeholder="Pays"
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="form-section">
            <label className="form-section-label">
              <Calendar size={14} />
              Periode de sejour
            </label>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Date debut</label>
                <input
                  className="input"
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date fin</label>
                <input
                  className="input"
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Motif */}
          <div className="form-section">
            <label className="form-section-label">
              <MessageSquare size={14} />
              Details de la mission
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Motif detaille / contraintes operationnelles"
              value={form.motif}
              onChange={e => setForm({ ...form, motif: e.target.value })}
            />
            <textarea
              className="input"
              rows={2}
              placeholder="Demandes complementaires (horaires, remarques, etc.)"
              value={form.extraRequests}
              onChange={e => setForm({ ...form, extraRequests: e.target.value })}
            />
          </div>

          {/* Hotel Suggestion */}
          <div className="form-section form-section-optional">
            <label className="form-section-label">
              <Hotel size={14} />
              Suggestion d'hotel
              <span className="optional-tag">Optionnel</span>
            </label>
            <div className="form-grid-2">
              <input
                className="input"
                placeholder="Nom de l'hotel souhaite"
                value={form.suggestedHotelName}
                onChange={e => setForm({ ...form, suggestedHotelName: e.target.value })}
              />
              <input
                className="input"
                placeholder="Ville de l'hotel"
                value={form.suggestedHotelCity}
                onChange={e => setForm({ ...form, suggestedHotelCity: e.target.value })}
              />
            </div>
            <textarea
              className="input"
              rows={2}
              placeholder="Remarques sur l'hotel (proximite, preferences, etc.)"
              value={form.suggestedHotelNotes}
              onChange={e => setForm({ ...form, suggestedHotelNotes: e.target.value })}
            />
          </div>

          {/* Group Reservation */}
          <div className="form-section form-section-optional">
            <label className="form-section-label">
              <Users size={14} />
              Reservation groupee
              <span className="optional-tag">Optionnel</span>
            </label>
            <input
              className="input"
              placeholder="Matricules des autres agents (separes par des virgules)"
              value={form.participants}
              onChange={e => setForm({ ...form, participants: e.target.value })}
            />
          </div>

          {/* File Upload */}
          <div className="form-section">
            <label className="form-section-label">
              <Upload size={14} />
              Pieces jointes
            </label>
            <div className="file-upload-area">
              <input
                className="file-input"
                id="file-upload"
                type="file"
                multiple
                onChange={e => setFiles([...e.target.files])}
              />
              <label htmlFor="file-upload" className="file-upload-label">
                <Upload size={20} />
                <span>Cliquer pour ajouter des fichiers</span>
                {files.length > 0 && (
                  <span className="file-count">{files.length} fichier(s) selectionne(s)</span>
                )}
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button className="btn btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spinning" size={16} />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Soumettre la demande
                </>
              )}
            </button>
          </div>
        </form>

        {/* My Requests Table */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">
              <FileCheck size={18} />
              Mes demandes
            </h2>
          </div>

          {loadingData ? (
            <div className="loading-container">
              <Loader2 className="spinning" size={28} style={{ color: 'var(--accent)' }} />
              <span className="text-muted">Chargement...</span>
            </div>
          ) : (
            <Table
              columns={[
                { key: 'destination', title: 'Destination', sortable: true },
                { key: 'city', title: 'Ville', sortable: true },
                {
                  key: 'startDate',
                  title: 'Debut',
                  sortable: true,
                  render: v => v ? new Date(v).toLocaleDateString('fr-FR') : '-'
                },
                {
                  key: 'endDate',
                  title: 'Fin',
                  sortable: true,
                  render: v => v ? new Date(v).toLocaleDateString('fr-FR') : '-'
                },
                {
                  key: 'status',
                  title: 'Statut',
                  sortable: true,
                  render: v => (
                    <span className={`badge status-${v}`}>{getStatusLabel(v)}</span>
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
