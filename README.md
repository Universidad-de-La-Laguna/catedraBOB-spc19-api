# SPC19 - Seguro paramétrico de COVID-19

## Overview
Este servicio implementa la API REST para el proyecto SPC19. Se usa la versión 3.0 [OpenAPI-Spec](https://github.com/OAI/OpenAPI-Specification), y utiliza la librería `oas-tools` para la interpretación del documento de especificación (`api/openapi.yaml`), así como la validación automática y la autenticación basada en `JWT`.

### Ejecutar el servidor
To run the server, run:

```
npm start
```

To view the Swagger UI interface:

```
open http://localhost:8080/docs
```

### Ejecutar los tests

Para los tests, se ha mockeado la capa de servicios para usar una base de datos MongoDB en memoria (`mongodb-memory-server`) en lugar de una blockchain, relacionando un documento (objeto json) de la base de datos con un smart contract desplegado en la blockchain.

Execute:

```
npm run test
```