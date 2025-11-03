import React from 'react'

const TextAreaTopLabel = ({ label, info, placeholder, className, value, onChange }) => {
    return (
        <div className={className}>
            <label className="form-label">{label}</label>
            <textarea 
                className="form-control" 
                cols={30} 
                rows={10} 
                placeholder={placeholder} 
                value={value || ""}
                onChange={onChange}
            />
            <small className="form-text text-muted">{info}</small>
        </div>
    )
}

export default TextAreaTopLabel