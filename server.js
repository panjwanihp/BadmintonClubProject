const express = require('express')
const connectDB =  require('./config/db');

const app = express()

//ConnectDB
connectDB();

//Init Middleware
app.use(express.json({extended: false}));

app.get('/', (req,res) => res.send('API Runing')); 

const PORT =  process.env.PORT || 3000;

//route
app.use('/users' , require("./routes/api/users"));
app.use('/profile' , require("./routes/api/profile"));
//app.use('/auth' , require("./routes/api/auth"));
//app.use('/post' , require("./routes/api/post"));

app.listen(PORT , () => console.log(`Server started on PORT ${PORT}`));