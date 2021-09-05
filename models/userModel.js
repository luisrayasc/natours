const crypto = require('crypto');
const mongoose = require('mongoose'); // Importamos el ODM para mongodb
const validator = require('validator'); // utils para validación
const bcrypt = require('bcryptjs'); // Algortimo de encriptación

// Esquema del modelo
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'user must have a name'],
    },

    email: {
        type: String,
        required: [true, 'user must have an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },

    photo: {
        type: String,
        default: 'default.jpg',
    },

    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
    },

    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlenght: 8,
        select: false, // no saldrá en ningún output
    },

    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        minlenght: 8,
        validate: {
            // This only works on CREATE or SAVE (not in findOneAndUpdate) !!
            validator: function (val) {
                return val === this.password; // La función debe regresar true o false
            },
            message: 'passwords must match',
        },
    },

    passwordChangedAt: {
        type: Date,
    },

    passwordResetToken: String,

    passwordResetExpires: Date,

    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

// pre middleware para encriptar el password en la base de datos y borrar el passwordConfirm
userSchema.pre('save', async function (next) {
    // Guard clause
    if (!this.isModified('password')) return next();

    // Password hashing with bcryp with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm
    this.passwordConfirm = undefined;

    // End of middleware function
    next();
});

// Función middleware para filtrar querys, usamos una regexp para que aplique a cualquier método find***
userSchema.pre(/^find/, function (next) {
    // 'this' points to the current query, solo mostramos usuarios activos
    this.find({ active: { $ne: false } });
    next();
});

// pre middleware para generar el timestamp cuando se modifica el password
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; // Menos un segundo para asegurarnos que el token se crea despues del password
    next();
});

// Instance method -> métodos que tienen todas las instancias creadas por el modelo
// verifyPassword verifica el string enviado en req contra el password hasheado en la bd, regresa true o false
userSchema.methods.verifyPassword = async function (
    candidatePassword,
    userPassword
) {
    // compare(string,hashedpsw)
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimeStamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    // Creamos un token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Guardamos el token encriptado en nuestra base de datos
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Le ponemos 10 minutos de expiración al token generado
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    console.log(resetToken, this.passwordResetToken);

    // Enviamos el token sin encriptación
    return resetToken;
};

// Modelo User para DB
const User = mongoose.model('User', userSchema);
module.exports = User;
