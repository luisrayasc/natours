const mongoose = require('mongoose'); // ODM for mongo DB
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Please write your review'],
        },

        rating: {
            type: Number,
            required: [true, 'Review must have a rating'],
            min: [1, 'Rating is in a 1-5 scale'],
            max: [5, 'Rating is in a 1-5 scale'],
        },

        createdAt: {
            type: Date,
            default: Date.now(),
        },

        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },

        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo',
    });

    next();
});

//  Static methods are methods that run from the context of the entire Model and not a specific instance of that Model
// Calcular stats de los reviews de un tour y salvarlos en la base de datos
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // Para aggregate se pasa un array de todas las etapas
    const stats = await this.aggregate([
        // Primero filtramos todos los reviees correspodientes al tour
        {
            $match: { tour: tourId },
        },
        {
            // agrupamos por el tour, contamos {$sum:1} y calculamos el promedio {$avg: '$rating'}
            $group: {
                _id: '$tour',
                nRatings: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    // Actualizamos el tour
    await Tour.findByIdAndUpdate(tourId, {
        ratingsAverage: stats[0].avgRating,
        ratingsCuantity: stats[0].nRatings,
    });
};

// Regla para que un usuario unicamente pueda publicar un review por tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// 'post' middleware does not get access to next()
// Al salvar un review llamamos la funcion Review.calcAverageRatings(tourId)
reviewSchema.post('save', function () {
    // this points to current document after being saved
    // usamos this.constructor porque el model Review aún no ha sido definido
    this.constructor.calcAverageRatings(this.tour);
});

// Cacular estadísticas de reviews cuando uno es actualizado o borrado usamos de hooks findByIdAndUpdate y findByIdAndDelete que es un atajo para findOne...
// El primer párametro de un hook post es el documento o documentos https://mongoosejs.com/docs/middleware.html#post
reviewSchema.post(/^findOneAnd/, (review) => {
    review.constructor.calcAverageRatings(review.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
