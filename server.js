// server.js inicia el servidor de nuestra app, agregamos un script a package.json para iniciarlo con el comando 'nmp start'
const mongoose = require('mongoose'); // ODM for mongo DB

const dotenv = require('dotenv'); // Para declarar las variables env de config.evn

// Catch uncaughtException (sync errors)
process.on('uncaughtException', (error) => {
    console.log(
        `WE HAVE AN ERROR\nError name: ${error.name}, \nError Message: ${error.message}`
    );
    console.log(error);
    process.exit(1);
});

dotenv.config({ path: './config.env' }); // Definimos path de config.env

const app = require('./app'); // Nuestra app

// console.log(process.env);
const database = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
); // Contiene el connection string de mongodb, se remplaza el password con el que contiene process.env.DATABASE_PASSWORD

mongoose
    .connect(database, {
        // Mensajes para notas de depreciación
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    // La conexión entrega una promesa
    .then(() => {
        console.log('DB connection successful');
    })
    // En caso de no cumplirse la promesa atrapamos el error
    .catch((error) => {
        console.log('DB connection failed!');
        console.log(error);
    });

// Definimos el puerto
const port = process.env.PORT || 3000;

// Iniciamos el servidor
const server = app.listen(port, () => {
    console.log(`Listening... running on port ${port}`);
});

// Catch unhandledRejections (async errors)
process.on('unhandledRejection', (error) => {
    console.log(
        `WE HAVE AN ERROR\nError name: ${error.name}, \nError Message: ${error.message}`
    );
    server.close(() => {
        process.exit(1);
    });
});
