import express from 'express';
import cors from 'cors';
import { conexionDB } from './DB/conexion.js';
import rutaUsuarios from './router/usuariorouter.js';

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000', // Permitir solicitudes solo desde localhost:3000
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Permitir los métodos HTTP especificados
  allowedHeaders: ['Content-Type', 'Authorization'], // Permitir estos encabezados
  preflightContinue: false, // Si se debe pasar al siguiente handler después de una solicitud de preflight
  optionsSuccessStatus: 204 // Estado a devolver para las solicitudes OPTIONS exitosas
};

app.use(cors(corsOptions));
app.use(express.json());

// Ruta para verificar preflight request
app.options('*', cors(corsOptions)); // Handle preflight requests

app.use("/usuarios", rutaUsuarios);

conexionDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Servidor escuchando en el puerto: ", PORT);
});