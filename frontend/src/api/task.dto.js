// src/api/task.taskDTO.js
export const mapToAssignTaskDTO = (formData) => {
    return {
        TaskName: formData.TaskName,          // Match sa Entity at IDE Index
        Description: formData.Description || '',
        Status: formData.Status || 0,
        Priority: formData.Priority || 1,
        ProjectId: formData.ProjectId ? Number(formData.ProjectId) : null,
        TeamMemberId: formData.TeamMemberId ? Number(formData.TeamMemberId) : null,
        DueDate: formData.DueDate ? new Date(formData.DueDate).toISOString() : null,
        EstimatedHours: formData.EstimatedHours || 0,
        CreatedBy: formData.CreatedBy
    };
};