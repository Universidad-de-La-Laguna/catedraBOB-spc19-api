# SPC19 - COVID-19 Parametric Insurance

## Overview
This service implements the REST API for the SPC19 project. Version 3.0 [OpenAPI-Spec] (https://github.com/OAI/OpenAPI-Specification) is used, and it uses the `oas-tools` library for the interpretation of the specification document (` api/openapi.yaml` ), as well as automatic validation and `JWT` based authentication.

> Este servicio implementa la API REST para el proyecto SPC19. Se  usa la versión 3.0 [OpenAPI-Spec](https://github.com/OAI/OpenAPI-Specification), y utiliza la librería `oas-tools` para la interpretación del documento de especificación (`api/openapi.yaml`), así como la validación automática y la autenticación basada en `JWT`.

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

>Para los tests, se ha mockeado la capa de servicios para usar una base de datos MongoDB en memoria (`mongodb-memory-server`) en lugar de una blockchain, relacionando un documento (objeto json) de la base de datos con un smart contract desplegado en la blockchain.

Execute:

```
npm run test
```

### Access Control

The access control rules are specified in the API specification document itself (`api/openapi.yaml`), in the` x-acl-config` section. For more information, see the documentation for the [accesscontrol](https://www.npmjs.com/package/accesscontrol) and [oas-tools](https://www.npmjs.com/package/oas-tools#3-oasauth) modules.

>Las reglas de control de acceso se especifican en el propio documento de especificación de la API (`api/openapi.yaml`), en la sección `x-acl-config`. Para más información, ver la documentación de los módulos [accesscontrol](https://www.npmjs.com/package/accesscontrol) y [oas-tools](https://www.npmjs.com/package/oas-tools#3-oasauth).

The role must be specified in the `role` field of the payload of the JWT token used. For example, the following token includes the `admin` role and this role can perform the same as the other roles in the system:

> El rol se debe especificar en el campo `role` del payload del token JWT utilizado. Por ejemplo, el siguiente token incluye el rol `admin` y este rol puede realizar lo mismo que el resto de roles del sistema:

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
docker build -t spc19-api .
```

Run container:

```sh
docker run -d --name spc19-api -p 8080:8080 spc19-api
```
