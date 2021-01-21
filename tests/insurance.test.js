'use strict'

const supertest = require('supertest')
const app = require('../app')
const appPromise = require('../app').appPromise
const dbHandler = require('./db-handler')

const listenPort = 8080
const bearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiQWRtaW5zIiwiaXNzIjoiVUxMIn0.8OnHWKLoPiwEJNsT_ucbBQC7yg3h2wTKvwPhhZ5HXoM"


// Usar versión mockeada del servicio. Si se quiere usar versión real, basta con comentar la línea correspondiente.
// Las versiones mockeadas usan una persistencia con MongoDB en lugar de blockchain
jest.mock('../service/AdminsService')

describe('insurance', function() {
    let server
    let request

    beforeAll(async () => {
        // start db
        await dbHandler.connect()

        // start server
        await appPromise
        server = await app.listen(listenPort)
        request = supertest(server)
    })

    describe('POST', function(){

        it('Should return json a 201 status and create item', done => {
            const data = {
                id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
                customerId: "customer1",
                contractDate: "2016-08-29T09:12:33.001Z",
                startDate: "2016-08-29T09:12:33.001Z",
                finishDate: "2016-08-29T09:12:33.001Z",
                assuredPrice: 4.51
            }

            request.post('/insurers/insurance')
            .send(data)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + bearerToken)
            .expect('Content-Type', /json/)
            .expect(201, done)
        })

        it('Should return 400 error by mandatory data (startDate) is missing', function(done){
            const data = {
                id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
                customerId: "customer1",
                contractDate: "2016-08-29T09:12:33.001Z",
                finishDate: "2016-08-29T09:12:33.001Z",
                assuredPrice: 4.51
            }

            request.post('/insurers/insurance')
            .send(data)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + bearerToken)
            .expect('Content-Type', /json/)
            .expect(400, done);
        })

        it('Should return 415 by no body content', function(done){
            request.post('/insurers/insurance')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + bearerToken)
            .expect('Content-Type', /json/)
            .expect(415, done);
        })

    })

    afterAll(async done => {
        // Close http server
        server.close(done)

        // Close database
        await dbHandler.closeDatabase()
    })
 })