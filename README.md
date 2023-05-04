# SPC19 - COVID-19 Parametric Insurance

## Overview
This service implements the REST API for the SPC19 project. Version 3.0 [OpenAPI-Spec] (https://github.com/OAI/OpenAPI-Specification) is used, and it uses the `oas-tools` library for the interpretation of the specification document (` api/openapi.yaml` ), as well as automatic validation and `JWT` based authentication.

### Run the API service

To run the server, run:

```
npm start
```

To view the Swagger UI interface:

```
open http://localhost:8080/docs
```

### Running tests

For the tests, the services layer has been mocked to use an in-memory MongoDB database (`mongodb-memory-server`) instead of a blockchain, relating a document (json object) of the database with a smart contract deployed on the blockchain.

Execute:

```
npm run test
```

### Access Control

The access control rules are specified in the API specification document itself (`api/openapi.yaml`), in the` x-acl-config` section. For more information, see the documentation for the [accesscontrol](https://www.npmjs.com/package/accesscontrol) and [oas-tools](https://www.npmjs.com/package/oas-tools#3-oasauth) modules.

The role must be specified in the `role` field of the payload of the JWT token used. For example, the following token includes the `admin` role and this role can perform the same as the other roles in the system:

```jwt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4iLCJpc3MiOiJVTEwifQ.OiehqHgx47KQqybnFhi3lFqooeFU4b_hfub_f5XcH6A
```

payload is:

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022,
  "role": "admin",
  "iss": "ULL"
}
```

### Build docker container

To build docker image:

```sh
docker build -t catedrabob-spc19-api .
```

### Execution:

For taker:

```sh
docker run -d \
  --name catedrabob-spc19-api-taker \
  -e NODEROLE=taker \
  -e BESUNODEURL=http://spc19-test-network_member2besu_1:8545 \
  -e BESUNODEWSURL=ws://spc19-test-network_member2besu_1:8546 \
  -e BESUNODEPRIVATEKEY=c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
  -p 7082:8080 \
  --network spc19-test-network_quorum-dev-quickstart \
  catedrabob-spc19-api
```

> Note: this will display a new general contract SPC19. If you want to use an existing one, add the environment variable SPC19CONTRACTADDRESS with the contract address. Example: `-e SPC19CONTRACTADDRESS=0x9e7fb7a7b222a670adf7457cde2beadacaac3a7d`

For insurer:

```sh
docker run -d \
  --name catedrabob-spc19-api-insurer \
  -e NODEROLE=insurer \
  -e BESUNODEURL=http://spc19-test-network_member1besu_1:8545 \
  -e BESUNODEWSURL=ws://spc19-test-network_member1besu_1:8546 \
  -e BESUNODEPRIVATEKEY=8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63 \
  -e SPC19CONTRACTADDRESS=$(docker logs catedrabob-spc19-api-taker | grep "SPC19CONTRACTADDRESS" | sed 's/.*SPC19CONTRACTADDRESS=\(.*\)/\1/') \
  -p 7080:8080 \
  --network spc19-test-network_quorum-dev-quickstart \
  catedrabob-spc19-api
```
> Note: The insurer service instance require of taker instance, because getting SPC19CONTRACTADDRESS value from his logs.

For laboratory:

```sh
docker run -d \
  --name catedrabob-spc19-api-laboratory \
  -e NODEROLE=laboratory \
  -e BESUNODEURL=http://spc19-test-network_member3besu_1:8545 \
  -e BESUNODEWSURL=ws://spc19-test-network_member3besu_1:8546 \
  -e BESUNODEPRIVATEKEY=ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f \
  -p 7084:8080 \
  --network spc19-test-network_quorum-dev-quickstart \
  catedrabob-spc19-api
```