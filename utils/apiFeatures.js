// Objeto que acepta como params:
// 1 la query => Model.find() => que regresa todos los documentos de la colección
// 2 la queryString => los parámetros de la URL para la API
// Los métodos filter() sort() limitfields() pagination() que transforman la query
class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    // Este método filtra de acuerdo a los params
    filter() {
        // Hacemos un copia firme de los parámetros de request.query (se usa deconstrucción y luego paquetación)
        const queryObj = { ...this.queryString };

        // Eliminamos los parámetros reservados para 'page', 'sort', 'limit', 'fields'
        const exclude = ['page', 'sort', 'limit', 'fields'];
        exclude.forEach((element) => delete queryObj[element]);

        // Agregamos '%' al inicio de los operadores de mongodb
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(
            /\b(gte)|(gt)|lte|lt\b/g, // ubicamos los operadores usando reg exp
            (match) => `$${match}` // agregamos '$' al inicio
        );

        // filtramos la query de acuerdo a los params
        this.query = this.query.find(JSON.parse(queryString));

        return this; // Necesario para llamar métodos en cadena
    }

    sort() {
        // Revisamos si hay el parametro sort
        if (this.queryString.sort) {
            // Transformamos el string mongoose requiere params separados por estapacios => "sort1 sort2 sort3"
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('name'); // si no hay ordenamos por nombre
        }

        return this;
    }

    limitFields() {
        // Revisamos si hay param fields
        if (this.queryString.fields) {
            // Transformamos el string mongoose requiere params separados por estapacios => "field1 field2 field3"
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v'); // remueve el campo '__v' de la proyección
        }

        return this;
    }

    paginate() {
        // Si no hay params ponemos por defecto usando Short-circuit evaluation
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
