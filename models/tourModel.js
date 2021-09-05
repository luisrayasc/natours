const mongoose = require('mongoose'); // ODM for mongo DB
const slugify = require('slugify'); // Crea slugs in base al nombre de cada tour
const validator = require('validator'); // 3rd party validator
// const User = require('./userModel'); // Modelo User (contiene métodos para interactuar con los docs user)

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'tour must have a name'],
            unique: true,
            trim: true,
            maxlenght: [
                40,
                'A tour name must have less or equal than 40 characters ',
            ],
            minlenght: [
                10,
                'A tour name must have more or equal than 10 characters ',
            ],
            validate: {
                validator: function (val) {
                    return validator.isAlpha(val, ['es-ES'], {
                        ignore: ' ',
                    });
                },
                message: 'Use only characters',
            },
        },

        slug: String,

        duration: {
            type: Number,
            required: [true, 'tour must have a duration'],
        },

        maxGroupSize: {
            type: Number,
            required: [true, 'tour must have a a group size'],
        },

        difficulty: {
            type: String,
            required: [true, 'tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message:
                    'Invalid difficulty, must be easy, medium or difficult ',
            },
        },

        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below or equal to 5.0'],
        },

        ratingsCuantity: {
            type: Number,
            default: 0,
        },

        price: {
            type: Number,
            required: [true, 'tour must have a price'],
        },

        priceDiscount: {
            type: Number,
            validate: {
                validator: function (priceDiscount) {
                    // this keyword only works in create not in update
                    return priceDiscount < this.price;
                },
                message: 'Discount price must be below price!',
            },
        },

        summary: {
            type: String,
            trim: true, // trim solo funciona en strings, quita el whitespace del principio y el final
        },

        description: {
            type: String,
            trim: true,
            required: [true, 'tour must have a description'],
        },

        imageCover: {
            type: String,
            required: [true, 'tour must have a description'],
        },

        images: {
            type: [String], // Array of strings
        },

        createdAt: {
            type: Date,
            default: Date.now(),
        },

        startDates: [Date],

        // GeoJSON
        startLocation: {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },

        // Embedded documents -> Array within document
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],

        // Array con referencias a otros documentos
        guides: [
            {
                type: mongoose.Schema.ObjectId, // Indicamos que usaremos un Object ID
                ref: 'User', // Perteneciente al modelo 'User' (no requerimos importar el modelo)
            },
        ],

        secret: {
            type: Boolean,
            default: false,
        },
    },
    {
        //Virtuals son propiedades que no persisten en la BD, se calculan al momento de invocar el documento
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for collection
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // necesario para las geospatial querys https://docs.mongodb.com/manual/core/2dsphere/

// Las propiedades virtuales se calculan al momento de invocar el documento, ideal para conversión de unidades (this es el documento)
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// Virtual populate (reviews in tour model)
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

// Document middleware => runs before .save() / .create() (this es el documento)
// .pre() se ejectua antes y .post() después
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// Query middleware
tourSchema.pre(/^find/, function (next) {
    this.find({ secret: { $ne: true } });
    this.time = Date.now();
    next();
});

// Mostrar datos de objetos referenciados de otro modelo
tourSchema.pre(/^find/, function (next) {
    // populate() muestra los datos del los documentos usuario referenciados en tour.guides[] puede afectar el performance ya que realiza una segunda query
    this.populate({
        path: 'guides',
        select: 'name photo role -_id',
    });

    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.time} miliseconds`);
    next();
});

// Agregation middleware
// Hide secret tours
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secret: { $ne: true } } });
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
