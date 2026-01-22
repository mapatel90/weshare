"use client"
import React from 'react'
import Link from 'next/link'
import LoginForm from '@/components/authentication/LoginForm'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePageTitle } from '@/contexts/PageTitleContext';

const AdminLoginPage = () => {
    const { lang } = useLanguage();
    usePageTitle('page_title.adminLogin');
    
    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                backgroundImage: `url(/images/SunShare-Login-Screen.jpg)`,
                backgroundSize: '100% 100%, cover',
                backgroundPosition: 'top center, bottom center',
                backgroundRepeat: 'no-repeat, no-repeat',
                backgroundAttachment: 'fixed',
            }}>
            <div style={{ maxWidth: 620, width: '100%' }}>
                <div className="mb-4 text-center">
                <Link href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
                    <img src="/images/main_logo.png" alt="WeShare" className="mb-3 img-fluid" style={{ maxWidth: 200 }} />
                </Link>
                    <h3 className="fw-bolder">{lang('authentication.welcomeBack')}</h3>
                </div>
                <div className="mx-4 card mx-sm-0">
                    <div className="card-body p-sm-5">
                        <LoginForm registerPath={"/register"} resetPath={"/reset"} />
                    </div>
                </div>
            </div>
        </main>
    )
}

export default AdminLoginPage
