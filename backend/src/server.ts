import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth/authRoutes';
import userRoutes from './routes/users/userRoutes';
import cvRoutes from './routes/cvs/cvRoutes';
import cvTemplateRoutes from './routes/cvs/cvTemplateRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/cv-templates', cvTemplateRoutes);

app.get('/', (req, res) => {
  res.send('Hello from CV Builder Backend!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
