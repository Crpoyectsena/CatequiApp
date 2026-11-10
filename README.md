# IENSC

---

### ejemplo sistema académico

Esta **aplicación web** implementa un sistema completo de gestión de usuarios con
operaciones **CRUD** sobre una **base de datos**. Además, incluye **funcionalidades** de **autenticación**, **gestión de sesiones**, un **dashboard interactivo** y un **módulo de perfil de usuario**.

El proyecto integra **estrategias de autenticación seguras**, garantizando la **protección** de las **credenciales** y el **acceso controlado** a las distintas secciones de la aplicación. Su **arquitectura** está pensada para ser **clara, escalable y fácil de mantener**, ofreciendo una **base sólida** para proyectos **académicos y profesionales**.

---

## funcionalidades

- **Gestión de Usuarios**
  - Registro de nuevos usuarios.
  - Autenticación mediante credenciales (login).
  - Cierre de sesión seguro.
  - Visualización y edición del perfil personal.

- **CRUD en la Base de Datos**
  - Creación de registros.
  - Lectura/consulta de información almacenada.
  - Actualización de registros existentes.
  - Eliminación de registros.

- **Autenticación y Seguridad**
  - Estrategias de autenticación seguras.
  - Manejo de sesiones con expiración.
  - Validación de datos de entrada.

- **Interfaz de Usuario**
  - Vista de autenticación (login y registro).
  - Dashboard con información general del usuario.
  - Sección de perfil con datos personales.

- **Arquitectura Escalable**
  - Separación entre frontend, backend y base de datos.
  - Código organizado siguiendo buenas prácticas de desarrollo.

---

## Tecnologías utilizadas

- **JavaScript**
- **Node.js**
- **Express.js**
- **Variables de entorno**
- **JWT**
- **Boom**
- **Bcrypt**
- **EJS**
- **HTML**
- **CSS**
- **EJS**
- **MySQL**
- **MySQLWorkbench**

---

## Empezando

> Siga estos sencillos pasos para poner en funcionamiento una copia local de este proyecto.

### Prerrequisitos

Asegúrese de tener lo siguiente instalado en su máquina:

- [Node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)
- [MySQLWorkbench](https://dev.mysql.com/downloads/workbench/)
- [Postman](https://www.postman.com/downloads/)

#### Extensiones de Visual Studio Code
- [editorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens)


---

## Instalación

1. Clonar el repositorio:

```sh
git clone https://github.com/iensc-software-sena/academic-system-example.git
```

2. Diríjase al directorio del proyecto:

```sh
cd academic-system-example
```

3. Cree el archivo local de variables de entorno desde la plantilla:

```powershell
Copy-Item .env.example .env
```

Cambie las contraseñas de ejemplo antes de iniciar el proyecto. Para Docker local,
mantenga `DB_HOST=127.0.0.1` y `DB_PORT=3355`. No comparta ni suba el archivo `.env`.

4. Instale y ejecute Docker Desktop; luego inicie MySQL:

```sh
docker compose up -d
```

En la primera creación del volumen, MySQL ejecuta automáticamente
`database/init/01-schema.sql` y crea las tablas del sistema. PhpMyAdmin queda disponible
en `http://localhost:8080`.

Si ya existía el volumen `db_data`, los scripts de inicialización no se vuelven a ejecutar.
En ese caso, importe `database/init/01-schema.sql` desde PhpMyAdmin seleccionando la base
`catequi_db`. No elimine el volumen si contiene información que desea conservar.

5. Instale las dependencias del proyecto:

```sh
npm install
```

6. Inicie el servidor de desarrollo:

```sh
npm run dev
```

En una base nueva no hay cuentas predefinidas. Antes de iniciar sesión por primera vez,
cree el administrador inicial desde una terminal interactiva:

```sh
npm run bootstrap:admin
```

El comando solicita los datos de la cuenta, oculta la contraseña y solo permite el alta
cuando todavía no existe un administrador. Asegúrese de que `.env` tenga las credenciales
correctas de MySQL; no use las contraseñas de ejemplo en una base activa.

---

## Uso de la aplicación

Por medio de la aplicación **Postman** se pueden probar las funcionalidades que entrega
la **API**, a través de los siguientes **EndPoints**:

### Módulos del programa de catequesis

Las pantallas de acudientes, catequizandos, grupos, matrículas, actividades y asistencias
permiten consultar, crear, editar y eliminar registros. Sus operaciones requieren la cookie
de autenticación `authentication`.

El registro público está deshabilitado. Un administrador autenticado puede crear cuentas
desde `/app/v1/users/manage`; los únicos roles permitidos son `administrador`, `catequista`,
`acudiente` y `catequizando`. En el formulario, el documento se guarda como identificador de usuario.
La vista y el endpoint `POST /app/v1/users/create` están restringidos a administradores.

### Acceso por roles

La navegación y los endpoints comprueban el rol vigente de la cuenta en la base de datos.
El administrador gestiona personas, grupos y matrículas, y consulta actividades y reportes;
las rutas de escritura de actividades y asistencia no están habilitadas para ese rol.
El catequista solo accede a actividades y asistencias de sus grupos asignados; únicamente
puede crear actividades y registrar asistencia/calificaciones desde la cuadrícula del grupo.
Acudientes y catequizandos acceden en modo de consulta a materiales de sus grupos e historial
de asistencia/calificaciones propio o de sus catequizandos asociados. Las rutas administrativas
responden con `403 Forbidden` cuando el rol no está autorizado.

Para una base ya existente, ejecute una sola vez
`database/migrations/02-normalize-user-roles.sql`. La migración convierte los roles de
administrador heredados `ADMIN`/`administrator`; si hay otros roles históricos, actualícelos
de forma explícita antes de aplicar la restricción. Las instalaciones nuevas reciben esta
restricción desde `database/init/01-schema.sql`.

Las cuentas nuevas con rol `catequista` crean o sincronizan su ficha en `Catequistas`;
el alta desde ese módulo solicita usuario y contraseña inicial y crea la cuenta asociada.
Ambas altas se guardan en una única transacción. En bases existentes, ejecute una sola vez
`database/migrations/03-backfill-catechist-profiles.sql` para crear fichas faltantes a partir
de cuentas catequistas previas. La migración histórica asigna `CC` como tipo de documento;
revise y ajuste ese dato si corresponde a otro tipo.

Las cuentas nuevas con rol `acudiente` crean o sincronizan su ficha en `Acudientes`.
El alta desde el módulo Acudientes solicita usuario y contraseña inicial, y crea la cuenta
y la ficha en una sola transacción. Estas altas desde el módulo están limitadas al administrador.

Las cuentas nuevas con rol `catequizando` también crean o actualizan su ficha en
`Catequizandos` y requieren seleccionar un acudiente existente. El formulario del módulo
Catequizandos crea la cuenta con usuario y contraseña inicial junto con la ficha en una sola
transacción. El documento debe ser numérico porque se usa como identificador en `Users`.
Para bases existentes, aplique una sola vez
`database/migrations/04-allow-catechumen-role.sql` antes de registrar cuentas catequizandas.
Las fichas de catequizandos que ya existían pueden vincularse creando desde Cuentas una
cuenta con el mismo documento; se conservará su registro y se sincronizarán sus datos.

Las calificaciones de asistencia aceptan valores de `1.0` a `5.0`, en incrementos de una
décima, y solo se permiten en actividades marcadas como calificables. La pantalla Asistencias
incluye una cuadrícula filtrada por grupo con estudiantes, actividades, asistencia y notas.
Para bases existentes, aplique una sola vez `database/migrations/05-attendance-grade-range.sql`;
revise antes que no haya calificaciones históricas fuera del rango.

El parámetro `{module}` puede ser `guardians`, `catechumens`, `groups`, `enrollments`,
`activities` o `attendance`.

| Método | Endpoint | Uso |
|---|---|---|
| `GET` | `/app/v1/modules/{module}/listall` | Consultar registros |
| `GET` | `/app/v1/modules/{module}/options` | Consultar opciones para campos relacionados |
| `GET` | `/app/v1/modules/attendance/grid?groupId=1` | Consultar estudiantes y actividades de un grupo |
| `POST` | `/app/v1/modules/attendance/grid` | Guardar asistencia y calificaciones por grupo |
| `POST` | `/app/v1/modules/{module}/listone` | Consultar un registro, body: `{"id": 1}` |
| `POST` | `/app/v1/modules/{module}/create` | Crear, body: `{"record": {...}}` |
| `POST` | `/app/v1/modules/{module}/update` | Actualizar, body: `{"id": 1, "record": {...}}` |
| `POST` | `/app/v1/modules/{module}/delete` | Eliminar, body: `{"id": 1}` |

El formulario de cada pantalla utiliza los campos definidos para su tabla y valida las
relaciones requeridas antes de guardar. Catequistas conserva sus endpoints existentes en
`/app/v1/catechists`.

### Autenticar un usuario
Método: **POST**
EndPoint: **/app/v1/users/login**
Body:
```JSON
{
    "credentials": {
        "userName": "andres0714",
        "password": "pass1234"
    }
}
```
Respuesta:
> Redireccionamiento a la vista de **Dashboard**

---

### Crear un nuevo usuario
Método: **POST**
EndPoint: **/app/v1/users/create**
Este endpoint requiere autenticación y rol `administrador`. El alta pública no está permitida.
Body:
```JSON
{
    "newUserData": {
        "id": 1036543782,
        "userName": "andres0714",
        "password": "pass1234",
        "role": "catequista",
        "email": "andres@example.com",
        "phone": "+57 314 564 2356",
        "firstName": "Andres",
        "middleName": "Felipe",
        "firstLastName": "Lopez",
        "secondLastName": "Morales"
    }
}
```
Respuesta:
```JSON
{
    "success": true,
    "message": "User created successfully"
}
```

---

### Listar un usuario especifico
Método: **POST**
EndPoint: **/app/v1/users/listone**
Body:
```JSON
{
    "id": 1036543782
}
```
Respuesta:
```JSON
{
    "success": true,
    "message": "User found successfully",
    "user": {
        "id": 1036543782,
        "userName": "andres0714",
        "role": "catequista",
        "email": "andres@example.com",
        "phone": "+57 314 564 2356",
        "address": "Calle 23 # 45 - 65",
        "registrationNumber": "20257654321",
        "program": "Ingeniería de sistemas",
        "firstName": "Andres",
        "middleName": "Felipe",
        "firstLastName": "Lopez",
        "secondLastName": "Morales",
        "createdAt": "2025-08-31T23:34:58.000Z",
        "updatedAt": "2025-08-31T23:34:58.000Z"
    }
}
```

---

### Listar todos los usuarios
Método: **GET**
EndPoint: **/app/v1/users/listall**
Body:
> No se envía **ningún objeto JSON** solo el **token** de autenticación en la **Cookie**

Respuesta:
```JSON
{
    "success": true,
    "message": "Users retrieved successfully",
    "users": [
        {
            "id": 1036543782,
            "userName": "andres0714",
            "role": "catequista",
            "email": "andreslopez07@iensch.edu.co",
            "phone": "+57 314 564 2356",
            "address": "Calle 23 # 45 - 65",
            "registrationNumber": "20257654321",
            "program": "Ingeniería de sistemas",
            "firstName": "Andres",
            "middleName": "Felipe",
            "firstLastName": "Lopez",
            "secondLastName": "Morales"
        },
        {
            "id": 1056432342,
            "userName": "laura0817",
            "role": "catequista",
            "email": "lauragomez0817@iensch.edu.co",
            "phone": "+57 315 678 6543",
            "address": "Calle 43 # 62 - 12",
            "registrationNumber": "20257654332",
            "program": "Ingeniería de electrónica",
            "firstName": "Laura",
            "middleName": "Marcela",
            "firstLastName": "Gomez",
            "secondLastName": "Rivera"
        }
    ]
}
```

---

### Actualizar la contraseña de un usuario
Método: **POST**
EndPoint: **/app/v1/users/password**
Body:
```JSON
{
    "credentials": {
        "id": 1056432342,
        "userName": "laura0817",
        "email": "lauragomez0817@iensch.edu.co",
        "newPassword": "contraseña1234"
    }
}
```
Respuesta:
```JSON
{
    "success": true,
    "message": "Password updated successfully"
}
```

---
### Actualizar la información de un usuario
Método: **POST**
EndPoint: **/app/v1/users/update**
Body:
```JSON
{
    "id": 1056432342,
    "newUserData": {
        "userName": "Carlos1706",
        "role": "catequista",
        "email": "carlosalzate1706@iensch.edu.co",
        "phone": "+57 316 789 0543",
        "address": "Calle 43 # 12 - 32",
        "registrationNumber": "20257653212",
        "program": "Ingeniería de mecatrónica",
        "firstName": "Carlos",
        "middleName": "Javier",
        "firstLastName": "Alzate",
        "secondLastName": "Prada"
    }
}
```
Respuesta:
```JSON
{
    "success": true,
    "message": "User updated successfully"
}
```

---

### Eliminar un usuario en especifico
Método: **POST**
EndPoint: **/app/v1/users/delete**
Body:
```JSON
{
    "id": 1056432342
}
```
Respuesta:
```JSON
{
    "success": true,
    "message": "User deleted successfully"
}
```

---

## Contribuciones

Las contribuciones hacen que la comunidad de código abierto sea un lugar increíble 
para aprender, inspirar y crear. Cualquier contribución que realices será muy apreciada.

1. Realice un fork del proyecto  
2. Cree una rama para su funcionalidad (`git checkout -b feature/AmazingFeature`)  
3. Realiza sus cambios y haga un commit (`git commit -m 'Agregar nueva funcionalidad increíble'`)  
4. Haga un push a la rama (`git push origin feature/AmazingFeature`)  
5. Abra un Pull Request

---
## Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.

---

## Contacto
LinkedIn - [cristianco9](https://www.linkedin.com/in/cristianco9/)

---

Enlace al proyecto: [Github]
(https://github.com/iensc-software-sena/academic-system-example)

---

Siéntase libre de modificar este proyecto según sus preferencias y de añadir cualquier información adicional que consideres útil para los usuarios y colaboradores.
