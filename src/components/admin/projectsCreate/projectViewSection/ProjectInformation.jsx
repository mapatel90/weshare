import React from 'react';
import { Sun, Users, Activity, DollarSign, TrendingUp, MapPin } from 'lucide-react';
import { getPrimaryProjectImage } from '@/utils/projectUtils';
import { getFullImageUrl } from '@/utils/common';

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
    <div className="card mb-3 mt-1" style={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      {/* Card Header */}
      <div
        className="card-header d-flex align-items-center justify-content-between flex-wrap"
        style={{
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          padding: '16px 20px',
        }}
      >
        <div className="d-flex align-items-center">
          <div
            style={{
              width: '8px',
              height: '28px',
              backgroundColor: '#3b82f6',
              borderRadius: '9999px',
              marginRight: '12px',
            }}
          ></div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#111827',
              margin: 0,
            }}
          >
            Project Information
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body p-4">
        <div className="row g-4">
          {/* LEFT: Project Image */}
          <div className="col-lg-4 col-md-12">
            <div
              className="card border-0 shadow-sm"
              style={{
                borderRadius: '16px',
                overflow: 'hidden'
              }}
            >
              <img
                src={getDefaultImageUrl(project)}
                alt="Project"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>

          {/* RIGHT: First 6 Info Cards */}
          <div className="col-lg-8 col-md-12">
            <div className="row g-3">
              <div className="col-6">
                <InfoCard icon={Sun} label="Project Type" value={project.projectType?.type_name} color="#3b82f6" />
              </div>
              <div className="col-6">
                <InfoCard icon={Activity} label="Status" value={project.status === 1 ? 'Active' : 'Inactive'} color="#22c55e" />
              </div>
              <div className="col-6">
                <InfoCard icon={Users} label="Offtaker" value={project.offtaker?.fullName} color="#a855f7" />
              </div>
              <div className="col-6">
                <InfoCard icon={TrendingUp} label="Asking Price" value={project.asking_price} color="#2563eb" />
              </div>
            </div>
          </div>

          {/* BOTTOM: Last 3 Cards (Country, State, City) - Full Width Below Image */}
          <div className="col-12 mt-0">
            <div className="row g-3">
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={DollarSign} label="Investor Profit" value={`${project.investor_profit}%`} color="#16a34a" />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={DollarSign} label="Weshare Profit" value={`${project.weshare_profit}%`} color="#059669" />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={MapPin} label="Country" value={project.country?.name} color="#f97316" />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={MapPin} label="State" value={project.state?.name} color="#ea580c" />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={MapPin} label="City" value={project.city?.name} color="#ef4444" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getDefaultImageUrl = (project) => {
  const cover = getPrimaryProjectImage(project);
  if (!cover) return getFullImageUrl('/uploads/general/noimage_2.png');
  return getFullImageUrl(cover) || getFullImageUrl('/uploads/general/noimage_2.png');
};

export default ProjectInformation;