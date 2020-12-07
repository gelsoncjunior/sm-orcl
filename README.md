# Sobre

sm-orcl é uma alternativa simples de executar comandos simples dentro de um banco database Oracle ```<= 12.2.0```.

# Dependências

Esse pacote so funciona em ambiente ```Linux e MacOS``` com o [SQLClient instalado](https://docs.oracle.com/cd/B19306_01/server.102/b14357/ape.htm), em breve será adaptado para inclusão do Windows.

É necessário que tenha instalado o cliente SQLPlus correspondente ao seu banco de dados.

- [How to install SQLPlus client](https://docs.oracle.com/cd/B19306_01/server.102/b14357/ape.htm)

# Instalação

- Execute o comando para obter o pacote. ``` npm install --save sm-orcl ```

# Usando

- Em seu arquivo realize o import do modulo.

```javascript
  const ORACLE = require('sm-orcl')
  const orcl = new ORACLE({
    ip_address: '0.0.0.0',
    username: 'username',
    passowrd: 'password',
    service_name: 'servicename',
    port: 'port' //Default is 1521
  })
```
# Comandos

- keepAliveDb verifica disponibilidade, **status**:**0** é não conectou e **status**:**1** conectou corretamente.

```javascript
...
  const orcl = new Oracle(dbora.auth)
  orcl.keepAliveDb().then((data)=>{
    console.log(data)
  }).catch(err => console.error(err))
...
```

- Exemplo de insert

```javascript
...
  const orcl = new Oracle(dbora.auth)
  let payloadData = {
    idade: 23
  }
  
  let payload = {
    name: 'Fulano Sauro',
    idade: 23,
    sexo: 'masculino'
  }
  orcl.insert({
      table: 'ex_user', 
      data: payload, 
      where: payload // Ou use handsFreeWhere Ex: handsFreeWhere: `id = 1 and name = "Fulano"`
    }).then((data)=>{
    console.log(data)
  }).catch(err => console.error(err))
...
```

- Exemplo de delete com/sem where
- Se informar que **deleteAll**:**false** vai respeitar a regra do where se estiver como **deleteAll**:**true** ele irá ignorar o where.

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let payload = { id: 1, email_address: "fulano@ciclano.me" } // Ou use handsFreeWhere Ex: handsFreeWhere: `id = 1 and name = "Fulano"`
    orcl.delete({table: 'ex_user', deleteAll: false, where: payload}).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de update com/sem where
- Se informar que **updateAll**:**false** vai respeitar a regra do where se estiver como **updateAll**:**true** ele irá ignorar o where.

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let payloadData = { email_address: "ciclano@fulano.you" } // Ou use handsFreeWhere Ex: handsFreeWhere: `id = 1 and name = "Fulano"`
    let payload = { id: 1, email_address: "fulano@ciclano.me" }
    orcl.update({table: 'ex_user', updateAll: false, where: payload }).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de select

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let payload = {
      table: "EX_USER",
      columns: ["id", "name", "email_address", "modified_date", "created_by"],
      where: {
        name: "Fulano",
        email_address: "fulano@ciclano.me"
      }, // Ou use handsFreeWhere Ex: handsFreeWhere: `id = 1 and name = "Fulano"`
    }

    orcl.select(payload).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de execute procedure

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let payload = {
      procedure_name: "CREATE_USER",
      data: {
         name: 'Fulano Sauro',
         idade: 23,
         sexo: 'masculino'
         }
    }

    orcl.exec_procedure(payload).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de execute exec_function

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let payload = {
      function_name: "CREATE_USER",
      data: {
         name: 'Fulano Sauro',
         idade: 23,
         sexo: 'masculino'
         } 
    }

    orcl.exec_function(payload).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

# DMLs
Recurso de DML é usado para criação, atualização e deleção de tabelas, para usufruir desses comandos é necessário que o usuário informado tenha grant de create/update/delete no schema.

- Exemplo de uma nova tabela
- **ATENÇÃO**: Por default as informações de **nullable**, **pk** e **unique** são **false**

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let payload = {
      table: "EX_TESTE",
      columns: [{
        name: "id",
        dataType: "number",
        length: "",
        nullable: true,
        pk: true,
        unique: true,
        seq: true
      }, 
      {
        name: "name",
        dataType: "varchar2",
        length: "(50)",
      }, 
      {
        name: "idade",
        dataType: "number",
        length: "",
      }],
      trigger: true
    }

    orcl.create_table({
      table: payload.table, 
      columns: payload.columns, 
      trigger: payload.trigger
      }).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de uma drop table
- **ATENÇÃO**: Por default as informações de **cascade** são **false**.

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    orcl.drop_table({
      table: "EX_USER",
      casc: true
      }).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de uma truncate table

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    orcl.truncate({
      table: "EX_USER"
      }).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

# Colaboradores

[![](https://avatars1.githubusercontent.com/u/21075731?s=100&u=4a08ddc1d3d111898e0933a1507e7ef7999bcaf4&v=4)](https://github.com/gelsoncjunior)

# Pague um café

- Use o PIX, escaneia o QRCode abaixo

<img src="https://i.ibb.co/VVxsZ1f/Whats-App-Image-2020-12-04-at-21-09-50.jpg" height="200" />