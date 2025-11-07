/**
 * Generate a URL-friendly slug from text
 * @param {string} text - The text to convert to slug
 * @returns {string} - The generated slug
 */
export function generateSlug(text) {
    if (!text) return ''
    
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '')             // Trim - from end of text
}

/**
 * Check if project name already exists
 * @param {string} projectName - The project name to check
 * @param {number|null} projectId - The current project ID (for edit mode)
 * @returns {Promise<boolean>} - True if name exists, false otherwise
 */
export async function checkProjectNameExists(projectName, projectId = null) {
    try {
        const API_BASE_URL = process.env.API_URL || 'http://localhost:5000'
        const response = await fetch(`${API_BASE_URL}/api/projects/check-name`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                project_name: projectName,
                project_id: projectId
            })
        })

        const data = await response.json()
        return data.exists
    } catch (error) {
        console.error('Error checking project name:', error)
        return false
    }
}
