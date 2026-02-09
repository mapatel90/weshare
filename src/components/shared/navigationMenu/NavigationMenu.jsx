'use client'
import React, { useContext, useEffect } from 'react'
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PerfectScrollbar from "react-perfect-scrollbar";
import Menus from './Menus';
import { NavigationContext } from '@/contentApi/navigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import useSettings from '@/hooks/useSettings';
import { buildUploadUrl, getFullImageUrl } from '@/utils/common';

const NavigationManu = () => {
    const { navigationOpen, setNavigationOpen } = useContext(NavigationContext)
    const { lang } = useLanguage()
    const { settings } = useSettings()
    const pathName = usePathname()
    
    useEffect(() => {
        setNavigationOpen(false)
    }, [pathName])
    return (
        <nav className={`nxl-navigation ${navigationOpen ? "mob-navigation-active" : ""}`}>
            <div className="navbar-wrapper">
                <div className="m-header">
                    <Link href="/" className="b-brand">
                        {/* <!-- ========   dynamic logo   ============ --> */}
                        {/* {settings?.site_image} */}
                        <img
                            width={140}
                            height={30}
                            src={buildUploadUrl(settings?.site_image) || "WeShare"}
                            alt="WeShare"
                            className="logo logo-lg"
                            // onError={e => {
                            //     if (e.target.src !== window.location.origin + "Sunshare" && e.target.src !== window.location.origin + "/_next/image?url=%2Fimages%2Flogo-full.png&w=256&q=75") {
                            //         e.target.src = "Sunshare";
                            //     } else {
                            //         e.target.style.display = "none";
                            //     }
                            // }}
                        />
                        {/* <Image width={140} height={30} src={settings?.site_image || "/images/logo-abbr.png"} alt="Sunshare" className="logo logo-sm" /> */}
                        <img
                            width={140}
                            height={30}
                            src={buildUploadUrl(settings?.site_image) || "S"}
                            alt="WeShare"
                            className="logo logo-sm"
                            // onError={e => {
                            //     if (e.target.src !== window.location.origin + "/images/logo-abbr.png" && e.target.src !== window.location.origin + "/_next/image?url=%2Fimages%2Flogo-abbr.png&w=256&q=75") {
                            //         e.target.src = "/images/logo-abbr.png";
                            //     } else {
                            //         e.target.style.display = "none";
                            //     }
                            // }}
                        />
                    </Link>
                </div>

                <div className={`navbar-content`}>
                    <PerfectScrollbar>
                        <ul className="nxl-navbar">
                            <li className="nxl-item nxl-caption">
                                <label>{lang('navigation.navigation', 'Navigation')}</label>
                            </li>
                            <Menus />
                        </ul>
                        {/* <div className="text-center card">
                            <div className="card-body">
                                <i className="fs-4 text-dark"><FiSunrise /></i>
                                <h6 className="mt-4 text-dark fw-bolder">Downloading Center</h6>
                                <p className="my-3 fs-11 text-dark">Duralux is a production ready CRM to get started up and running easily.</p>
                                <Link href="#" className="btn btn-primary text-dark w-100">Download Now</Link>
                            </div>
                        </div> */}
                        <div style={{ height: "18px" }}></div>
                    </PerfectScrollbar>
                </div>
            </div>
            <div onClick={() => setNavigationOpen(false)} className={`${navigationOpen ? "nxl-menu-overlay" : ""}`}></div>
        </nav>
    )
}

export default NavigationManu