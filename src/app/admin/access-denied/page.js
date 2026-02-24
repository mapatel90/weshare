'use client';

import Link from 'next/link';

const AccessDeniedPage = () => {
  return (
    <div className="container-fluid px-3" style={{ minHeight: '100vh' }}>
      <div className="row align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="col-12 col-md-10 col-lg-6 col-xl-5">
          <div className="card shadow-sm">
            <div className="card-body text-center p-4 p-sm-5">
              <div
                className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle"
                style={{ width: 96, height: 96, background: 'rgba(220, 53, 69, 0.12)' }}
              >
                <span className="text-danger" style={{ fontSize: 44, lineHeight: 1 }}>
                  🛡️
                </span>
              </div>

              <div className="display-1 fw-bold text-danger mb-1">403</div>
              <div className="h4 fw-semibold mb-2">Access Denied</div>

              <p className="text-muted mb-4">
                Sorry, you don&apos;t have permission to access this page. Please contact your
                administrator if you believe this is an error.
              </p>

              <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => window.history.back()}
                >
                  ← Go Back
                </button>

                <Link className="btn btn-primary" href="/admin/dashboards">
                  Go to Dashboard
                </Link>
              </div>

              <hr className="my-4" />

              <div className="small text-muted">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                  <span aria-hidden>ℹ️</span>
                  <span>Error Code: 403 - Forbidden</span>
                </div>
                <div>You don&apos;t have the required permissions to view this resource.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
