import { http } from "../../../services/http";

export const lookupService = {
    getBranches: (token) => http.get("/branches", token), // Assuming public but token ok
    getBranch: (id, token) => http.get(`/branches/${id}`, token),

    createBranch: (data, token) => http.post("/branches", data, token),
    updateBranch: (id, data, token) => http.patch(`/branches/${id}`, data, token),
    deleteBranch: (id, token) => http.delete(`/branches/${id}`, token),

    getCourses: (token) => http.get("/courses", token),
    createCourse: (data, token) => http.post("/courses", data, token),
    updateCourse: (id, data, token) => http.patch(`/courses/${id}`, data, token),
    deleteCourse: (id, token) => http.delete(`/courses/${id}`, token),

    getPaymentMethods: (token) => http.get("/payment-methods", token),
    createPaymentMethod: (data, token) => http.post("/payment-methods", data, token),
    updatePaymentMethod: (id, data, token) => http.patch(`/payment-methods/${id}`, data, token),
    deletePaymentMethod: (id, token) => http.delete(`/payment-methods/${id}`, token),

    getExpenses: (token, branchId) => {
        let url = "/expenses";
        if (branchId) url += `?branch_id=${branchId}`;
        return http.get(url, token);
    },
    createExpense: (data, token) => http.post("/expenses", data, token),
    updateExpense: (id, data, token) => http.patch(`/expenses/${id}`, data, token),
    deleteExpense: (id, token) => http.delete(`/expenses/${id}`, token),
};
