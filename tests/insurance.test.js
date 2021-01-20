'use strict'

var assert = require('assert')
var supertest = require('supertest')
var http = require ('http')
var app = require('../app')

const listenPort = 8080
const bearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiQWRtaW5zIn0.PCuhWkAojdalNIDdSjAMtZ9dO1oJT_KfVF1nr__K9CA"

jest.mock('../service/AdminsService')

describe('insurance', function() {
    let server
    let request

    beforeAll(done => {
        server = http.createServer(app)
        server.listen(listenPort, done)
        request = supertest(server)
    })

    describe('POST', function(){

        it('Should return json a 201 status and create item', function(done){
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
            .expect(201, done);
        })

        it('Should return 400 error by mandatory data is missing', function(done){
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

    afterAll(done => {
        // Close http server
        server.close(done)
    })
 })