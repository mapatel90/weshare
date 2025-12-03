import React from 'react';

const MeterInfo = ({ project = {}, contracts = [], contractsLoading = false }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6',
          padding: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '24px',
              backgroundColor: '#10b981',
              borderRadius: '9999px',
              marginRight: '12px',
            }}
          ></div>
          Meter Information
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #eef2ff, #e9d5ff)', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Meter Name</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.meter_name || '-'}</p>
          </div>
          <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #fef3c7, #fde68a)', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Meter Number</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.meter_number || '-'}</p>
          </div>
          <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>SIM Number</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.sim_number || '-'}</p>
          </div>
          <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>SIM Start Date</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {project.sim_start_date ? new Date(project.sim_start_date).toLocaleDateString() : '-'}
            </p>
          </div>
          <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #fee2e2, #fecaca)', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>SIM Expire Date</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {project.sim_expire_date ? new Date(project.sim_expire_date).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6',
          padding: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '24px',
              backgroundColor: '#f59e0b',
              borderRadius: '9999px',
              marginRight: '12px',
            }}
          ></div>
          Contracts
        </h3>
        {contractsLoading ? (
          <div style={{ color: '#6b7280' }}>Loading contracts...</div>
        ) : !contracts || contracts.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No contracts found for this project.</div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {contracts.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.contractTitle || 'Untitled'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {c.offtaker?.fullName ? `Offtaker: ${c.offtaker.fullName}` : ''}
                    {c.investor?.fullName ? ` ${c.offtaker ? '·' : ''} Investor: ${c.investor.fullName}` : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                    {c.contractDate ? new Date(c.contractDate).toLocaleDateString() : '-'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {c.documentUpload ? (
                    <a
                      href={c.documentUpload.startsWith('/') ? c.documentUpload : `/${c.documentUpload}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}
                    >
                      View Document
                    </a>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>No document</span>
                  )}
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: '9999px',
                      backgroundColor: c.status === 1 ? '#dcfce7' : c.status === 2 ? '#fee2e2' : '#f3f4f6',
                      color: c.status === 1 ? '#166534' : c.status === 2 ? '#991b1b' : '#6b7280',
                      fontWeight: 600,
                      fontSize: '12px',
                    }}
                  >
                    {c.status === 1 ? 'Active' : c.status === 2 ? 'Rejected' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeterInfo;