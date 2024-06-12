import { Router } from "express";
import Usuario from '../models/Usuarios.js'
const router = Router();
//const jwt = require('jsonwebtoken');
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
//require('dotenv').config();
dotenv.config();

//importo libreria para encryptar contraseña
//const bcrypjs =require('bcrypjs'); //error en esta libreria verificar

import bcryptjs from 'bcryptjs';



//inicio session
// Ruta para iniciar sesión
router.post("/LoginByUser", async (req, res) => {
    const { correo, clave } = req.body;

    try {
        // Buscar usuario por correo
        const existUser = await Usuario.findOne({ correo });

        if (!existUser) {
            return res.status(400).json({ message: "El usuario no se encuentra registrado." });
        }

        if (existUser.estado !== 'Activo') {
            return res.status(403).json({ message: "El usuario está inactivo." });
        }

        // Comparar la contraseña ingresada con la almacenada en la base de datos
        const validPassword = await bcryptjs.compare(clave, existUser.clave);

        if (!validPassword) {
            return res.status(401).json({ message: "Contraseña incorrecta." });
        }

        // Generar token de acceso
        const accessToken = generateAccessToken({ correo: correo });
        res.header('authorization', accessToken).json({
            message: 'Usuario autenticado',
            token: accessToken,
            rol: existUser.rol,
            nombres: existUser.nombres,
            usuario: existUser,
            _id: existUser._id,
        });

    } catch (err) {
        res.status(500).json({ message: "Error al buscar al usuario en la base de datos.", error: err.message });
    }
});

// Función para generar el token de acceso
function generateAccessToken(user) {
    return jwt.sign(user, process.env.SECRET); // Opcional: agregar tiempo de expiración
}

// Middleware para verificar el token
function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "No se proporcionó ningún token." });
    }

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "El token no es válido." });
        }
        req.userId = decoded.id;
        next();
    });
}

//crear usuario hasheado 
// Crear Usuario

router.post("/createUser", async (req, res) => {
    try {
        // Verificar si el usuario ya existe
        const existingUser = await Usuario.findOne({ correo: req.body.correo });
        if (existingUser) {
            return res.status(400).json({ message: "El usuario ya existe." });
        }

        // Encriptar la contraseña
        const hashedPassword = await bcryptjs.hash(req.body.clave, 7);

        // Crear un nuevo objeto de usuario con la contraseña encriptada
        const newUser = new Usuario({
            ...req.body,
            clave: hashedPassword
        });

        // Guardar el nuevo usuario en la base de datos
        const savedUser = await newUser.save();
        res.status(201).json({ message: "Usuario creado exitosamente.", Usuario: savedUser });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el usuario.", error: error.message });
    }
});


//editar Usuario
router.patch("/EditUser/:id", async (req, res) => {
    try {
        // Si se proporciona una nueva contraseña, encriptarla antes de actualizar el usuario
        if (req.body.clave) {
            const hashedPassword = await bcryptjs.hash(req.body.clave, 7);
            req.body.clave = hashedPassword;
        }

        // Encuentra y actualiza el usuario con el ID proporcionado
        const updatedUser = await Usuario.findOneAndUpdate(
            { _id: req.params.id },
            { $set: req.body },
            { new: true }
        );
        
        // Si no se encontró el usuario, devuelve un mensaje de error
        if (!updatedUser) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        
        

        // Si se actualizó correctamente, devuelve el usuario actualizado
        res.json(updatedUser);
    } catch (error) {
        // Manejo de errores: devuelve un mensaje de error y el estado 500 (Error del servidor)
        res.status(500).json({ message: "Error al actualizar el usuario.", error: error.message });
    }
});


// get para mostrar todos los usuarios
router.get("/GetAll",(req,res)=> {
    Usuario.find()
        .then(datos => res.json ({Usuario:datos}))
        .catch(error => res.json ({mensaje: error}));

});


// Ruta para obtener información del usuario autenticado
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await Usuario.findById(req.userId, { password: 0 });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error al buscar al usuario.", error: error });
    }
});


//////////////////////////////////////////////////////////////////


//Buscar por Id
router.get("/SearchById/:_id",(req,res)=> {
    const {_id} = req.params;
    Usuario.find({_id: _id})
        .then(datos => res.json ({Usuario:datos}))
        .catch(error => res.json ({mensaje: error}));
});

//Buscar por Documento 
router.get("/SearchByDocument/:documento",(req,res)=> {
    const {documento} = req.params;
    Usuario.find({documento: documento})
        .then(datos => res.json ({Usuario:datos}))
        .catch(error => res.json ({mensaje: error}));
});

//Buscar por Correo 
router.get("/SearchByEmail/:correo",(req,res)=> {
    const {correo} = req.params;
    Usuario.find({correo: correo})
        .then(datos => res.json ({Usuario:datos}))
        .catch(error => res.json ({mensaje: error}));
});



//Buscar por Nombre 
router.get("/SearchByName/:nombre",(req,res)=> {
    const {nombre} = req.params;
    Usuario.find({nombre: nombre})
        .then(datos => res.json ({Usuario:datos}))
        .catch(error => res.json ({mensaje: error}));
});


//Buscar por Apellido 
router.get("/SearchByLastName/:apellido",(req,res)=> {
    const {apellido} = req.params;
    Usuario.find({apellido: apellido})
        .then(datos => res.json ({Usuario:datos}))
        .catch(error => res.json ({mensaje: error}));
});



// Desactivar Usuario
router.patch("/DisableByUser/:id", (req, res) => {
    Usuario.updateOne(
        { _id: req.params.id },
        {
            $set: {
                estado: "inactivo" //  para inactivar usuario 
            }
        }
    )
    .then(() => {
        res.status(200).json({ message: "Usuario desactivado exitosamente." });
    })
    .catch((err) => {
        res.status(500).json({ message: "Error al desactivar al usuario.", error: err });
    });
});

// Activar usuario Usuario
router.patch("/EnableByUser/:id", (req, res) => {
    Usuario.updateOne(
        { _id: req.params.id },
        {
            $set: {
                estado: "Activo" //  para activar usuario 
            }
        }
    )
    .then(() => {
        res.status(200).json({ message: "Usuario activado exitosamente." });
    })
    .catch((err) => {
        res.status(500).json({ message: "Error al activar al usuario.", error: err });
    });
});

//cerrar seccion 
router.post("/logout", (req, res) => {
    try {
       
         res.clearCookie("token"); 
        
        // Envía una respuesta exitosa al cliente.
        res.status(200).json({ message: "Sesión cerrada exitosamente." });
    } catch (error) {
        // Manejo de errores si ocurre algún problema al cerrar sesión
        res.status(500).json({ message: "Error al cerrar sesión.", error: error.message });
    }
});

// Ruta para eliminar todos los usuarios por id
router.delete("/Delete/:id", async (req, res) => {
    try {
        // Utiliza el método findByIdAndDelete() para eliminar el usuario por su ID
        const deletedUser = await Usuario.findByIdAndDelete(req.params.id);
        
        // Si el usuario no existe, devuelve un mensaje de error
        if (!deletedUser) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        
        // Si se eliminó correctamente, devuelve un mensaje de éxito
        res.status(200).json({ message: "Usuario eliminado exitosamente." });
    } catch (error) {
        // Manejo de errores: devuelve un mensaje de error y el estado 500 (Error del servidor)
        res.status(500).json({ message: "Error al eliminar el usuario.", error: error.message });
    }
});

//metodo funciona para poder validar los objetos de la base de datos aqui voy a mandar a validar el correo y cedula
router.post("/ValidateCorreoCedula", async (req, res) => {
    const { correo, documento } = req.body;

    try {
        const user = await Usuario.findOne({ correo, documento });
        console.log(user)
        if (user) {
            res.status(200).json({ isValid: true });
        } else {
            res.status(400).json({ isValid: false, message: "Correo o cédula incorrectos." });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al validar correo y cédula.", error: error.message });
    }
});

export default router;


router.patch("/changePassword", async (req, res) => {
    const { correo, clave } = req.body;

    try {
        // Encriptar la nueva contraseña
        const hashedPassword = await bcryptjs.hash(clave, 7);

        // Buscar al usuario por correo
        const user = await Usuario.findOne({ correo });

        // Verificar si se encontró al usuario
        if (!user) {
            return res.status(400).json({ success: false, message: "Usuario no encontrado." });
        }

        // Actualizar la contraseña del usuario
        user.clave = hashedPassword;
        await user.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar la contraseña.", error: error.message });
    }
});