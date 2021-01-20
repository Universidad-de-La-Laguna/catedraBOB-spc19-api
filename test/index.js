'use strict'

 var assert = require('assert')
 var request = require('supertest')
 var app = require('../app.js')

 var request = request("http://localhost:8080")

 const bearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiQWRtaW5zIn0.PCuhWkAojdalNIDdSjAMtZ9dO1oJT_KfVF1nr__K9CA"

 describe('insurance', function() {
     describe('POST', function(){
        //  it('Should return json as default data format', function(done){
        //      request.get('/api/products')
        //          .expect('Content-Type', /json/)
        //          .expect(200, done)
        //  })
         it('Should return json as data format when set Accept header to application/json', function(done){
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
            .expect(200, done);
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
 })