'use client'
import React, { useState } from 'react'
import PageHeaderSetting from '@/components/shared/pageHeader/PageHeaderSetting'
import { TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material'
import Footer from '@/components/shared/Footer'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { settingOptions } from './settingsEmailForm'


const SettingSeoForm = () => {
    const [urlRewrite, setUrlRewrite] = useState('yes')
    const [minifyCss, setMinifyCss] = useState('yes')
    const [minifyJs, setMinifyJs] = useState('yes')
    const options= settingOptions
    return (
        <div className="content-area setting-form">
            <PerfectScrollbar>
                <PageHeaderSetting />
                <div className="content-area-body">
                    <div className="card mb-0">
                        <div className="card-body">
                            <div className="mb-4">
                                <TextField fullWidth label={"Site Title"} placeholder={"Site Title"} helperText={"SEO Title [Ex: CRM Application & Admin Dashboard]"} />
                            </div>
                            <div className="mb-4">
                                <TextField fullWidth label={"Site Slug"} placeholder={"Site Slug"} helperText={"SEO Slug [Ex: crm-adpplication-and-admin-dashboard]"} />
                            </div>
                            <div className="mb-4">
                                <TextField fullWidth multiline rows={3} label={"Meta Description (max 160 chars)"} placeholder={"Meta Description (max 160 chars)"} helperText={"Meta Description (max 160 chars) [Ex: A meta description is a brief summary of a webpage's content that appears in search engine results pages (SERPs).]"} />
                            </div>
                            <div className="mb-5">
                                <TextField fullWidth multiline rows={3} label={"Meta Keywords (max 15 keywords)"} placeholder={"Meta Keywords (max 15 keywords)"} helperText={"Meta Keywords (max 15 keywords) [Ex: CRM, Admin, Dashbard, webapp]"} />
                            </div>


                            <div className="mb-5">
                                <FormControl fullWidth>
                                    <InputLabel id="url-rewrite-label">URL Rewriting?</InputLabel>
                                    <Select labelId="url-rewrite-label" value={urlRewrite} label={"URL Rewriting?"} onChange={(e)=>setUrlRewrite(e.target.value)}>
                                        {options.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
                                    </Select>
                                    <FormHelperText>URL Rewriting [Ex: Yes/No]</FormHelperText>
                                </FormControl>
                            </div>
                            <div className="mb-5">
                                <FormControl fullWidth>
                                    <InputLabel id="minify-css-label">Minify CSS</InputLabel>
                                    <Select labelId="minify-css-label" value={minifyCss} label={"Minify CSS"} onChange={(e)=>setMinifyCss(e.target.value)}>
                                        {options.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
                                    </Select>
                                    <FormHelperText>Minify CSS [Ex: Yes/No]</FormHelperText>
                                </FormControl>
                            </div>
                            <div className="mb-5">
                                <FormControl fullWidth>
                                    <InputLabel id="minify-js-label">Minify JS</InputLabel>
                                    <Select labelId="minify-js-label" value={minifyJs} label={"Minify JS"} onChange={(e)=>setMinifyJs(e.target.value)}>
                                        {options.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
                                    </Select>
                                    <FormHelperText>Minify JS [Ex: Yes/No]</FormHelperText>
                                </FormControl>
                            </div>
                            <div className="mb-0">
                                <TextField fullWidth label={"Google Analytics"} placeholder={"Google Analytics"} helperText={"Google Analytics [Ex: UA-XXXXX-Y]"} />
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </PerfectScrollbar>
        </div>

    )
}

export default SettingSeoForm