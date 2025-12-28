import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Admin() {
  const { headers } = useAuth();
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [audit, setAudit] = useState([]);

  // Formulaire utilisateur
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

  // Formulaire hôtel
  const [hotelForm, setHotelForm] = useState({
    name: '',
    city: '',
    country: 'Algérie',
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
    try {
      await axios.post(API + '/api/users', userForm, { headers });
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
      alert(
        err?.response?.data?.message ||
          'Erreur lors de la création du compte utilisateur'
      );
    }
  };

  const createHotel = async e => {
    e.preventDefault();
    try {
      await axios.post(API + '/api/hotels', hotelForm, { headers });
      setHotelForm({
        name: '',
        city: '',
        country: 'Algérie',
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
      alert(
        err?.response?.data?.message ||
          "Erreur lors de l'enregistrement de l'hôtel"
      );
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
        <div style={{ marginBottom: '1.1rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            Administration
          </div>
          <div
            className="text-muted"
            style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}
          >
            Gestion des comptes, des hôtels contractés et suivi des
            principales actions (audit).
          </div>
        </div>

        <div
          className="grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}
        >
          {/* COMPTES UTILISATEURS */}
          <div className="card" style={{ display: 'grid', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Comptes utilisateurs
              </div>
              <div
                className="text-muted"
                style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}
              >
                Création et gestion des comptes par rôle : Employé,
                Manager, Relex, Finance, Admin. Les champs matricule,
                région et imputation permettent l'identification sur les
                bons de commande.
              </div>
            </div>

            <form
              onSubmit={createUser}
              style={{ display: 'grid', gap: '0.3rem' }}
            >
              <input
                className="input"
                placeholder="Nom complet"
                value={userForm.name}
                onChange={e =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Email"
                value={userForm.email}
                onChange={e =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Mot de passe"
                type="password"
                value={userForm.password}
                onChange={e =>
                  setUserForm({
                    ...userForm,
                    password: e.target.value
                  })
                }
              />
              <div className="form-grid-2">
                <input
                  className="input"
                  placeholder="Matricule"
                  value={userForm.matricule}
                  onChange={e =>
                    setUserForm({
                      ...userForm,
                      matricule: e.target.value
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Acronyme région (HMD, HRM, OHT...)"
                  value={userForm.regionAcronym}
                  onChange={e =>
                    setUserForm({
                      ...userForm,
                      regionAcronym: e.target.value
                    })
                  }
                />
              </div>
              <div className="form-grid-2">
                <input
                  className="input"
                  placeholder="Département (optionnel)"
                  value={userForm.department}
                  onChange={e =>
                    setUserForm({
                      ...userForm,
                      department: e.target.value
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Service / imputation"
                  value={userForm.serviceImputation}
                  onChange={e =>
                    setUserForm({
                      ...userForm,
                      serviceImputation: e.target.value
                    })
                  }
                />
              </div>
              <select
                className="input"
                value={userForm.role}
                onChange={e =>
                  setUserForm({ ...userForm, role: e.target.value })
                }
              >
                <option value="EMPLOYE">EMPLOYE</option>
                <option value="MANAGER">MANAGER</option>
                <option value="RELEX">RELEX</option>
                <option value="FINANCE">FINANCE</option>
                <option value="ADMIN">ADMIN</option>
              </select>

              <button className="btn" style={{ marginTop: '0.3rem' }}>
                Créer le compte
              </button>
            </form>

            <div style={{ marginTop: '0.6rem' }}>
              <Table
                columns={[
                  { key: 'name', title: 'Nom' },
                  { key: 'email', title: 'Email' },
                  { key: 'role', title: 'Rôle' },
                  {
                    key: 'matricule',
                    title: 'Matricule'
                  },
                  {
                    key: 'regionAcronym',
                    title: 'Région'
                  }
                ]}
                data={users}
              />
            </div>
          </div>

          {/* HOTELS */}
          <div className="card" style={{ display: 'grid', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Hôtels & grilles tarifaires
              </div>
              <div
                className="text-muted"
                style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}
              >
                Enregistrement des établissements partenaires et de leurs
                formules de prise en charge. Les tarifs servent au calcul
                automatique du BC au niveau Relex.
              </div>
            </div>

            <form
              onSubmit={createHotel}
              style={{ display: 'grid', gap: '0.3rem' }}
            >
              <input
                className="input"
                placeholder="Nom de l'hôtel"
                value={hotelForm.name}
                onChange={e =>
                  setHotelForm({ ...hotelForm, name: e.target.value })
                }
              />
              <div className="form-grid-2">
                <input
                  className="input"
                  placeholder="Ville"
                  value={hotelForm.city}
                  onChange={e =>
                    setHotelForm({
                      ...hotelForm,
                      city: e.target.value
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Pays"
                  value={hotelForm.country}
                  onChange={e =>
                    setHotelForm({
                      ...hotelForm,
                      country: e.target.value
                    })
                  }
                />
              </div>
              <div className="form-grid-2">
                <input
                  className="input"
                  placeholder="Code interne / contrat"
                  value={hotelForm.code}
                  onChange={e =>
                    setHotelForm({
                      ...hotelForm,
                      code: e.target.value
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Chaîne / groupe (optionnel)"
                  value={hotelForm.provider}
                  onChange={e =>
                    setHotelForm({
                      ...hotelForm,
                      provider: e.target.value
                    })
                  }
                />
              </div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginTop: '0.3rem'
                }}
              >
                Tarifs par nuit (DZD)
              </div>
              <div className="form-grid-2">
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Séjour simple"
                  value={hotelForm.prices.simple}
                  onChange={e =>
                    onChangeHotelPrice('simple', e.target.value)
                  }
                />
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Formule repas"
                  value={hotelForm.prices.formule_repas}
                  onChange={e =>
                    onChangeHotelPrice('formule_repas', e.target.value)
                  }
                />
              </div>
              <div className="form-grid-2">
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Demi-pension"
                  value={hotelForm.prices.demi_pension}
                  onChange={e =>
                    onChangeHotelPrice('demi_pension', e.target.value)
                  }
                />
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Pension complète"
                  value={hotelForm.prices.pension_complete}
                  onChange={e =>
                    onChangeHotelPrice('pension_complete', e.target.value)
                  }
                />
              </div>

              <textarea
                className="input"
                rows={2}
                placeholder="Notes (périodes, contraintes de réservation, etc.)"
                value={hotelForm.notes}
                onChange={e =>
                  setHotelForm({
                    ...hotelForm,
                    notes: e.target.value
                  })
                }
              />

              <button className="btn" style={{ marginTop: '0.3rem' }}>
                Enregistrer l'hôtel
              </button>
            </form>

            <div style={{ marginTop: '0.6rem' }}>
              <Table
                columns={[
                  { key: 'name', title: 'Hôtel' },
                  { key: 'city', title: 'Ville' },
                  {
                    key: 'prices',
                    title: 'Tarifs',
                    render: v =>
                      v
                        ? `Simple: ${v.simple} · Repas: ${v.formule_repas} · DP: ${v.demi_pension} · PC: ${v.pension_complete}`
                        : '—'
                  }
                ]}
                data={hotels}
              />
            </div>
          </div>
        </div>

        {/* AUDIT */}
        <div className="card">
          <div
            style={{
              fontSize: '0.95rem',
              marginBottom: '0.5rem',
              fontWeight: 600
            }}
          >
            Journal des actions (audit)
          </div>
          <Table
            columns={[
              { key: 'createdAt', title: 'Date', render: v => (v ? new Date(v).toLocaleString() : '') },
              { key: 'action', title: 'Action' },
              { key: 'entity', title: 'Entité' },
              { key: 'entityId', title: 'ID' }
            ]}
            data={audit}
          />
        </div>
      </div>
    </div>
  );
}