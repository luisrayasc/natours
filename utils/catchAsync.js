// catchAsync nos ayuda a evitar  el patrón try{} catch{} en las funciones asyncronas llamando una función que maneja la promesa o en su caso "atrapa" el error de la misma
module.exports = function (fn) {
    // Retornamos una función anónima que a su vez hace el llamado a la función asyncrona que va envuelta en catchAsync
    return (req, res, next) => {
        fn(req, res, next).catch(next); // Usamos el método .catch() disponible en todas las promesas para atrapar el error y mandarlo a nuestros middlewares para manejar errores
    };
};
