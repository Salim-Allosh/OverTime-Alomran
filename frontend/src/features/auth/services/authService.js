import { http } from "../../../services/http";

export const authService = {
    login: async (username, password) => {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        // Using isFormData = true
        return http.post("/auth/login", formData, null, true);
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }
};
