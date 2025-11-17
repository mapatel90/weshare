'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight } from 'lucide-react';

const OfftakerProjectsHeader = () => {
    const pathName = usePathname();
    const { lang } = useLanguage();

    const parts = pathName.split("/").filter(Boolean);
    const pageKey = parts[parts.length - 1] || "dashboard";

    const pageName = lang(`menu.${pageKey}`, pageKey.replace(/-/g, " "));

    return (
        <div className="header-wrapper">
            <div className="header-left">
                {/* Main title */}
                <h3 className="header-title">{pageName}</h3>

                {/* Vertical separator */}
                <span className="divider">|</span>

                {/* Breadcrumb */}
                <div className="breadcrumb-offtaker">
                    <Link href="/offtaker/dashboard" className="breadcrumb-link">
                        Dashboard
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="breadcrumb-current text-capitalize">
                        {pageName}
                    </span>
                </div>
            </div>

            {/* RIGHT SIDE (Buttons placeholder) */}
            <div className="header-right"></div>
        </div>
    );
};

export default OfftakerProjectsHeader;
