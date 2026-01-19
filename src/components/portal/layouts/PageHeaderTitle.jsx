'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight } from 'lucide-react';

const PageHeaderTitle = () => {
    const pathName = usePathname();
    const { lang } = useLanguage();

    const parts = pathName.split("/").filter(Boolean);
    let title = "Dashboard";
    let breadcrumb = [];

    // Special case for /offtaker/contracts/details/:id
    if (
        parts.length >= 4 &&
        parts[0] === "offtaker" &&
        parts[1] === "projects" &&
        parts[2] === "details"
    ) {
        title = "Proect details";
        breadcrumb = [
            { name: lang("menu.contracts", "Project"), href: "/offtaker/projects" },
            { name: lang("menu.details", "Details"), href: null }
        ];
    }
    else if (
        parts.length >= 4 &&
        parts[0] === "offtaker" &&
        parts[1] === "contracts" &&
        parts[2] === "details"
    ) {
        title = "Contract details";
        breadcrumb = [
            { name: lang("menu.contracts", "Contract"), href: "/offtaker/contracts" },
            { name: lang("menu.details", "Details"), href: null }
        ];
    }
    // Special case for /offtaker/billings/invoice/:id
    else if (
        parts.length >= 4 &&
        parts[0] === "offtaker" &&
        parts[1] === "billings" &&
        parts[2] === "invoice"
    ) {
        title = "Invoice Details";
        breadcrumb = [
            { name: lang("menu.billings", "Billings"), href: "/offtaker/billings" },
            { name: lang("menu.invoice", "Invoice"), href: null }
        ];
    } else {
        const pageKey = parts[parts.length - 1] || "dashboard";
        const pageName = lang(`menu.${pageKey}`, pageKey.replace(/-/g, " "));
        title = pageName.charAt(0).toUpperCase() + pageName.slice(1);
        breadcrumb = [
            { name: "Dashboard", href: "/offtaker/dashboard" },
            { name: title, href: null }
        ];
    }

    return (
        <div className="header-wrapper">
            <div className="header-left">
                {/* Main title */}
                <h3 className="header-title">{title}</h3>

                {/* Vertical separator */}
                <span className="divider">|</span>

                {/* Breadcrumb */}
                <div className="breadcrumb-offtaker">
                    {breadcrumb.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <ChevronRight className="w-4 h-4" />}
                            {item.href ? (
                                <Link href={item.href} className="breadcrumb-link">
                                    {item.name}
                                </Link>
                            ) : (
                                <span className="breadcrumb-current text-capitalize">{item.name}</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE (Buttons placeholder) */}
            <div className="header-right"></div>
        </div>
    );
};

export default PageHeaderTitle;
