import { http } from "../../../services/http";

export const salesService = {
    // Staff
    getStaff: (token, branchId) => {
        let url = "/sales/staff";
        if (branchId) url += `?branch_id=${branchId}`;
        return http.get(url, token);
    },
    createStaff: (data, token) => http.post("/sales/staff", data, token),
    updateStaff: (id, data, token) => http.patch(`/sales/staff/${id}`, data, token),
    deleteStaff: (id, token) => http.delete(`/sales/staff/${id}`, token),

    // Daily Reports
    getDailyReports: (token, filters = {}) => {
        const params = new URLSearchParams();
        if (filters.branch_id) params.append("branch_id", filters.branch_id);
        if (filters.date_from) params.append("date_from", filters.date_from);
        if (filters.date_to) params.append("date_to", filters.date_to);

        const queryString = params.toString();
        return http.get(`/daily-sales-reports${queryString ? '?' + queryString : ''}`, token);
    },
    createDailyReport: (data, token) => http.post("/daily-sales-reports", data, token),
    updateDailyReport: (id, data, token) => http.patch(`/daily-sales-reports/${id}`, data, token),
    deleteDailyReport: (id, token) => http.delete(`/daily-sales-reports/${id}`, token),
};
