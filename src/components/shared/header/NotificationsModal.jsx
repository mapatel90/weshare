import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { FiBell, FiCheck, FiX } from 'react-icons/fi'

const notificationsList = []

const NotificationsModal = () => {
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef(null)

    useEffect(() => {
        const handleOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        document.addEventListener('touchstart', handleOutside)
        return () => {
            document.removeEventListener('mousedown', handleOutside)
            document.removeEventListener('touchstart', handleOutside)
        }
    }, [])

    const toggle = () => setOpen(prev => !prev)

    return (
        <div className="dropdown nxl-h-item" ref={wrapperRef}>
            <button
                type="button"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                className="nxl-head-link me-3"
                aria-expanded={open}
                onClick={toggle}
            >
                <FiBell size={20} />
                {/* <span className="badge bg-danger nxl-h-badge">3</span> */}
            </button>

            <div className={`dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-notifications-menu ${open ? 'show' : ''}`}>
                <div className="d-flex justify-content-between align-items-center notifications-head px-3 py-2">
                    <h6 className="fw-bold text-dark mb-0">Notifications</h6>
                    <a href="#" className="fs-11 text-success text-end ms-auto" onClick={(e) => { e.preventDefault(); /* implement make-as-read */ }}>
                        <FiCheck size={16} />
                        <span className="ms-1">Make as Read</span>
                    </a>
                </div>

                {notificationsList.map(({ id, src, time, titleFirst, titleSecond }) =>
                    <Card
                        key={id}
                        src={src}
                        time={time}
                        titleFirst={titleFirst}
                        titleSecond={titleSecond}
                        onClick={() => setOpen(false)}
                    />
                )}

                <div className="text-center notifications-footer py-2">
                    <Link href="#" onClick={() => setOpen(false)} className="fs-13 fw-semibold text-dark">All Notifications</Link>
                </div>
            </div>
        </div>
    )
}

export default NotificationsModal


const Card = ({ src, time, titleFirst, titleSecond, onClick }) => {
    return (
        <div className="notifications-item px-3 py-2">
            <Link href="#" className="d-flex align-items-start text-decoration-none" onClick={onClick}>
                <img src={src} alt="" className="rounded me-3 border" />
                <div className="notifications-desc w-100">
                    <div className="font-body text-truncate-2-line mb-1">
                        <span className="fw-semibold text-dark">{titleFirst}</span> {titleSecond}
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="notifications-date text-muted">{time} minutes ago</div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="d-block wd-8 ht-8 rounded-circle bg-gray-300"></span>
                            <span className="text-danger"><FiX className="fs-12" /></span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}