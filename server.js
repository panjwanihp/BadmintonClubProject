const express = require('express')
const connectDB =  require('./config/db');
// const cron = require('node-cron');
const app = express()


//ConnectDB
connectDB();


//Init Middleware
app.use(express.json({extended: false}));
// cron.schedule('* * * * *', function() {
//     var datetime = new Date();
//     console.log(datetime.toLocaleTimeString())
//     console.log(datetime.toLocaleDateString());
//     let bookings = await Booking.find({$and : [{"date" : date},{"court_full":false},{"status" : 1}]});
// });

app.get('/', (req,res) => res.send('API Runing')); 

const PORT =  process.env.PORT || 5000;

app.use('/public', express.static('public'));
//route
app.use('/users' , require("./routes/users"));
app.use('/court' , require("./routes/court"));
app.use('/booking' , require("./routes/booking"));
app.use('/profile' , require("./routes/profile"));
app.use('/auth' , require("./routes/auth"));
app.use('/wallet' , require("./routes/wallet"));
//app.use('/post' , require("./routes/api/post"));

app.listen(PORT , () => console.log(`Server started on PORT ${PORT}`));