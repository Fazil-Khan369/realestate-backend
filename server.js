// const express = require('express')
// const {Client} = require('pg')

// const app = express()
// app.use(express.json())




// app.listen(3000, ()=> {
//     console.log('Server run 3000');
// })


const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const propertyRoutes = require('./routes/propertyRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', propertyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({ error: 'Something broke!' });
});

app.listen(config.port, () => {
 console.log(`Server running on port ${config.port}`);
});