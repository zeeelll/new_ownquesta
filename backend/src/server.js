// Server start
const app = require("./app");
const connectDB = require("./config/database");

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
