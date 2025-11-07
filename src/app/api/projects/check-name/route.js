import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request) {
    try {
        const { project_name, project_id } = await request.json()

        if (!project_name) {
            return NextResponse.json({ 
                exists: false 
            })
        }

        // Check if project with same name exists (excluding current project in edit mode)
        const whereClause = {
            project_name: {
                equals: project_name,
                mode: 'insensitive' // Case-insensitive comparison
            },
            is_deleted: 0
        }

        // If editing, exclude current project from check
        if (project_id) {
            whereClause.id = {
                not: parseInt(project_id)
            }
        }

        const existingProject = await prisma.project.findFirst({
            where: whereClause,
            select: {
                id: true,
                project_name: true
            }
        })

        return NextResponse.json({ 
            exists: !!existingProject,
            project: existingProject
        })

    } catch (error) {
        console.error('Error checking project name:', error)
        return NextResponse.json(
            { error: 'Failed to check project name' },
            { status: 500 }
        )
    }
}
