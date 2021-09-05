const multer = require('multer'); // Upload files (user images)
const sharp = require('sharp'); // image manipulation
const User = require('../models/userModel'); // Objeto que contiene todos los documentos de clase user
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory'); // Controllers genéricos

const multerStorage = multer.memoryStorage();

//  function to control which files should be uploaded and which should be skipped
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Please upload an image file', 400), false);
    }
};
// creamos objeto upload y sus settings
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

// Subir foto de users single()-> un archivo 'photo' seleccionar campo 'photo'
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next(); // Si no hay archivo en el request pasamos al siguiente middleware
    // Nombramos el archivo (lo usa updateMe para guardarlo en BD)
    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500) // Tamaño y aspecto 1:1
        .toFormat('jpeg') // Siempre en jpg
        .jpeg({ quality: 90 }) // Calidad
        .toFile(`public/img/users/${req.file.filename}`); // Guardamos en el disco

    next();
});

// Función para filtrar campos permitidos para modificar
const filterFields = (reqBody, ...allowedFields) => {
    const filteredBody = {};
    Object.keys(reqBody).forEach((field) => {
        if (allowedFields.includes(field)) filteredBody[field] = reqBody[field];
    });
    return filteredBody;
};

// Obtener todos los usuarios
exports.getAllUsers = factory.getMany(User);

// Obtener información del usuario actual
exports.getMe = (req, res, next) => {
    // Pasamos el id del usuario actual a req.params.id
    req.params.id = req.user._id;
    next();
};

// Función para actualizar información de la cuenta
exports.updateMe = catchAsync(async (req, res, next) => {
    // Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm)
        return next(new AppError('This route is not for password update', 400));

    // Update user document
    const filteredBody = filterFields(req.body, 'name', 'email');

    // Si hay un req.file agregamos el nombre a la bd para constuir la ruta
    if (req.file) filteredBody.photo = req.file.filename;

    // Use findByIdAndUpdate for non-sensitive data
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        status: 'success',
        message: 'Accout data was updated successfully',
        data: { user: updatedUser },
    });
});

exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User); // Do not change passwords with this one!

exports.deleteUser = factory.deleteOne(User);

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.createUser = (request, response) => {
    response.status(500).json({
        status: 'error',
        message: 'not implemented and never will be, please use signup',
    });
};
