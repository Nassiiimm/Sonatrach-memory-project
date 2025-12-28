import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/Auth.jsx';

const API = '';

export default function Approvals(){
  const { headers } = useAuth();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('EN_ATTENTE_MANAGER');
  const [q, setQ] = useState('');

  const load = ()=> axios.get(API + '/api/requests', { headers, params:{ status, q } }).then(({data})=> setRows(data.data));
  useEffect(()=>{ load(); },[status,q]);

  const act = async (id, approved) => { 
    const confirmMsg = approved ? 'Valider cette demande (libérer) ?' : 'Refuser cette demande ?';
    if (!window.confirm(confirmMsg)) return;
    await axios.patch(API + '/api/requests/'+id+'/manager', { approved }, { headers }); 
    load(); 
  };

  return (
    <div>
      <Nav/>
      <div className="wrapper" style={{ maxWidth:'1000px' }}>
        <div className="card" style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:'0.5rem', alignItems:'end', marginBottom:'1rem' }}>
          <div>
            <div className="text-muted" style={{ fontSize:'0.72rem', marginBottom:'0.2rem' }}>Filtre statut</div>
            <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="">(tous)</option>
              <option value="EN_ATTENTE_MANAGER">En attente</option>
              <option value="EN_ATTENTE_RELEX">Transmises à Relex</option>
              <option value="REFUSEE">Rejetées</option>
            </select>
          </div>
          <div style={{ gridColumn:'span 3 / span 3' }}>
            <div className="text-muted" style={{ fontSize:'0.72rem', marginBottom:'0.2rem' }}>Recherche</div>
            <input className="input" placeholder="destination, ville, motif..." value={q} onChange={e=>setQ(e.target.value)} />
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize:'0.95rem', marginBottom:'0.5rem', fontWeight:600 }}>Demandes à valider</div>
          <Table columns={[
            { key:'employee', title:'Employé', render:(v,row)=> row.employee?.name },
            { key:'destination', title:'Destination' },
            { key:'city', title:'Ville' },
            { key:'startDate', title:'Début', render:v=> new Date(v).toLocaleDateString() },
            { key:'endDate', title:'Fin', render:v=> new Date(v).toLocaleDateString() },
            { key:'status', title:'Statut', render:v=> <span className={`badge status-${v}`}>{v}</span> },
            { key:'_id', title:'Actions', render:(v)=> (
              <div style={{ display:'flex', gap:'0.35rem' }}>
                <button className="btn" onClick={()=>act(v, true)}>Libérer</button>
                <button className="btn subtle" onClick={()=>act(v, false)}>Refuser</button>
              </div>
            ) }
          ]} data={rows} />
        </div>
      </div>
    </div>
  );
}