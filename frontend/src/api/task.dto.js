// src/api/task.taskDTO.js
export const mapToAssignTaskDTO = (formData) => {
    return {
        TaskName: formData.TaskName,          // Match sa Entity at IDE Index
        Description: formData.Description || '',
        Status: formData.Status || 0,
        Priority: formData.Priority || 1,
        ProjectId: Number(formData.ProjectId),
        TeamMemberId: Number(formData.TeamMemberId),
        DueDate: formData.DueDate ? new Date(formData.DueDate).toISOString() : null,
        EstimatedHours: formData.EstimatedHours || 0
    };
};