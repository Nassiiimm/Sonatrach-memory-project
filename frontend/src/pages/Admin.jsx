import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';
import { toast } from 'sonner';
import {
  Settings,
  Users,
  Hotel,
  ClipboardList,
  UserPlus,
  Building2,
  Loader2,
  Mail,
  Lock,
  BadgeCheck,
  MapPin,
  Briefcase,
  DollarSign
} from 'lucide-react';

const API = '';

export default function Admin() {
  const { headers } = useAuth();
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingHotel, setLoadingHotel] = useState(false);

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYE',
    department: '',
    region: '',
    matricule: '',
    serviceImputation: '',
    regionAcronym: ''
  });

  const [hotelForm, setHotelForm] = useState({
    name: '',
    city: '',
    country: 'Algerie',
    code: '',
    provider: '',
    notes: '',
    prices: {
      simple: 0,
      demi_pension: 0,
      pension_complete: 0,
      formule_repas: 0
    }
  });

  const loadUsers = () =>
    axios
      .get(API + '/api/users', { headers })
      .then(({ data }) => setUsers(data.data || data))
      .catch(() => {});

  const loadHotels = () =>
    axios
      .get(API + '/api/hotels', { headers })
      .then(({ data }) => setHotels(data.data || data))
      .catch(() => {});

  const loadAudit = () =>
    axios
      .get(API + '/api/audit', { headers })
      .then(({ data }) => setAudit(data.data || data))
      .catch(() => {});

  useEffect(() => {
    loadUsers();
    loadHotels();
    loadAudit();
  }, []);

  const createUser = async e => {
    e.preventDefault();
    setLoadingUser(true);
    try {
      await axios.post(API + '/api/users', userForm, { headers });
      toast.success('Utilisateur cree', {
        description: `${userForm.name} a ete ajoute avec le role ${userForm.role}`
      });
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYE',
        department: '',
        region: '',
        matricule: '',
        serviceImputation: '',
        regionAcronym: ''
      });
      loadUsers();
    } catch (err) {
      toast.error('Erreur', {
        description: err?.response?.data?.message || 'Erreur lors de la creation du compte'
      });
    } finally {
      setLoadingUser(false);
    }
  };

  const createHotel = async e => {
    e.preventDefault();
    setLoadingHotel(true);
    try {
      await axios.post(API + '/api/hotels', hotelForm, { headers });
      toast.success('Hotel enregistre', {
        description: `${hotelForm.name} a ete ajoute au referentiel`
      });
      setHotelForm({
        name: '',
        city: '',
        country: 'Algerie',
        code: '',
        provider: '',
        notes: '',
        prices: {
          simple: 0,
          demi_pension: 0,
          pension_complete: 0,
          formule_repas: 0
        }
      });
      loadHotels();
    } catch (err) {
      toast.error('Erreur', {
        description: err?.response?.data?.message || "Erreur lors de l'enregistrement"
      });
    } finally {
      setLoadingHotel(false);
    }
  };

  const onChangeHotelPrice = (field, value) => {
    setHotelForm({
      ...hotelForm,
      prices: {
        ...hotelForm.prices,
        [field]: Number(value) || 0
      }
    });
  };

  return (
    <div>
      <Nav />
      <div className="wrapper">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            <Settings size={24} style={{ color: 'var(--accent)' }} />
            Administration
          </h1>
          <p className="page-subtitle">
            Gestion des comptes, des hotels contractes et suivi des actions (audit)
          </p>
        </div>

        {/* Forms Grid */}
        <div className="admin-grid">
          {/* USER FORM */}
          <div className="card admin-card">
            <div className="admin-card-header">
              <div className="admin-card-icon">
                <Users size={18} />
              </div>
              <div>
                <h3 className="admin-card-title">Comptes utilisateurs</h3>
                <p className="admin-card-subtitle">
                  Creation de comptes par role : Employe, Manager, Relex, Finance, Admin
                </p>
              </div>
            </div>

            <form onSubmit={createUser} className="admin-form">
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <input
                  className="input"
                  placeholder="Nom et prenom"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="email@sonatrach.dz"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mot de passe</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Mot de passe"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Matricule</label>
                  <input
                    className="input"
                    placeholder="123456"
                    value={userForm.matricule}
                    onChange={e => setUserForm({ ...userForm, matricule: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <input
                    className="input"
                    placeholder="HMD, HRM, OHT..."
                    value={userForm.regionAcronym}
                    onChange={e => setUserForm({ ...userForm, regionAcronym: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Departement</label>
                  <input
                    className="input"
                    placeholder="Optionnel"
                    value={userForm.department}
                    onChange={e => setUserForm({ ...userForm, department: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Service / Imputation</label>
                  <input
                    className="input"
                    placeholder="Code imputation"
                    value={userForm.serviceImputation}
                    onChange={e => setUserForm({ ...userForm, serviceImputation: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="input"
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="EMPLOYE">EMPLOYE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="RELEX">RELEX</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <button className="btn" disabled={loadingUser}>
                {loadingUser ? (
                  <>
                    <Loader2 className="spinning" size={16} />
                    Creation...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Creer le compte
                  </>
                )}
              </button>
            </form>

            <div className="admin-table-section">
              <div className="admin-table-header">
                <span>{users.length} utilisateur(s)</span>
              </div>
              <Table
                columns={[
                  { key: 'name', title: 'Nom' },
                  { key: 'email', title: 'Email' },
                  { key: 'role', title: 'Role', render: v => <span className="badge">{v}</span> },
                  { key: 'matricule', title: 'Matricule' },
                  { key: 'regionAcronym', title: 'Region' }
                ]}
                data={users}
              />
            </div>
          </div>

          {/* HOTEL FORM */}
          <div className="card admin-card">
            <div className="admin-card-header">
              <div className="admin-card-icon">
                <Hotel size={18} />
              </div>
              <div>
                <h3 className="admin-card-title">Hotels & grilles tarifaires</h3>
                <p className="admin-card-subtitle">
                  Enregistrement des etablissements partenaires et tarifs
                </p>
              </div>
            </div>

            <form onSubmit={createHotel} className="admin-form">
              <div className="form-group">
                <label className="form-label">Nom de l'hotel</label>
                <input
                  className="input"
                  placeholder="Hotel Aurassi, Sheraton..."
                  value={hotelForm.name}
                  onChange={e => setHotelForm({ ...hotelForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input
                    className="input"
                    placeholder="Alger, Oran..."
                    value={hotelForm.city}
                    onChange={e => setHotelForm({ ...hotelForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pays</label>
                  <input
                    className="input"
                    placeholder="Algerie"
                    value={hotelForm.country}
                    onChange={e => setHotelForm({ ...hotelForm, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Code contrat</label>
                  <input
                    className="input"
                    placeholder="HTL-001"
                    value={hotelForm.code}
                    onChange={e => setHotelForm({ ...hotelForm, code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chaine / Groupe</label>
                  <input
                    className="input"
                    placeholder="Optionnel"
                    value={hotelForm.provider}
                    onChange={e => setHotelForm({ ...hotelForm, provider: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-section-label" style={{ marginTop: '0.5rem' }}>
                <DollarSign size={14} />
                Tarifs par nuit (DZD)
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Sejour simple</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={hotelForm.prices.simple}
                    onChange={e => onChangeHotelPrice('simple', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Formule repas</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={hotelForm.prices.formule_repas}
                    onChange={e => onChangeHotelPrice('formule_repas', e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Demi-pension</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={hotelForm.prices.demi_pension}
                    onChange={e => onChangeHotelPrice('demi_pension', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pension complete</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={hotelForm.prices.pension_complete}
                    onChange={e => onChangeHotelPrice('pension_complete', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Periodes, contraintes de reservation..."
                  value={hotelForm.notes}
                  onChange={e => setHotelForm({ ...hotelForm, notes: e.target.value })}
                />
              </div>

              <button className="btn" disabled={loadingHotel}>
                {loadingHotel ? (
                  <>
                    <Loader2 className="spinning" size={16} />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Building2 size={16} />
                    Enregistrer l'hotel
                  </>
                )}
              </button>
            </form>

            <div className="admin-table-section">
              <div className="admin-table-header">
                <span>{hotels.length} hotel(s)</span>
              </div>
              <Table
                columns={[
                  { key: 'name', title: 'Hotel' },
                  { key: 'city', title: 'Ville' },
                  {
                    key: 'prices',
                    title: 'Tarifs (DZD)',
                    render: v =>
                      v ? (
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                          S:{v.simple} · R:{v.formule_repas} · DP:{v.demi_pension} · PC:{v.pension_complete}
                        </span>
                      ) : '-'
                  }
                ]}
                data={hotels}
              />
            </div>
          </div>
        </div>

        {/* AUDIT */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="section-header">
            <h2 className="section-title">
              <ClipboardList size={18} />
              Journal des actions (audit)
            </h2>
          </div>
          <Table
            columns={[
              {
                key: 'createdAt',
                title: 'Date',
                render: v => (v ? new Date(v).toLocaleString('fr-FR') : '-')
              },
              { key: 'action', title: 'Action' },
              { key: 'entity', title: 'Entite' },
              { key: 'entityId', title: 'ID' }
            ]}
            data={audit}
          />
        </div>
      </div>
    </div>
  );
}
