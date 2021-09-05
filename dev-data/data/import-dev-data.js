const mongoose = require('mongoose'); // ODM para mongodb
const dotenv = require('dotenv'); // Para variavles env
const fs = require('fs'); // Interactuar con el filesystem
const Tour = require('../../models/tourModel'); // Modelo de Tour
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

dotenv.config({ path: './config.env' }); // Iniciamos las variables env (contienen la URI y PASS de DB)

console.log(process.env.DATABASE);

const database = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
); // generamos el URI de la BD

// Nos conectamos a la base de datos
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

// Cargamos nuestros datos desde un archivo .json / JSON.parse() los convierte a objetos JS
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// Esta función importa los datos
const importData = async () => {
    try {
        await Tour.create(tours);
        await Review.create(reviews);
        await User.create(users, { validateBeforeSave: false });
        console.log('Data successfylly loaded!');
        process.exit();
    } catch (error) {
        console.log(error);
    }
};

// Y esta los elimina
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfylly deleted!');
        process.exit();
    } catch (error) {
        console.log(error);
    }
};

// La variable process.argv es un array con los argumentos de la línea de comando, así indicamos desde el shell que función activar
if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

/* ¿Cómo correr el script? 

$ node ./dev-data/data/import-dev-data.js --delete
$ node ./dev-data/data/import-dev-data.js --import

*/
