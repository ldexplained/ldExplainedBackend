const Hapi = require('@hapi/hapi');
const Demo_services = require('../services/service');
const crud_services = new Demo_services()



const init = async () => {
    const server = Hapi.server({
        port: 5555,
        host: 'localhost'
    });
    
    server.start();
    console.log(`server running on %s`, server.info.uri);



    // process.on('unhandledRejection', (err) => {
    //     console.log(err);
    //     process.exit(1);
    // });



    //// POST DATA
    server.route({
        method: 'POST',
        path: '/create',
        handler: crud_services.createDataFun
    });


    // READ DATA
    server.route({
        method: 'GET',
        path: '/read/{id}',
        handler: crud_services.ReadData
    })

    // UPDATE DATA BY ID
    server.route({
        method: 'PATCH',
        path: '/update/{id}',
        handler: crud_services.UpdateData
    })


    // DELETE DATA BY ID
    server.route({
        method: 'DELETE',
        path: '/delete/{id}',
        handler: crud_services.DeleteData
    })




};
init();