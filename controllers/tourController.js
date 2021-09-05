const multer = require('multer'); // handle file uploads
const sharp = require('sharp'); // Image manipulation
const Tour = require('../models/tourModel'); // el modelo viene de mongoose.model('Nombre',schema)
const catchAsync = require('../utils/catchAsync'); // helper para evitar usar try{} catch{} en funciones async
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(
            new AppError('Not an image! Please upload only images.', 400),
            false
        );
    }
};

const upload = multer({
    storage: multerStorage,
    filter: multerFilter,
});
// fields() Accept a mix of files, specified by fields https://github.com/expressjs/multer
exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 }, // One field called imageCover
    { name: 'images', maxCount: 3 }, // Up to 3 fields called images
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    console.log(req.files); // es .files cuando son varios archivos, viene de multer

    if (req.files.imageCover) {
        // 1) process cover image
        req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; // pasamos el nombre req.body (esto se insertará a la BD)

        // Procesamos la imagen
        await sharp(req.files.imageCover[0].buffer) // .buffer porque esta en la memoria
            .resize(2000, 1333) // Tamaño y aspecto 1:1
            .toFormat('jpeg') // Siempre en jpg
            .jpeg({ quality: 90 }) // Calidad
            .toFile(`public/img/tours/${req.body.imageCover}`); // Guardamos en el disco, el nombre va en bd
    }

    if (req.files.images) {
        // 2 process other images
        req.body.images = []; // inicializamos un array vacio donde irán los nombres de las imágenes
        // Con Promise.all() esperamos a que todas las imagenes estén procesadas antes de seguir a next()
        await Promise.all(
            req.files.images.map(async (img, index) => {
                // Creamos el nombre de la foto
                const fileName = `tour-${req.params.id}-${Date.now()}-${
                    index + 1
                }.jpeg`;
                // Procesamos la imagen
                await sharp(img.buffer)
                    .resize(2000, 1333)
                    .toFormat('jpeg')
                    .jpeg({ quality: 90 })
                    .toFile(`public/img/tours/${fileName}`);
                // Agregamos el nombre a req.body
                req.body.images.push(fileName);
            })
        );
    }

    next();
});

// Al inciar la definición de una función con exports.<funcion> es parte del objeto module.exports
// Alias top 5 tours
exports.topTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,difficulty';
    next();
};
// Crear tour
exports.createTour = factory.createOne(Tour);
// Obtener tour
exports.getTour = factory.getOne(Tour, {
    path: 'reviews',
    select: 'review -_id -tour',
});
// Obtener tours con APIFeatures
exports.getTours = factory.getMany(Tour);
// Actualizar tour
exports.updateTour = factory.updateOne(Tour);
// Borrar tour
exports.deleteTour = factory.deleteOne(Tour);
// Tour stats
exports.getTourStats = catchAsync(async (req, res, next) => {
    // Aggregate entrega datos de acuerdo a varias fases
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                _id: '$difficulty',
                numTours: { $sum: 1 },
                avgRating: { $avg: '$ratingsAverage' },
                averagePrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        // {
        //     $sort: { averagePrice: 1 },
        // },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1; //2021
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTours: { $sum: 1 },
                tours: { $push: '$name' },
            },
        },
        {
            $addFields: { month: '$_id' },
        },
        {
            $project: {
                _id: 0,
                month: 1,
                numTours: 1,
                tours: 1,
            },
        },
        {
            $sort: { numTours: -1 },
        },
        {
            $limit: 12,
        },
    ]);
    res.status(200).json({
        status: 'success',
        results: plan.length,
        data: {
            plan,
        },
    });
});

// '/tours-within/:distance/center/:latlng/unit/:unit
// tours-within/300/center/34.11685657542257,-118.12886507570711/unit/km
exports.getToursWithin = catchAsync(async (req, res, next) => {
    // pasamos los params a variables
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    // radius es nuestra distancia convetida a radiantes que es la unidad que requiere mongodb para la query geoespacial (distancia / el radio de la tierra)
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng)
        next(new AppError('Please provide valid lat and lng', 400));

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                // en JSON se una primeto longitud y despues latitud
                $centerSphere: [[lng, lat], radius],
            },
        },
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

// Calcular distancias
// distances/45,-40/unit/km
exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'km' ? 0.001 : 0.000621371;

    if (!lat || !lng)
        return next(new AppError('Please provide valid lat and lng', 400));
    // las etapas de aggregate se pasan por medio de un array
    const distances = await Tour.aggregate([
        {
            // requiere index al menos una propiedad con index geoespacial
            $geoNear: {
                near: {
                    type: 'Point',
                    // Se usa primero longitud, multiplicamos por 1 para convertir a números
                    coordinates: [lng * 1, lat * 1],
                },
                distanceField: 'distance', // nos entrega la distancia en metros
                distanceMultiplier: multiplier, // convertimos a la unidad indicada en params
            },
        },
        {
            // selecionamos las propiedades que deseamos mostrar
            $project: {
                distance: 1,
                name: 1,
            },
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances,
        },
    });
});
