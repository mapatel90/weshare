import React from 'react';
import { Sun, Users, Activity, DollarSign, TrendingUp, MapPin } from 'lucide-react';

const InfoCard = ({ icon: Icon, label, value, color }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      transition: 'background-color 0.2s',
    }}
  >
    <div
      style={{
        padding: '8px',
        borderRadius: '8px',
        background: color,
        flexShrink: 0,
      }}
    >
      <Icon style={{ width: '16px', height: '16px', color: '#fff' }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</p>
      <p
        style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#111827',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value || '-'}
      </p>
    </div>
  </div>
);

const ProjectInformation = ({ project = {} }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px', marginTop:'5px' }}>
      {/* Basic Information */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '9999px', marginRight: '12px' }}></div>
          Basic Information
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InfoCard icon={Sun} label="Project Type" value={project.projectType?.type_name} color="#3b82f6" />
          <InfoCard icon={Users} label="Offtaker" value={project.offtaker?.fullName} color="#a855f7" />
          <InfoCard icon={Activity} label="Status" value={project.status === 1 ? 'Active' : 'Inactive'} color={project.status === 1 ? '#22c55e' : '#ef4444'} />
        </div>
      </div>

      {/* Financial Information */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '24px', backgroundColor: '#22c55e', borderRadius: '9999px', marginRight: '12px' }}></div>
          Financial Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InfoCard icon={DollarSign} label="Investor Profit" value={project.investor_profit} color="#22c55e" />
          <InfoCard icon={DollarSign} label="Weshare Profit" value={project.weshare_profit} color="#059669" />
          <InfoCard icon={TrendingUp} label="Asking Price" value={project.asking_price} color="#3b82f6" />
        </div>
      </div>

      {/* Location Information */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '24px', backgroundColor: '#f97316', borderRadius: '9999px', marginRight: '12px' }}></div>
          Location Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InfoCard icon={MapPin} label="Country" value={project.country?.name} color="#f97316" />
          <InfoCard icon={MapPin} label="State" value={project.state?.name} color="#ea580c" />
          <InfoCard icon={MapPin} label="City" value={project.city?.name} color="#ef4444" />
        </div>
      </div>
    </div>
  );
};

export default ProjectInformation;