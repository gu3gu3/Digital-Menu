const notificationRoutes = require('./routes/notifications');

const app = express();
// Trust the first proxy in front of the app (App Engine's load balancer)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3001; 