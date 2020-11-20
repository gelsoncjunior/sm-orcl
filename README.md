# Sobre

sm-orcl é uma alternativa simples de executar comandos simples dentro de um banco database Oracle <= 12.2.0.

# Dependências

É necessário que tenha instalado o cliente SQLPlus correspondente ao seu banco de dados.

* <a href="https://docs.oracle.com/cd/B19306_01/server.102/b14357/ape.htm">How to install SQLPlus client</a>

# Instalação

Execute o comando <b>npm i sm-orcl</b> para obter o pacote.

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
  let payload = {
    name: 'Fulano Sauro',
    idade: 23,
    sexo: 'masculino'
  }
  orcl.insert({table: 'ex_user', data: payload}).then((data)=>{
    console.log(data)
  }).catch(err => console.error(err))
...
```

- Exemplo de delete com/sem where
- Se informar que **deleteAll**:**false** vai respeitar a regra do where se estiver como **deleteAll**:**true** ele irá ignorar o where.

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let payload = { id: 1, email_address: "fulano@ciclano.me" }
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
    let payloadData = { email_address: "ciclano@fulano.you" }
    let payload = { id: 1, email_address: "fulano@ciclano.me" }
    orcl.update({table: 'ex_user', updateAll: false, where: payload }).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de query native

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let payload = {
      name: 'Fulano Sauro',
      idade: 23,
      sexo: 'masculino'
    }

    orcl.query(`
      inset into ex_user ( name, idade, sexo ) values ( 
        '${user.name}', '${user.idade}', '${user.sexo}' 
      );
      exec EX_CREATEUSER( 
        name => ${user.name},
        idade => ${user.idade},
        sexo => ${user.sexo}
      );
      select name from ex_user;
    `).then((data)=>{
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

- Exemplo de uma delete table

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    orcl.delete_table({
      table: "EX_USER"
      }).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de uma truncate table

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    orcl.truncate_table({
      table: "EX_USER"
      }).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```