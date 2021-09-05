// userRoutes contiene las rutas para cada dirección y método de 'user'

const express = require('express'); // necesitamos express para crear el objeto router

//Importamos los controladores que serán la función callback de cada ruta
const {
    getAllUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe,
    getMe,
    uploadUserPhoto,
    resizeUserPhoto,
} = require('../controllers/userControllers');

const {
    signup,
    login,
    forgotPassword,
    resetPassword,
    updatePassword,
    protect,
    restrictTo,
    logout,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Aplica protect() a todas las rutas después de esta linea
router.use(protect);

router.get('/me', getMe, getUser);
router.patch('/updatePassword', updatePassword);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe); // upload un archivo 'single()' desde campo 'photo'
router.delete('/deleteMe', deleteMe);

// Aplica restrictTo('admin') a todas las rutas después de esta linea
router.use(restrictTo('admin'));

// prettier-ignore
router.route('/')
    .get(getAllUsers)
    .post(createUser);

// prettier-ignore
router.route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

// exportarmos el router
module.exports = router;
