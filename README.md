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

### Control de acceso

Las reglas de control de acceso se especifican en el propio documento de especificación de la API (`api/openapi.yaml`), en la sección `x-acl-config`. Para más información, ver la documentación del módulo [accesscontrol](https://www.npmjs.com/package/accesscontrol). 

El rol se debe especificar en el campo `role` del payload del token JWT utilizado. Por ejemplo, el siguiente token incluye el rol `admin` y este rol puede realizar lo mismo que el resto de roles del sistema:

```jwt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4iLCJpc3MiOiJVTEwifQ.OiehqHgx47KQqybnFhi3lFqooeFU4b_hfub_f5XcH6A
```

el payload es:

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022,
  "role": "admin",
  "iss": "ULL"
}
```