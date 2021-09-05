// Contiene funciones de controlador genéricas para los modelos, se pasa el mismo (Model) como parámetro

// 1) Importamos utils
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Crea un documento
exports.createOne = (Model) =>
    // catchAsync para manejar promesas y los tres parámetros middleware (req,res,next)
    catchAsync(async (req, res, next) => {
        // Creamos un nuevo documento con la informaciónde req.body
        const newDocument = await Model.create(req.body);
        // Regresamos una respuesta json con la confirmación
        res.status(201).json({
            status: 'success',
            data: {
                newDocument,
            },
        });
    });

// Obtiene un documento
exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        // Hacemos un query sin parámetros populate, populate() obtiene datos de un modelo foreaneo (Review) a partir de la referenciación en Tour
        let query = Model.findById(req.params.id);
        // Si hay popOptions encademos el método populate(), lean() apaga las propiedades virtuales
        if (popOptions) query = query.lean().populate(popOptions);
        // Esperamos el documento
        const document = await query;
        // Sin documento se retorna un error
        if (!document)
            return next(new AppError('No document found with that id'));
        // Enviamos una respuesta json con la confirmación
        res.status(200).json({
            status: 'success',
            data: {
                data: document,
            },
        });
    });

// Obtiene varios documentos
exports.getMany = (Model) =>
    catchAsync(async (req, res, next) => {
        // To allow for nested GET reviews in tour
        let findObj;
        // revisar si hay tourId en req.params y agregarlos al findObj
        if (req.params.tourId) {
            findObj = { tour: req.params.tourId };
        }
        // APIFeatures(query - todos los documentos,queryString - parametros de ordenación y filtrado)
        const features = new APIFeatures(Model.find(findObj), req.query)
            .filter() // Filtra de acuerdo a los params
            .sort() // Ordena los resultados
            .limitFields() // Seleciona los campos a proyectar
            .paginate(); // Límite de resultados y paginación

        const documents = await features.query; //features.query es la query mutada por los métodos

        // Enviar respuesta
        res.status(200).json({
            status: 'success',
            results: documents.length,
            data: {
                documents,
            },
        });
    });

// Actualiza un documento
exports.updateOne = (Model) =>
    // catchAsync para manejar promesas y los tres parámetros middleware (req,res,next)
    catchAsync(async (req, res, next) => {
        // Obtenemos el id del documento mediante los params del URL y las propiedades a actualizar de req.body
        const updatedDocument = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true, // Nos regresa el docummento actualizado
                runValidators: true, // Usa los validadores de modelSchema
            }
        );
        // Si no hay documento
        if (!updatedDocument) {
            // al momento de pasar un param a next() se asume que hay un error
            return next(new AppError('No document found with that id', 404)); // con return terminamos la función
        }
        // Regresamos una respuesta json con la confirmación
        res.status(201).json({
            status: 'success',
            data: {
                updatedDocument,
            },
        });
    });

exports.valDelete = (Model) =>
    catchAsync(async (req, res, next) => {
        // Obtener el documento que se pretende borrar
        const document = await Model.findById(req.params.id);
        if (!document) {
            // al momento de pasar un param a next() se asume que hay un error
            return next(new AppError('No document found with that id', 404)); // con return terminamos la función
        }
        // Revisar si el "dueño" del doc  es igual usuario actual o el usuario  es admin
        if (
            `${document.user._id}` === `${req.user._id}` ||
            req.user.role === 'admin'
        ) {
            next();
        } else {
            next(
                new AppError('You do not have permission to delete this', 401)
            );
        }
    });

// Borra un documento
exports.deleteOne = (Model) =>
    // catchAsync para manejar promesas y los tres parámetros middleware (req,res,next)
    catchAsync(async (req, res, next) => {
        // Obtenemos el id del dodcumento meidante los params del URL
        const document = await Model.findByIdAndDelete(req.params.id);
        // Si no hay documento
        if (!document) {
            // al momento de pasar un param a next() se asume que hay un error
            return next(new AppError('No document found with that id', 404)); // con return terminamos la función
        }
        // Se regresa un json con la respuesta
        res.status(204).json({
            status: 'success',
            data: null,
        });
    });
