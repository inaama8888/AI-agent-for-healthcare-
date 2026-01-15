export const API_BASE =
  process.env.NODE_ENV === "production"
    ? "" // בפרודקשן – אותו דומיין (Railway)
    : "http://localhost:5000"; 