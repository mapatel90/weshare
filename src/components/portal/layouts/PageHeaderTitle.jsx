'use client';
import React, { useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import PageTitleContext from '@/contexts/PageTitleContext';

const PageHeaderTitle = () => {
    const pathName = usePathname();
    const router = useRouter();
    const { lang } = useLanguage();
    const { displayTitle } = useContext(PageTitleContext);

    const parts = pathName.split("/").filter(Boolean);
    let title = lang("page_title.dashboard", "Dashboard");
    let breadcrumb = [];

    // Special case for /offtaker/contracts/details/:id
    if (
        parts.length >= 4 &&
        parts[0] === "offtaker" &&
        parts[1] === "projects" &&
        parts[2] === "details"
    ) {
        title = displayTitle || lang("menu.details", "Details");
        breadcrumb = [
            { name: lang("menu.projects", "Project"), href: "/offtaker/projects" },
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
    }
    else if (
        parts.length >= 2 &&
        parts[0] === "offtaker" &&
        parts[1] === "meter-readings"
    ) {
        title = lang("page_title.meterreadings", "Meter Readings");
        breadcrumb = [
            { name: lang("page_title.dashboard", "Dashboard"), href: "/offtaker/dashboard" },
            { name: lang("menu.meterreadings", "Meter Readings"), href: "/offtaker/meter-readings" },
        ];
    }
    else if (
        parts.length >= 2 &&
        parts[0] === "offtaker" &&
        parts[1] === "myprofile"
    ) {
        title = lang("page_title.myprofile", "My Profile");
        breadcrumb = [
            { name: title, href: "/offtaker/myprofile" }
        ];
    }
    else if (
        parts[0] === "offtaker" &&
        parts[1] === "dashboard"
    ) {
        title = lang("page_title.dashboard", "Dashboard");
        breadcrumb = [
            { name: null, href: null }
        ];
    }
    else {
        const pageKey = parts[parts.length - 1] || lang("page_title.dashboard", "dashboard");
        const pageName = lang(`menu.${pageKey}`, pageKey.replace(/-/g, " "));
        title = pageName.charAt(0).toUpperCase() + pageName.slice(1);
        breadcrumb = [
            { name: lang("page_title.dashboard", "Dashboard"), href: "/offtaker/dashboard" },
            { name: title, href: null }
        ];
    }

    // Pick the first breadcrumb href that is different from current page as back destination
    const backHref = breadcrumb.find(item => item.href && item.href !== pathName)?.href || null;

    const handleBack = () => {
        if (backHref) {
            router.push(backHref);
        } else {
            router.back();
        }
    };

    return (
        <div className="header-wrapper">
            <div className="header-left">
                {/* Main title */}
                <h3 className="header-title">{title}</h3>
                {/* Vertical separator is not show in dashboard page*/}
                {pathName !== "/offtaker/dashboard" && (
                    <span className="divider d-none d-md-inline"> | </span>
                )}

                {/* Breadcrumb */}
                <div className="breadcrumb-offtaker d-none d-md-flex">
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

            {/* RIGHT SIDE - Back Button */}
            <div className="header-right">
                {pathName !== "/offtaker/dashboard" && (
                    <button
                        onClick={handleBack}
                        className="btn-back"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{lang("common.back", "Back")}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PageHeaderTitle;
