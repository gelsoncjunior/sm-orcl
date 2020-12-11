# Sobre SM-ORCL

É uma alternativa simples de executar comandos simples dentro de um banco database Oracle ```<= 12.2.0```.

# Dependências

- Esse pacote só funciona em ambiente ```Linux e MacOS``` com o [SQLClient instalado](https://docs.oracle.com/cd/B19306_01/server.102/b14357/ape.htm).

- É necessário que tenha instalado o cliente SQLPlus correspondente ao seu banco de dados.  [How to install SQLPlus client](https://docs.oracle.com/cd/B19306_01/server.102/b14357/ape.htm)

- Este pacote foi desenvolvido na versão ```v14.8.0``` do NodeJS, recomendamos o uso do ```nvm``` para selecionar a versão a ser utilizada para melhor experiência, execute o comando: ```nvm use v14.8.0``` em seu terminal.

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

- keepAliveDb verifica disponibilidade do seu banco de dados.

```javascript
...
  const orcl = new Oracle(dbora.auth)
  let response = await orcl.keepAliveDb() 
...
```

------------


- Exemplo de insert

```javascript
...
  const orcl = new Oracle(dbora.auth)
  
  let payload = {
    name: 'Fulano Sauro',
    idade: 23,
    sexo: 'masculino'
  }
  
 let response = await orcl.insert({ table: 'ex_user',  data: payload, })
...
```

------------


- Exemplo de insert com select

```javascript
...
  const orcl = new Oracle(dbora.auth)
  let payloadData = {
    idade: 23
  }
  
  let payload = {
    idade: 23,
    sexo: 'masculino'
  }
  
  let response = await orcl.insertSelect({
  	tablePrimary: 'ex_user',
      columnsPrimary: ["name", "email_address"], 
	  tableSource: 'ex_client', 
	  columnsSource: ["name", "email_address"],
      where: { idade: 23 }  
})
...
```
Obs: Caso queira fazer um **where** mais especifico use **handsFreeWhere** ao inves do **where**.
Ex: 
``` 
 handsFreeWhere: `idade >= 18 and uf = "RJ"`
``` 

------------

- Exemplo de delete com/sem where
- Se informar que ```{ deleteAll: false }```  vai respeitar a regra do **where** e se estiver como ```{ deleteAll: true }``` ele irá ignorar o **where**.

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
	
    let payload = { id: 1, email_address: "fulano@ciclano.me" } 
	
   let response = await orcl.delete({ table: 'ex_user', deleteAll: false, where: payload })
  ...
```

Obs: Caso queira fazer um **where** mais especifico use **handsFreeWhere** ao inves do **where**.
Ex: 
``` 
 handsFreeWhere: `idade >= 18 and uf = "RJ"`
``` 

------------


- Exemplo de Update com/sem where
- Se informar que ```{ updateAll: false }``` vai respeitar a regra do **where** e se estiver como ```{ updateAll: true }``` ele irá ignorar o **where**.

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
	
    let payload = { email_address: "ciclano@fulano.you" } 
	
   let response = await orcl.update({ table: 'ex_user', data: payload, updateAll: false, where: { id: 1, email_address: "fulano@ciclano.me" } })
  ...
```
Obs: Caso queira fazer um **where** mais especifico use **handsFreeWhere** ao inves do **where**.
Ex: 
``` 
 handsFreeWhere: `idade >= 18 and uf = "RJ"`
``` 

------------

- Exemplo de Select

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
	
    let payload = {
      table: "EX_USER",
      columns: ["id", "name", "email_address", "modified_date", "created_by"],
      where: {
        name: "Fulano",
        email_address: "fulano@ciclano.me"
      }, 
    }

    let response = await orcl.select(payload)
  ...
```

Obs: Caso queira fazer um **where** mais especifico use **handsFreeWhere** ao inves do **where**.
Ex: 
``` 
 handsFreeWhere: `idade >= 18 and uf = "RJ"`
``` 

------------

Exemplo de Select retornando todas as colunas, como se fosse: **select * from table_name**
- **ATENÇÃO**: Se colocar columns ```[ " * ", "outra_coluna"]``` vai retornar error, use sempre ``[ " * " ]`` sozinho!

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let payload = {
      table: "EX_USER",
      columns: ["*"],
      where: {
        name: "Fulano",
        email_address: "fulano@ciclano.me"
      }
    }

   let response = await orcl.select(payload)
  ...
```
Obs1: Caso não seja informado  a **columns** ``[ " * " ]`` mantendo somente **table** com ou sem **where** ele retornar todas as colunas.
Ex:
```javascript
...
 let payload = {
      table: "EX_USER",
      where: {
        name: "Fulano",
        email_address: "fulano@ciclano.me"
      }
    }
...
```
Obs2: Caso queira fazer um **where** mais especifico use **handsFreeWhere** ao inves do **where**.
Ex: 
``` 
 handsFreeWhere: `idade >= 18 and uf = "RJ"`
``` 

------------

- Exemplo de execute Procedure

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

   let response = await orcl.exec_procedure(payload)
  ...
```

------------


- Exemplo de execute Function

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

   let response = await orcl.exec_function(payload)
  ...
```

# DMLs
Recurso de DML é usado para criação, atualização e deleção de tabelas, para usufruir desses comandos é necessário que o usuário informado tenha grant de **create**, **update**, **delete** no schema.

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

    let response = await orcl.create_table({ table: payload.table, columns: payload.columns, trigger: payload.trigger })
  ...
```

------------

- Exemplo de uma drop table
- **ATENÇÃO**: Por default as informações de **cascade** são **false**.

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let response = await orcl.drop_table({ table: "EX_USER", casc: true })
  ...
```

------------

- Exemplo de uma truncate table

```javascript
  ...
    const orcl = new Oracle(dbora.auth)
    let response = await orcl.truncate({ table: "EX_USER" })
  ...
```

# Pague um :coffee:

- Use o PIX, escaneia o QRCode abaixo

<img src="https://i.ibb.co/VVxsZ1f/Whats-App-Image-2020-12-04-at-21-09-50.jpg" height="200" />