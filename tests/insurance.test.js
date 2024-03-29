'use strict'

const supertest = require('supertest')
const app = require('../app')
const appPromise = require('../app').appPromise
const dbHandler = require('./db-handler')
const config = require('../config')

const listenPort = 8080
const adminBearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4iLCJpc3MiOiJVTEwifQ.OiehqHgx47KQqybnFhi3lFqooeFU4b_hfub_f5XcH6A"
const takerBearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoidGFrZXIiLCJpc3MiOiJVTEwifQ.kBqHISpWyPbW5uNnadqCe4BlwyGbULrJHRGv0V-VLQ4"
const insurerBearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiaW5zdXJlciIsImlzcyI6IlVMTCJ9.xrJqsSp4lIp-rI4iHhYcPZnHqgMoa8BUgE-AJWNHTR4"
const laboratoryBearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoibGFib3JhdG9yeSIsImlzcyI6IlVMTCJ9.Y0_Sn23eqGutg-fsbIURb9xpSSEtmwPBMXX_JSrvAvw"
const NEGATIVEPCRHOURSDIFF = 80
const FAKEINSURANCEID = "FAKEINSURANCEID"
const FAKEPCRREQUESTID = "FAKEPCRREQUESTID"
const PCRREQUEST_EXAMPLECONTRACTADDRESS = "0x9e7fb7a7b222a670adf7457cde2beadacaac3a7d"

const _cleanUuid = (uuid) => uuid.replace(/-/g, "")

// Usar versión mockeada del servicio. Si se quiere usar versión real, basta con comentar la línea correspondiente.
// Las versiones mockeadas usan una persistencia con MongoDB en lugar de blockchain
jest.mock('../service/insurancesService')

describe('insurance', function() {
    let server
    let request

    var now = new Date()

    let pcrRequestData = {
        id: "d290f1ee-6c54-4b01-90e6-d701748f0853",
        customerId: "c4f40996-9d12-11eb-a8b3-0242ac130003"
        // requestDate: now.toISOString()
    }    

    let insuranceData = {
        id: "0a8e228d-dc2b-4582-a961-1c52cd316eb2",
        taker: {
            takerId: "d290f1ee-6c54-4b01-90e6-d701748f0852",
            takerNif: "12345678H",
            takerFullName: "My taker full name",
            takerContactAddress: "Example Street, 1",
            takerContactPostalCode: "38001",
            takerContactTown: "My town",
            takerContactLocation: "My location",
            takerContactTelephone: "555123456",
            takerContactMobile: "646123456",
            takerContactEmail: "taker@example.com",
            takerIBAN: "ES7921000813610123456789"
        },
        customers: [
            {
                customerId: "c4f40996-9d12-11eb-a8b3-0242ac130003",
                customerNif: "12345678H",
                customerFullName: "My Full Name",
                customerGender: "MALE",
                customerBirthDate: "2016-08-29T09:12:33.001Z",
                customerTelephone: "555123456",
                customerEmail: "myemail@example.com",
                negativePcrDate: "2021-04-13T09:12:33.001Z",
                negativePcrHash: "0xc8036852526c547c553bdbdc1f577a81ecaf4479f229ae32de640d32eff1c3b5"
            }
        ],
        contractDate: now.toISOString(),
        startDate: now.toISOString(),
        finishDate: now.toISOString(),
        assuredPrice: 50,
        pcrRequests: [
            pcrRequestData
        ]
    }

    beforeAll(async () => {
        // start db
        await dbHandler.connect()

        // start server
        await appPromise
        server = await app.listen(listenPort)
        request = supertest(server)
    })

    describe('POST', function(){

        it('Insurers can not create insurances', done => {
            request.post('/insurances')
            .send(insuranceData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + insurerBearerToken)
            .expect(403, done)
        })

        it('Laboratories can not create insurances', done => {
            request.post('/insurances')
            .send(insuranceData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + laboratoryBearerToken)
            .expect(403, done)
        })

        it('Takers can create insurances', done => {
            request.post('/insurances')
            .send(insuranceData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(201, done)
        })

        it('Should return 400 error by mandatory data (startDate) is missing', done => {
            let fakeInsuranceData = Object.assign({}, insuranceData)
            delete fakeInsuranceData.startDate

            request.post('/insurances')
            .send(fakeInsuranceData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(400, done);
        })

        it('Should return 415 by no body content', done => {
            request.post('/insurances')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(415, done);
        })

        it('Should return 409 by insurance already exists', done => {
            request.post('/insurances')
            .send(insuranceData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(409, done)
        })

        it('Should return 400 error by negative pcr date out of range', done => {
            let fakeInsuranceData = Object.assign({}, insuranceData)

            // Set negativePcrDate to now minus 80 hours (out of range)
            var today = new Date()
            today.setHours(today.getHours() - NEGATIVEPCRHOURSDIFF)
            fakeInsuranceData.negativePcrDate = today.toISOString()

            request.post('/insurances')
            .send(fakeInsuranceData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect(400, done)
        })

    })

    describe('GET Insurances', () => {

        it('Insurers can get insurances', done => {
            request.get('/insurances')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + insurerBearerToken)
            .expect('Content-Type', /json/)
            .expect(200)
            .then( (res) => {
                expect(res.body.length).toEqual(1)
                done()
            })
        })

        it('Takers can get insurances', done => {
            request.get('/insurances')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(200)
            .then( (res) => {
                expect(res.body.length).toEqual(1)
                done()
            })
        })

        it('Laboratories can not get insurances', done => {
            request.get('/insurances')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + laboratoryBearerToken)
            .expect(403, done)
        })

    })

    describe('POST PCR Request', () => {

        it('Should return 403 status by invalid role', done => {
            request.post(`/insurance/${insuranceData.id}/pcrRequests`)
            .send(pcrRequestData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + insurerBearerToken)
            .expect(403, done)
        })

        it('Should return 409 status by pcrRequest already exists', done => {
            request.post(`/insurance/${insuranceData.id}/pcrRequests`)
            .send(pcrRequestData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(409, done)
        })

        it('Should return json a 201 status and create item', async done => {
            let secondPcrRequestData = Object.assign({}, pcrRequestData)
            secondPcrRequestData.id = 'd290f1ee-6c54-4b01-90e6-d701748f0854'

            await request.post(`/insurance/${insuranceData.id}/pcrRequests`)
            .send(secondPcrRequestData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(201)

            //Check pcr request inserted
            request.get('/insurances')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(200)
            .then( (res) => {
                expect(res.body.length).toEqual(1)
                expect(res.body[0].pcrRequests.length).toEqual(2)
                expect(res.body[0].pcrRequests[1].id).toEqual(_cleanUuid(secondPcrRequestData.id))
                done()
            })
        })

        it('Should return 400 status by incomplete pcrRequest', done => {
            let fakePcrRequestData = Object.assign({}, pcrRequestData)
            delete fakePcrRequestData.id

            request.post(`/insurance/${insuranceData.id}/pcrRequests`)
            .send(fakePcrRequestData)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(400, done)
        })

    })

    describe('GET PCR Request', () => {

        it('Should return 403 status by invalid role', done => {
            request.get(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + insurerBearerToken)
            .expect(403, done)
        })

        it('Should return 403 status by invalid role', done => {
            request.get(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect(403, done)
        })

        it('Error because insurerId not exist', done => {
            let fakeInsurerId = 'FAKEINSURERID'

            request.get(`/insurance/${fakeInsurerId}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + laboratoryBearerToken)
            .expect('Content-Type', /json/)
            .expect(400, done)
        })

        it('Error because PCRRequest not exist', done => {
            request.get(`/insurance/${insuranceData.id}/pcrRequests/${FAKEPCRREQUESTID}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + laboratoryBearerToken)
            .expect('Content-Type', /json/)
            .expect(400, done)
        })

        it('Laboratories can get PCRRequest detail', done => {
            request.get(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + laboratoryBearerToken)
            .expect('Content-Type', /json/)
            .expect(200)
            .then( (res) => {
                expect(res.body.id).toEqual(_cleanUuid(pcrRequestData.id))
                done()
            })
        })

    })

    describe('PATCH PCR Request', () => {

        it('Insurers can not update a PCRRequest', done => {
            request.patch(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}?contractaddress=${PCRREQUEST_EXAMPLECONTRACTADDRESS}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + insurerBearerToken)
            .expect(403, done)
        })

        it('Takers can not update a PCRRequest', done => {
            request.patch(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}?contractaddress=${PCRREQUEST_EXAMPLECONTRACTADDRESS}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect(403, done)
        })

        it('Laboratories can update a PCRRequest', async done => {
            let pcrRequestResult = {
                result: "POSITIVE"
            }

            await request.patch(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}?contractaddress=${PCRREQUEST_EXAMPLECONTRACTADDRESS}`)
            .send(pcrRequestResult)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + laboratoryBearerToken)
            .expect('Content-Type', /json/)
            .expect(200)
   
            // Check pcr request updated
            request.get(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + laboratoryBearerToken)
            .expect('Content-Type', /json/)
            .expect(200)
            .then( res => {
                expect(res.body.result).toEqual("POSITIVE")
                done()
            })
        })

    })

    describe('DELETE PCR Request', () => {

        it('Insurers can not delete a PCRRequest', done => {
            request.delete(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + insurerBearerToken)
            .expect(403, done)
        })

        it('Laboratories can not delete a PCRRequest', done => {
            request.delete(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + laboratoryBearerToken)
            .expect(403, done)
        })

        it('Error because insuranceID not exists', done => {
            request.delete(`/insurance/${FAKEINSURANCEID}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(400, done)
        })

        it('Error because pcrRequestId not exists', done => {
            request.delete(`/insurance/${insuranceData.id}/pcrRequests/${FAKEPCRREQUESTID}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(400, done)
        })

        it('Takers can delete a PCRRequest', async done => {
            await request.delete(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + takerBearerToken)
            .expect('Content-Type', /json/)
            .expect(200)
   
            // Check pcr request deleted
            request.get(`/insurance/${insuranceData.id}/pcrRequests/${pcrRequestData.id}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + laboratoryBearerToken)
            .expect('Content-Type', /json/)
            .expect(400, done)
        })

    })

    afterAll(async done => {
        // Close http server
        server.close(done)

        // Close database
        await dbHandler.closeDatabase()
    })
 })