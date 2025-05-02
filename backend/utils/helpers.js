const helpers = {
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    validatePhone: (phone) => {
        const re = /^07[789]\d{7}$/;
        return re.test(phone);
    },
    validatePassword: (password) => {
        const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return re.test(password);
    },
    validateDOB: (dob) => {
        const today = new Date();
        const birthDate = new Date(dob);
        const age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        return age >= 18 || (age === 18 && m >= 0);
    },
};

export default helpers;
