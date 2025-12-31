import React from 'react';
import { Sun, Users, Activity, DollarSign, TrendingUp, MapPin, CloudSun, SunriseIcon, Thermometer, Droplets, Compass, Wind, Cloud, Leaf, Trees, } from 'lucide-react';
import { getPrimaryProjectImage } from '@/utils/projectUtils';
import { getFullImageUrl } from '@/utils/common';
import { useLanguage } from '@/contexts/LanguageContext';

const InfoCard = ({ icon: Icon, label, value, color, isDark = false }) => {
  const colors = {
    cardBg: isDark ? 'rgba(27, 36, 54, 0.5)' : '#f9fafb',
    text: isDark ? '#ffffff' : '#111827',
    textMuted: isDark ? '#b1b4c0' : '#6b7280',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px',
        backgroundColor: colors.cardBg,
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
        <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '4px' }}>{label}</p>
        <p
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value || '-'}
        </p>
      </div>
    </div>
  )
};


const ProjectInformation = ({ project = {}, isDark = false }) => {
  const { lang } = useLanguage()
  const colors = {
    cardBg: isDark ? '#121a2d' : '#fff',
    headerBg: isDark ? 'rgba(27, 36, 54, 0.5)' : '#f9fafb',
    text: isDark ? '#ffffff' : '#111827',
    textMuted: isDark ? '#b1b4c0' : '#6b7280',
    border: isDark ? '#1b2436' : '#e5e7eb',
    boxShadow: isDark ? '0 0 20px rgba(14, 32, 56, 0.3)' : 'none',
  }

  const getAutoRandomColor = () => {
    const hue = Math.floor(Math.random() * 360); // 0–360
    return `hsl(${hue}, 70%, 50%)`;
  };


  return (
    <div className="card mb-3 mt-1" style={{ borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, boxShadow: colors.boxShadow }}>
      {/* Card Header */}
      <div
        className="card-header d-flex align-items-center justify-content-between flex-wrap"
        style={{
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
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
              color: colors.text,
              margin: 0,
            }}
          >
            {lang('projectView.projectInformation.project_Information', 'Project Information')}
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body p-4" style={{ backgroundColor: colors.cardBg }}>
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
                <InfoCard icon={Sun} label={lang('projectView.projectInformation.project_type', 'Project Type')} value={project.project_types?.type_name} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-6">
                <InfoCard icon={Activity} label={lang('projectView.projectInformation.status', 'Status')} value={project.status === 1 ? 'Active' : 'Inactive'} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-6">
                <InfoCard icon={Users} label={lang('projectView.projectInformation.offtaker', 'offtaker')} value={project.offtaker?.full_name} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-6">
                <InfoCard icon={TrendingUp} label={lang('projectView.projectInformation.asking_price', 'Asking Price')} value={project.asking_price} color={getAutoRandomColor()} isDark={isDark} />
              </div>
            </div>
          </div>

          {/* BOTTOM: Last 3 Cards (Country, State, City) - Full Width Below Image */}
          <div className="col-12 mt-0">
            <div className="row g-3">
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={DollarSign} label={lang('projectView.projectInformation.investor_profit', 'Investor Profit')} value={`${project.investor_profit}%`} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={DollarSign} label={lang('projectView.projectInformation.weshare_profit', 'Weshare Profit')} value={`${project.weshare_profit}%`} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={MapPin} label={lang('projectView.projectInformation.country', 'Country')} value={project.countries?.name} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={MapPin} label={lang('projectView.projectInformation.state', 'State')} value={project.states?.name} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={MapPin} label={lang('projectView.projectInformation.city', 'City')} value={project.cities?.name} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={CloudSun} label={lang('projectView.projectInformation.weather', 'Weather')} value={`${project?.project_data?.[0]?.cond_txtd ?? '-'} ~ ${project?.project_data?.[0]?.cond_txtn ?? '-'}`} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={SunriseIcon} label={lang('projectView.projectInformation.sunshine', 'Sunshine')} value={`${project?.project_data?.[0]?.sr ?? '-'} ~ ${project?.project_data?.[0]?.ss ?? '-'}`} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={Thermometer} label={lang('projectView.projectInformation.temp', 'Temp')} value={
                  project?.project_data?.[0]?.tmp_min != null && project?.project_data?.[0]?.tmp_max != null
                    ? `${project.project_data[0].tmp_min} ℃ ~ ${project.project_data[0].tmp_max} ℃`
                    : project?.tmp_min != null
                      ? `${project.tmp_min} ℃`
                      : '-'
                } color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={Droplets} label={lang('projectView.projectInformation.humidity', 'Humidity')} value={project?.project_data?.[0]?.hum ?? '-'} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={Compass} label={lang('projectView.projectInformation.wind_direction', 'Wind Direction')} value={project?.project_data?.[0]?.wind_dir ?? '-'} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={Wind} label={lang('projectView.projectInformation.wind_speed', 'Wind Speed')} value={project?.project_data?.[0]?.wind_spd ?? '-'} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={Cloud} label={lang('projectView.projectInformation.co2avoided', 'CO2 Avoided ')} value={project?.project_data?.[0]?.power_station_avoided_co2 ?? '-'} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={Leaf} label={lang('projectView.projectInformation.clean_energy', 'Clean Energy')} value={project?.project_data?.[0]?.power_station_avoided_tce + 'kwh' ?? '-'} color={getAutoRandomColor()} isDark={isDark} />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <InfoCard icon={Trees} label={lang('projectView.projectInformation.tree_planted', 'Tree Planted')} value={project?.project_data?.[0]?.power_station_num_tree + ' trees' ?? '-'} color={getAutoRandomColor()} isDark={isDark} />
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