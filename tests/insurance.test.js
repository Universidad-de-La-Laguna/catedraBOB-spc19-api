'use strict'

const supertest = require('supertest')
const app = require('../app')
const appPromise = require('../app').appPromise
const dbHandler = require('./db-handler')

const listenPort = 8080
const adminBearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4iLCJpc3MiOiJVTEwifQ.OiehqHgx47KQqybnFhi3lFqooeFU4b_hfub_f5XcH6A"


// Usar versión mockeada del servicio. Si se quiere usar versión real, basta con comentar la línea correspondiente.
// Las versiones mockeadas usan una persistencia con MongoDB en lugar de blockchain
jest.mock('../service/insurancesService')

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

            request.post('/insurances')
            .send(data)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminBearerToken)
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

            request.post('/insurances')
            .send(data)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminBearerToken)
            .expect('Content-Type', /json/)
            .expect(400, done);
        })

        it('Should return 415 by no body content', function(done){
            request.post('/insurances')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminBearerToken)
            .expect('Content-Type', /json/)
            .expect(415, done);
        })

        it('Should return 409 by insurance already exists', function(done){
            const data = {
                id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
                customerId: "customer1",
                contractDate: "2016-08-29T09:12:33.001Z",
                startDate: "2016-08-29T09:12:33.001Z",
                finishDate: "2016-08-29T09:12:33.001Z",
                assuredPrice: 4.51
            }

            request.post('/insurances')
            .send(data)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminBearerToken)
            .expect('Content-Type', /json/)
            .expect(409, done)
        })

    })

    afterAll(async done => {
        // Close http server
        server.close(done)

        // Close database
        await dbHandler.closeDatabase()
    })
 })