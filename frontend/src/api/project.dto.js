// src/api/project.dto.js

export const mapToProjectDTO = (formData) => {
    return {
        // IMPORTANT: Backend expects 'ProjectName', Frontend form uses 'Name'
        ProjectName: formData.ProjectName,

        Description: formData.Description || '',

        // Ensure values are Numbers to satisfy NestJS @IsNumber()
        Status: Number(formData.Status ?? 0),

        Priority: Number(formData.Priority ?? 1),

        // Ensure TeamMemberId is a number
        TeamMemberId: formData.TeamMemberId ? Number(formData.TeamMemberId) : null,

        // Optional fields - usually handled by @CreateDateColumn in NestJS
        // but included here to match your DTO structure if needed
        DateCreated: formData.DateCreated || new Date().toISOString()
    };
};