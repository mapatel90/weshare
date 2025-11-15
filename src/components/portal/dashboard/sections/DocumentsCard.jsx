import React from 'react';

function DocumentsCard() {

    return () => {
        <div className="documents-card">
            <div className="card-header">
                <div className="card-title">📄 Documents & Reports</div>
                <button className="btn"
                    style={{ background: '#fbbf24', color: 'white', fontSize: '12px', padding: '8px 16px' }}>📥 Download
                    All</button>
            </div>

            <div className="document-item">
                <div className="document-info">
                    <div className="document-icon">📄</div>
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>Contract Renewal Notice</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Review contract renewal for November 2024
                        </div>
                    </div>
                </div>
                <div className="document-actions">
                    <button className="action-btn">👁️</button>
                    <button className="action-btn">→</button>
                </div>
            </div>

            <div className="document-item">
                <div className="document-info">
                    <div className="document-icon">📄</div>
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>Solar Lease Agreement</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>20-year lease: Installation and terms</div>
                    </div>
                </div>
                <div className="document-actions">
                    <button className="action-btn">👁️</button>
                    <button className="action-btn">↓</button>
                </div>
            </div>

            <div className="document-item">
                <div className="document-info">
                    <div className="document-icon">📄</div>
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>Solar Lease Agreement</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>20-year lease: Installation and terms</div>
                    </div>
                </div>
                <div className="document-actions">
                    <button className="action-btn">👁️</button>
                    <button className="action-btn">↓</button>
                </div>
            </div>

            <div className="document-item">
                <div className="document-info">
                    <div className="document-icon">📄</div>
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>Meister Service Agreement</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>25-year lease: Installation and terms</div>
                    </div>
                </div>
                <div className="document-actions">
                    <button className="action-btn">👁️</button>
                    <button className="action-btn">↓</button>
                </div>
            </div>

            <div className="document-item">
                <div className="document-info">
                    <div className="document-icon">📄</div>
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>Solar Lease Agreement</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>20-year lease: Installation and terms</div>
                    </div>
                </div>
                <div className="document-actions">
                    <button className="action-btn">👁️</button>
                    <button className="action-btn">↓</button>
                </div>
            </div>
        </div>
    }
}

export default DocumentsCard;