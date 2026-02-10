// src/api/team.dto.js
export const mapToUpdateTeamDTO = (formData) => {
    return {
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        Email: formData.Email,
        PositionID: Number(formData.PositionID),
        ContactNumber: formData.ContactNumber,
        Address: formData.Address, // Added this line
        Status: formData.Status || 'offline',
        Avatar: formData.Avatar || '👤'
    };
};