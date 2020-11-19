# Sobre

ORCL é uma alternativa simples de executar comandos simples dentro de um banco database Oracle 12x.

# Dependências

- É necessário que tenha instalado o cliente SQLPlus correspondente ao seu banco de dados.

# Instalação

- Execute o comando <b>npm install --save sm-orcl</b> para obter o pacote.

# Usando

- Em seu arquivo realize o import do modulo.

```javascript
  const ORACLE = require('sm-orcl')
  const orcl = new ORACLE({
    ip_address: '127.0.0.1',
    username: <username>,
    passowrd: <password>,
    service_name: <servicename>,
    port: <port> //Default is 1521
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
  let user = {
    name: 'Fulano Sauro',
    idade: 23,
    sexo: 'masculino'
  }
  orcl.insert({table: 'ex_user', data: user}).then((data)=>{
    console.log(data)
  }).catch(err => console.error(err))
...
```

- Exemplo de delete com/sem where
- Se informar que **deleteAll**:**false** vai respeitar a regra do where se estiver como **deleteAll**:**true** ele irá ignorar o where.

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let whereData = { id: 1, email_address: "fulano@ciclano.me" }
    orcl.delete({table: 'ex_user', deleteAll: false, where: whereData}).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de update com/sem where
- Se informar que **updateAll**:**false** vai respeitar a regra do where se estiver como **updateAll**:**true** ele irá ignorar o where.

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let whereData = { id: 1, email_address: "fulano@ciclano.me" }
    orcl.update({table: 'ex_user', updateAll: false, where: whereData }).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```

- Exemplo de query native

```javascript
  ...
    const orcl = new Oracle(dbora.auth)

    let user = {
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

# DMLS
Recurso de DML é usado para criação, update e deleção de tabelas.

- Exemplo de uma nova tabela
- **ATENÇÃO**: Por default as informações de **nullable**,**pk** e **unique** são **false**

```javascript
  ...
    const orcl = new Oracle(dbora.auth)

    let data = {
      table: "EX_TESTE",
      columns: [{
        name: "id",
        dataType: "number",
        length: "",
        nullable: true,
        pk: true,
        unique: true,
      }, 
      {
        name: "name",
        dataType: "varchar2",
        length: "(50)",
        nullable: true,
        pk: false,
        unique: true,
      }, 
      {
        name: "idade",
        dataType: "number",
        length: "",
        nullable: false,
        pk: false,
        unique: true,
      }],
      trigger: true
    }

   orcl.createTable({
     table: data.table, 
     columns: data.columns, 
     trigger: data.trigger
     }).then((data)=>{
      console.log(data)
    }).catch(err => console.error(err))
  ...
```