import mongoose from "mongoose";

//conexion bd
export const conexionDB = async () => {

    try {

        await mongoose.connect('mongodb+srv://UTS:uts2024@uts.ccyqodk.mongodb.net/Dev2024E191?retryWrites=true&w=majority&appName=UTS/Usuario')
        console.log('Base de datos conectada correctamente');
    } catch (error) {
        console.log(error);
    }

}

